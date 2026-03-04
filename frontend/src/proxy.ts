/**
 * @project AncestorTree
 * @file frontend/src/middleware.ts (proxied via proxy.ts)
 * @description Auth middleware with Vercel Cron bypass
 * @version 1.6.2
 * @updated 2026-03-04
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateEntry { count: number; windowStart: number; }
const _rateLimitStore = new Map<string, RateEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/login':           { max: 20, windowMs: 60_000 },
  '/register':        { max: 10, windowMs: 60_000 },
  '/forgot-password': { max:  6, windowMs: 300_000 },
  '/reset-password':  { max: 10, windowMs: 60_000 },
};

function _getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

function _checkRateLimit(ip: string, pathname: string): { allowed: boolean; retryAfterSec: number } {
  const cfg = RATE_LIMITS[pathname];
  if (!cfg) return { allowed: true, retryAfterSec: 0 };

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = _rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > cfg.windowMs) {
    _rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= cfg.max) {
    const retryAfterSec = Math.ceil((cfg.windowMs - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

// ─── Path Configuration ───────────────────────────────────────────────────────

const publicPaths = [
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password', 
  '/welcome', 
  '/api/debug',
  '/api/cron' // IMPORTANT: This allows the Vercel Cron bypass
];

const authPagePaths = ['/login', '/register', '/forgot-password', '/reset-password'];
const pendingVerificationPath = '/pending-verification';
const authRequiredPaths = [
  '/', '/people', '/tree', '/directory', '/events',
  '/achievements', '/charter', '/cau-duong', '/contributions',
  '/documents', '/fund', '/admin', '/help', '/settings',
];

const LOG_ENABLED = process.env.MIDDLEWARE_LOG === 'true' || process.env.NODE_ENV === 'development';

function mwLog(level: 'INFO' | 'WARN' | 'ERROR', event: string, data: Record<string, unknown>) {
  if (!LOG_ENABLED) return;
  const entry = JSON.stringify({ ts: new Date().toISOString(), level, event, ...data });
  if (level === 'ERROR') {
    console.error(`[MW] ${entry}`);
  } else {
    console.log(`[MW] ${entry}`);
  }
}

function makeDockerAwareFetch() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalUrl = process.env.SUPABASE_INTERNAL_URL;

  if (!publicUrl || !internalUrl || internalUrl === publicUrl) {
    return fetch as typeof fetch;
  }

  return async function dockerFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' && input.startsWith(publicUrl)) {
      input = input.replace(publicUrl, internalUrl);
    }
    return fetch(input, init);
  };
}

const dockerFetch = makeDockerAwareFetch();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. FAST BYPASS: If public path (like /api/cron), return immediately
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // Redirect authenticated users away from auth pages only
    if (authPagePaths.some(p => pathname === p)) {
        const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabase = createServerClient(supabasePublicUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            global: { fetch: dockerFetch },
            cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} }
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true') {
    return NextResponse.next();
  }

  // Rate Limiting
  if (pathname in RATE_LIMITS) {
    const { allowed, retryAfterSec } = _checkRateLimit(_getClientIp(request), pathname);
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient(
    supabasePublicUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: dockerFetch },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated
  if (!user && authRequiredPaths.some(path => pathname.startsWith(path))) {
    const dest = pathname === '/' ? '/welcome' : '/login';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Verification Logic
  if (user && (authRequiredPaths.some(path => pathname.startsWith(path)) || pathname === pendingVerificationPath)) {
    const { data: profile } = await supabase.from('profiles').select('role, is_verified, is_suspended').eq('user_id', user.id).single();
    
    if (profile?.is_suspended) return NextResponse.redirect(new URL('/login?error=suspended', request.url));

    if (!profile || (profile.is_verified !== true && profile.role !== 'admin' && profile.role !== 'editor')) {
      if (pathname !== pendingVerificationPath) return NextResponse.redirect(new URL(pendingVerificationPath, request.url));
      return response;
    }
    
    if (pathname === pendingVerificationPath) return NextResponse.redirect(new URL('/', request.url));

    if (pathname.startsWith('/admin') && (profile.role !== 'admin' && profile.role !== 'editor')) {
        return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
