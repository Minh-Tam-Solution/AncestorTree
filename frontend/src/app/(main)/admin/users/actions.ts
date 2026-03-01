/**
 * @project AncestorTree
 * @file src/app/(main)/admin/users/actions.ts
 * @description Server actions for admin user management.
 *              Deletion requires the Supabase service-role key (admin API),
 *              which must not be exposed to the browser — hence a server action.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase';

/**
 * Permanently delete a user account from Supabase Auth.
 * The corresponding profiles row is removed automatically via ON DELETE CASCADE.
 *
 * Security:
 * - Only callable server-side (Next.js Server Action)
 * - Uses SUPABASE_SERVICE_ROLE_KEY — never exposed to browser
 * - Caller must be admin (ISS-02: authorization check)
 * - Desktop mode: not applicable (no real Supabase Auth in desktop)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  if (!userId) throw new Error('userId is required');

  // ISS-02: Verify caller is admin before using service-role key
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) throw new Error('Unauthorized: not authenticated');

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', caller.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    throw new Error('Unauthorized: admin role required');
  }

  const adminClient = createServiceRoleClient();

  // Confirm user exists before attempting delete
  const { data: { user }, error: lookupError } = await adminClient.auth.admin.getUserById(userId);
  if (lookupError || !user) throw new Error('User not found');

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw error;
}
