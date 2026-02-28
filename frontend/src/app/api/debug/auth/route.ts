/**
 * @project AncestorTree
 * @file src/app/api/debug/auth/route.ts
 * @description Debug endpoint: inspect auth state, env vars, Supabase connectivity.
 *              Only active when DEBUG_AUTH=true env var is set.
 *              Usage: GET /api/debug/auth
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Guard: only enabled when DEBUG_AUTH=true (never expose in production without this flag)
function isDebugEnabled(): boolean {
  return process.env.DEBUG_AUTH === 'true';
}

export async function GET(request: NextRequest) {
  if (!isDebugEnabled()) {
    return NextResponse.json({ error: 'Debug endpoint disabled. Set DEBUG_AUTH=true to enable.' }, { status: 403 });
  }

  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const supabaseInternalUrl = process.env.SUPABASE_INTERNAL_URL ?? '(not set)';
  // Network calls go to internalUrl (container→host), but storageKey uses publicUrl hostname
  const networkUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const cookieKeyUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Derive expected cookie name: sb-${hostname.split('.')[0]}-auth-token
  const expectedCookieName = cookieKeyUrl
    ? `sb-${new URL(cookieKeyUrl).hostname.split('.')[0]}-auth-token`
    : 'unknown';

  // Connectivity probe: attempt to reach Supabase via internal URL
  let supabaseReachable = false;
  let supabaseHealthError: string | null = null;
  const t0 = Date.now();
  try {
    const res = await fetch(`${networkUrl}/rest/v1/`, {
      headers: { apikey: anonKey ?? '', Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(4000),
    });
    supabaseReachable = res.ok || res.status === 404;
  } catch (err) {
    supabaseHealthError = err instanceof Error ? err.message : String(err);
  }
  const probeMs = Date.now() - t0;

  // Docker-aware fetch: rewrites publicUrl → networkUrl for server-side API calls
  const dockerFetch = (!networkUrl || networkUrl === cookieKeyUrl)
    ? fetch
    : (input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof input === 'string' && cookieKeyUrl && input.startsWith(cookieKeyUrl)) {
          input = input.replace(cookieKeyUrl, networkUrl);
        }
        return fetch(input, init);
      };

  // Auth check: use publicUrl for cookie name consistency, dockerFetch for network
  let userId: string | null = null;
  let authError: string | null = null;
  const supabase = createServerClient(
    cookieKeyUrl,   // Storage key derived from this URL = sb-localhost-auth-token
    anonKey ?? '',
    {
      global: { fetch: dockerFetch as typeof fetch },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
  try {
    const { data, error } = await supabase.auth.getUser();
    userId = data?.user?.id ?? null;
    authError = error?.message ?? null;
  } catch (err) {
    authError = err instanceof Error ? err.message : String(err);
  }

  const cookies = request.cookies.getAll().map(c => c.name);
  const hasAuthCookie = cookies.some(n => n.startsWith('sb-'));

  return NextResponse.json({
    debug: true,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: supabasePublicUrl,
      SUPABASE_INTERNAL_URL: supabaseInternalUrl,
      networkUrl,
      cookieKeyUrl,
      expectedCookieName,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? `${anonKey.slice(0, 20)}…` : '(not set)',
      SUPABASE_SERVICE_ROLE_KEY: serviceKey ? `${serviceKey.slice(0, 20)}…` : '(not set)',
      BACKUP_DIR: process.env.BACKUP_DIR ?? '(not set)',
      NEXT_PUBLIC_CLAN_NAME: process.env.NEXT_PUBLIC_CLAN_NAME ?? '(not set)',
      MIDDLEWARE_LOG: process.env.MIDDLEWARE_LOG ?? '(not set)',
    },
    supabase: {
      reachable: supabaseReachable,
      probeMs,
      healthError: supabaseHealthError,
    },
    auth: {
      userId,
      authenticated: !!userId,
      authError,
      hasAuthCookie,
      cookies,
    },
  });
}
