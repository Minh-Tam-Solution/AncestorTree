/**
 * @project AncestorTree
 * @file desktop/migrations/004-user-management.sql
 * @description Add account suspension fields to profiles table (SQLite).
 *              MFA is not applicable in single-user desktop mode.
 * @version 1.0.0
 * @updated 2026-02-28
 */

-- SQLite uses INTEGER for booleans (0 = false, 1 = true)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
