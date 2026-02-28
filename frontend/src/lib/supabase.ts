import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const isDesktopMode = process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom fetch with 25-second timeout to prevent infinite hangs on Supabase free tier cold starts.
// Cold starts affect the Auth and PostgREST services independently from the DB (SQL Editor uses direct connection).
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Yêu cầu hết thời gian chờ. Supabase đang khởi động — vui lòng thử lại sau vài giây.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// No-op lock: bypasses Navigator LockManager to avoid 10s lock timeout errors
// caused by @supabase/ssr holding the Web Lock across hot-reload / multiple tabs.
// Safe for single-tab apps where concurrent token refreshes are rare.
const noopLock = async <T>(_name: string, _timeout: number, fn: () => Promise<T>): Promise<T> => fn();

function createSupabaseClient(): SupabaseClient {
  if (isDesktopMode) {
    // Desktop mode: use SQLite shim (duck-typed to match SupabaseClient API surface)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./supabase-desktop').desktopSupabase as SupabaseClient;
  }
  // Web mode: use real Supabase browser client (with fallback for build)
  if (supabaseUrl && supabaseAnonKey) {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      auth: { lock: noopLock },
    });
  }
  return createClient('https://placeholder.supabase.co', 'placeholder-key');
}

const supabase = createSupabaseClient();
export { supabase };

// Server-side client with service role (for admin operations)
// Named createServiceRoleClient to avoid confusion with @supabase/ssr's createServerClient
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  // In Docker, the container cannot resolve NEXT_PUBLIC_SUPABASE_URL if it points to
  // localhost (which inside Docker = the container itself). Use SUPABASE_INTERNAL_URL
  // (e.g. http://host.docker.internal:54321) for server-side calls from inside the container.
  const serverUrl = process.env.SUPABASE_INTERNAL_URL || supabaseUrl;
  return createClient(serverUrl, serviceRoleKey);
}
