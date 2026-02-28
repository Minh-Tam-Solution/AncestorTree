/**
 * @project AncestorTree
 * @file src/proxy.ts
 * @description Auth proxy for protected routes — Next.js 16 convention (replaces middleware.ts)
 * @version 2.0.0
 * @updated 2026-02-28
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
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public paths: accessible without authentication (auth pages + landing + debug)
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/welcome', '/api/debug'];
// Auth pages only: authenticated users are redirected away from these (not from /welcome or /api/*)
const authPagePaths = ['/login', '/register', '/forgot-password', '/reset-password'];
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

  // Admin routes require admin or editor role
  if (user && pathname.startsWith('/admin')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      mwLog('INFO', 'admin_check', { pathname, userId: user.id, role: profile?.role ?? null });

      if (profile?.role !== 'admin' && profile?.role !== 'editor') {
        mwLog('WARN', 'redirect', { pathname, destination: '/', reason: 'insufficient_role', role: profile?.role });
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      mwLog('ERROR', 'admin_check_failed', { pathname, error: err instanceof Error ? err.message : String(err) });
      return NextResponse.redirect(new URL('/', request.url));
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
