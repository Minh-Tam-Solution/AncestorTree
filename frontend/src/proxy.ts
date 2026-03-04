/**
 * @project AncestorTree
 * @file src/middleware.ts
 * @description Auth middleware for protected routes — Next.js 16 convention
 * @version 1.6.1
 * @updated 2026-03-04
 *
 * Docker networking fix:
 * The browser client uses NEXT_PUBLIC_SUPABASE_URL (http://localhost:54321).
 * @supabase/supabase-js derives the auth storage key from the URL hostname:
 * sb-${hostname.split('.')[0]}-auth-token
 * So browser cookies are named: sb-localhost-auth-token
 *
 * The server (proxy) must use the SAME URL to look for the SAME cookie name.
 * But inside Docker, localhost = the container (not the host). So network calls
 * must be routed to host.docker.internal:54321 via a custom fetch wrapper.
 *
 * Rate limiting (in-memory, works in self-hosted next start / Docker):
 * - Auth pages (GET): prevents automated page enumeration
 * - Module-level Map persists across requests in the same process
 * - Primary defense is GoTrue (config.toml [auth.rate_limit]); this is secondary layer
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateEntry { count: number; windowStart: number; }

// Module-level store — persists across requests in self-hosted Next.js (next start / Docker).
const _rateLimitStore = new Map<string, RateEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/login':           { max: 20, windowMs: 60_000 },   // 20 page loads/min
  '/register':        { max: 10, windowMs: 60_000 },   // 10 page loads/min
  '/forgot-password': { max:  6, windowMs: 300_000 },  // 6 loads/5 min
  '/reset-password':  { max: 10, windowMs: 60_000 },   // 10 page loads/min
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

// Public paths: accessible without authentication (auth pages + landing + debug + cron)
// ADDED '/api/cron' to allow Vercel Cron jobs to bypass middleware auth.
const publicPaths = [
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password', 
  '/welcome', 
  '/api/debug',
  '/api/cron' 
  '/scripts'
];

const authPagePaths = ['/login', '/register', '/forgot-password', '/reset-password'];
const pendingVerificationPath = '/pending-verification';
const authRequiredPaths = [
  '/',
  '/people', '/tree', '/directory', '/events',
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

  if (process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true') {
    mwLog('INFO', 'desktop_bypass', { pathname });
    return NextResponse.next({ request: { headers: request.headers } });
  }

  if (pathname in RATE_LIMITS) {
    const ip = _getClientIp(request);
    const { allowed, retryAfterSec } = _checkRateLimit(ip, pathname);
    if (!allowed) {
      mwLog('WARN', 'rate_limit_exceeded', { pathname, ip, retryAfterSec });
      return new NextResponse(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', retryAfter: retryAfterSec }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(RATE_LIMITS[pathname]?.max ?? 0),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(c => c.name.includes('auth') || c.name.includes('supabase') || c.name.startsWith('sb-'));

  const supabase = createServerClient(
    supabasePublicUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: dockerFetch,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: { id: string } | null = null;
  let authMethod = 'ok';
  const t0 = Date.now();
  let timedOut = false;
  
  try {
    const timeoutFlag = Symbol('timeout');
    const result = await Promise.race([
      supabase.auth.getUser().then(r => r.data.user),
      new Promise<typeof timeoutFlag>(resolve => setTimeout(() => resolve(timeoutFlag), 5000)),
    ]);
    if (result === timeoutFlag) {
      timedOut = true;
      authMethod = 'timeout';
      user = null;
    } else {
      user = result as { id: string } | null;
      authMethod = user ? 'ok' : 'no_session';
    }
  } catch (err) {
    authMethod = `error:${err instanceof Error ? err.message : String(err)}`;
    user = null;
  }

  // ─── Authorization Logic ────────────────────────────────────────────────────

  // Public paths (landing, auth pages, api/debug, and now API CRON) — always allow
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    if (user && authPagePaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      mwLog('INFO', 'redirect', { pathname, destination: '/', reason: 'authenticated_on_auth_page' });
      return NextResponse.redirect(new URL('/', request.url));
    }
    mwLog('INFO', 'allow', { pathname, reason: 'public_path' });
    return response;
  }

  // Redirect unauthenticated users from protected pages
  if (!user && authRequiredPaths.some(path => pathname.startsWith(path))) {
    if (pathname === '/') {
      mwLog('INFO', 'redirect', { pathname, destination: '/welcome', reason: 'unauthenticated_root' });
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
    mwLog('WARN', 'redirect', { pathname, destination: '/login', reason: 'unauthenticated', authMethod });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && (authRequiredPaths.some(path => pathname.startsWith(path)) || pathname === pendingVerificationPath)) {
    try {
      let profile: Record<string, any> | null = null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_verified, is_suspended')
        .eq('user_id', user.id)
        .single();

      if (error && !data) {
        mwLog('WARN', 'profile_fallback', { pathname, error: error.message });
        const { data: fallback } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        profile = fallback;
      } else {
        profile = data;
      }

      if (profile?.is_suspended === true) {
        mwLog('WARN', 'redirect', { pathname, destination: '/login?error=suspended', reason: 'suspended', userId: user.id });
        return NextResponse.redirect(new URL('/login?error=suspended', request.url));
      }

      if (!profile || (profile.is_verified !== true && profile.role !== 'admin' && profile.role !== 'editor')) {
        if (pathname !== pendingVerificationPath) {
          mwLog('WARN', 'redirect', { pathname, destination: pendingVerificationPath, reason: 'unverified', userId: user.id });
          return NextResponse.redirect(new URL(pendingVerificationPath, request.url));
        }
        return response;
      }

      if (pathname === pendingVerificationPath) {
        mwLog('INFO', 'redirect', { pathname, destination: '/', reason: 'already_verified' });
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (pathname.startsWith('/admin')) {
        mwLog('INFO', 'admin_check', { pathname, userId: user.id, role: profile?.role ?? null });
        if (profile?.role !== 'admin' && profile?.role !== 'editor') {
          mwLog('WARN', 'redirect', { pathname, destination: '/', reason: 'insufficient_role', role: profile?.role });
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (err) {
      mwLog('ERROR', 'profile_check_failed', { pathname, error: err instanceof Error ? err.message : String(err) });
      if (pathname !== pendingVerificationPath) {
        return NextResponse.redirect(new URL(pendingVerificationPath, request.url));
      }
    }
  }

  mwLog('INFO', 'allow', { pathname, userId: user?.id ?? null });
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
