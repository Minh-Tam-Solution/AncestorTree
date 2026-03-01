/**
 * @project AncestorTree
 * @file src/middleware.ts
 * @description Auth middleware for protected routes — Next.js 16 convention
 * @version 1.6.0
 * @updated 2026-03-01
 *
 * Docker networking fix:
 *   The browser client uses NEXT_PUBLIC_SUPABASE_URL (http://localhost:54321).
 *   @supabase/supabase-js derives the auth storage key from the URL hostname:
 *     sb-${hostname.split('.')[0]}-auth-token
 *   So browser cookies are named: sb-localhost-auth-token
 *
 *   The server (proxy) must use the SAME URL to look for the SAME cookie name.
 *   But inside Docker, localhost = the container (not the host). So network calls
 *   must be routed to host.docker.internal:54321 via a custom fetch wrapper.
 *
 * Rate limiting (in-memory, works in self-hosted next start / Docker):
 *   - Auth pages (GET): prevents automated page enumeration
 *   - Module-level Map persists across requests in the same process
 *   - Primary defense is GoTrue (config.toml [auth.rate_limit]); this is secondary layer
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateEntry { count: number; windowStart: number; }

// Module-level store — persists across requests in self-hosted Next.js (next start / Docker).
// In true Edge workers (Vercel), each isolate is fresh — that's fine; GoTrue handles it there.
const _rateLimitStore = new Map<string, RateEntry>();

// Limits: deliberately lenient (operational priority) — stops bots, not impatient humans.
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

  // Passive cleanup: reset if window has expired
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

// Public paths: accessible without authentication (auth pages + landing + debug)
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/welcome', '/api/debug'];
// Auth pages only: authenticated users are redirected away from these (not from /welcome or /api/*)
const authPagePaths = ['/login', '/register', '/forgot-password', '/reset-password'];
// Accessible when authenticated but NOT yet verified by admin
const pendingVerificationPath = '/pending-verification';
// All main app routes require authentication to protect personal data.
const authRequiredPaths = [
  '/',
  '/people', '/tree', '/directory', '/events',
  '/achievements', '/charter', '/cau-duong', '/contributions',
  '/documents', '/fund', '/admin', '/help', '/settings',
];

// Structured logger — writes to stdout (visible in `docker compose logs -f app`)
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

/**
 * Creates a fetch function that rewrites NEXT_PUBLIC_SUPABASE_URL → SUPABASE_INTERNAL_URL.
 * This allows:
 *   - createServerClient to use NEXT_PUBLIC_SUPABASE_URL (correct storage key / cookie name)
 *   - Actual HTTP requests to go to host.docker.internal:54321 (reachable from container)
 */
function makeDockerAwareFetch() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalUrl = process.env.SUPABASE_INTERNAL_URL;

  // Only rewrite if both are set and different (i.e., running in Docker)
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

  // Desktop mode: bypass all auth — single-user admin, no Supabase Auth
  if (process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true') {
    mwLog('INFO', 'desktop_bypass', { pathname });
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // Rate limiting — secondary layer for auth page enumeration protection.
  // Primary defense: GoTrue rate limits in supabase/config.toml [auth.rate_limit].
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

  // Always use NEXT_PUBLIC_SUPABASE_URL so the storage key (cookie name) matches the browser.
  // Network requests are routed via dockerFetch to SUPABASE_INTERNAL_URL when in Docker.
  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(c => c.name.includes('auth') || c.name.includes('supabase') || c.name.startsWith('sb-'));
  mwLog('INFO', 'request', {
    pathname,
    supabasePublicUrl,
    cookieCount: allCookies.length,
    authCookieNames: authCookies.map(c => c.name),
    hasAuthCookie: authCookies.length > 0,
  });

  const supabase = createServerClient(
    supabasePublicUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // dockerFetch rewrites localhost → host.docker.internal for server-side requests
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

  // getUser() reads the session from cookies (storage key = sb-localhost-auth-token),
  // then makes a network call to Supabase to validate. dockerFetch rewrites the URL.
  // Race with a 5-second timeout: on timeout treat user as unauthenticated.
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

  mwLog(user ? 'INFO' : 'WARN', 'auth_check', {
    pathname,
    userId: user?.id ?? null,
    authMethod,
    timedOut,
    elapsedMs: Date.now() - t0,
    hasAuthCookie: authCookies.length > 0,
  });

  // Public paths (landing, auth pages, api/debug) — always allow
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // Redirect authenticated users away from auth pages only (not /welcome, not /api/*)
    if (user && authPagePaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      mwLog('INFO', 'redirect', { pathname, destination: '/', reason: 'authenticated_on_auth_page' });
      return NextResponse.redirect(new URL('/', request.url));
    }
    mwLog('INFO', 'allow', { pathname, reason: 'public_path' });
    return response;
  }

  // Redirect unauthenticated users from protected pages to login
  if (!user && authRequiredPaths.some(path => pathname.startsWith(path))) {
    mwLog('WARN', 'redirect', { pathname, destination: '/login', reason: 'unauthenticated', authMethod });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Fetch profile for verification + role checks
  // Try full query first; fall back to role-only if Sprint 12 columns not yet migrated
  if (user && (authRequiredPaths.some(path => pathname.startsWith(path)) || pathname === pendingVerificationPath)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let profile: Record<string, any> | null = null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_verified, is_suspended')
        .eq('user_id', user.id)
        .single();

      if (error && !data) {
        // Sprint 12 columns may not exist yet — fall back to role-only query
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

      // Suspended users are blocked immediately (ISS-01: defense-in-depth)
      if (profile?.is_suspended === true) {
        mwLog('WARN', 'redirect', { pathname, destination: '/login?error=suspended', reason: 'suspended', userId: user.id });
        return NextResponse.redirect(new URL('/login?error=suspended', request.url));
      }

      // Unverified users can only access /pending-verification (and sign out)
      // Admin and editor accounts bypass verification — they ARE the verifiers
      // Use !== true (not === false) so null/missing profile also blocks access (ISS-03)
      if (!profile || (profile.is_verified !== true && profile.role !== 'admin' && profile.role !== 'editor')) {
        if (pathname !== pendingVerificationPath) {
          mwLog('WARN', 'redirect', { pathname, destination: pendingVerificationPath, reason: 'unverified', userId: user.id });
          return NextResponse.redirect(new URL(pendingVerificationPath, request.url));
        }
        return response;
      }

      // Verified user on /pending-verification → redirect to home
      if (pathname === pendingVerificationPath) {
        mwLog('INFO', 'redirect', { pathname, destination: '/', reason: 'already_verified' });
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Admin routes require admin or editor role
      if (pathname.startsWith('/admin')) {
        mwLog('INFO', 'admin_check', { pathname, userId: user.id, role: profile?.role ?? null });
        if (profile?.role !== 'admin' && profile?.role !== 'editor') {
          mwLog('WARN', 'redirect', { pathname, destination: '/', reason: 'insufficient_role', role: profile?.role });
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (err) {
      // On timeout/error, deny access — redirect to pending-verification as safe fallback (ISS-05)
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
