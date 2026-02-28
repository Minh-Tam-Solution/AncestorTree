-- Sprint 12: Desktop mode (single-user admin, auto-verified)
ALTER TABLE profiles ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN can_verify_members INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clan_documents ADD COLUMN privacy_level INTEGER NOT NULL DEFAULT 1;

-- Desktop: admin auto-verified + can verify members
UPDATE profiles SET is_verified = 1, can_verify_members = 1 WHERE role = 'admin';
