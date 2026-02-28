/**
 * @project AncestorTree
 * @file supabase/migrations/20260228000009_user_management.sql
 * @description Add account suspension fields to profiles table.
 *              MFA (TOTP) is managed entirely by Supabase Auth — no schema changes needed.
 * @version 1.0.0
 * @updated 2026-02-28
 */

-- ── Account Suspension ───────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- RLS: admins can update is_suspended and suspension_reason on any profile
-- (uses a separate UPDATE policy so it doesn't conflict with existing self-update policy)
CREATE POLICY "Admin can suspend or unsuspend accounts"
  ON profiles
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  )
  WITH CHECK (true);
