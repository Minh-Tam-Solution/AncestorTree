-- ─── Migration 005: User Verification ────────────────────────────────────────
-- Adds is_verified column to profiles (SQLite equivalent of Supabase migration 010)
-- Desktop mode: single admin user — always verified by default.

ALTER TABLE profiles ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1;

-- Mark existing desktop admin as verified
UPDATE profiles SET is_verified = 1 WHERE role = 'admin';
