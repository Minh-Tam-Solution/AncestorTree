-- ══════════════════════════════════════════════════════════════
-- Sprint 12: Privacy, Verification & Sub-admin
-- AncestorTree v2.3.0
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles: verification + sub-admin fields (NOT NULL to avoid three-valued logic — ISS-15)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_verify_members BOOLEAN NOT NULL DEFAULT false;

-- Existing users auto-verified (don't break current logins)
UPDATE profiles SET is_verified = true WHERE created_at < NOW();

-- 2. Documents: privacy_level (0=public, 1=members, 2=private/admin+editor only)
ALTER TABLE clan_documents ADD COLUMN IF NOT EXISTS privacy_level SMALLINT NOT NULL DEFAULT 1
  CHECK (privacy_level IN (0, 1, 2));

-- 3. Documents RLS: privacy-aware SELECT policies
-- All document reads require authentication (ISS-06)
DROP POLICY IF EXISTS "Authenticated users can view documents" ON clan_documents;

CREATE POLICY "Auth view public documents" ON clan_documents
  FOR SELECT USING (auth.uid() IS NOT NULL AND privacy_level = 0);

CREATE POLICY "Auth view members-only documents" ON clan_documents
  FOR SELECT USING (auth.uid() IS NOT NULL AND privacy_level = 1);

CREATE POLICY "Admins and editors view all documents" ON clan_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 4. Sub-admin: editors with can_verify_members can verify profiles in their subtree
-- WITH CHECK ensures sub-admins can ONLY toggle is_verified, not escalate role/permissions (ISS-01)
CREATE POLICY "Sub-admins verify members in subtree" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'editor') AND p.can_verify_members = true
      AND (p.edit_root_person_id IS NULL
           OR (profiles.linked_person IS NOT NULL
               AND is_person_in_subtree(p.edit_root_person_id, profiles.linked_person)))
    )
  )
  WITH CHECK (
    -- Sub-admins may only change is_verified; all other fields must remain unchanged.
    -- Compare every sensitive column against its pre-update value via subselect.
    role = (SELECT role FROM profiles p2 WHERE p2.id = profiles.id)
    AND can_verify_members = (SELECT can_verify_members FROM profiles p2 WHERE p2.id = profiles.id)
    AND email = (SELECT email FROM profiles p2 WHERE p2.id = profiles.id)
  );

-- Index for privacy_level RLS (ISS-11)
CREATE INDEX IF NOT EXISTS idx_clan_documents_privacy_level ON clan_documents (privacy_level);
