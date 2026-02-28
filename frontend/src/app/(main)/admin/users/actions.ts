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

import { createServiceRoleClient } from '@/lib/supabase';

/**
 * Permanently delete a user account from Supabase Auth.
 * The corresponding profiles row is removed automatically via ON DELETE CASCADE.
 *
 * Security:
 * - Only callable server-side (Next.js Server Action)
 * - Uses SUPABASE_SERVICE_ROLE_KEY — never exposed to browser
 * - Desktop mode: not applicable (no real Supabase Auth in desktop)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  if (!userId) throw new Error('userId is required');

  const adminClient = createServiceRoleClient();

  // Confirm user exists before attempting delete
  const { data: { user }, error: lookupError } = await adminClient.auth.admin.getUserById(userId);
  if (lookupError || !user) throw new Error('User not found');

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw error;
}
