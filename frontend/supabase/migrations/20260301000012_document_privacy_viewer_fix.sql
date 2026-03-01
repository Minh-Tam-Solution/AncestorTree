-- ══════════════════════════════════════════════════════════════
-- Sprint 12 Fix: Document privacy_level=1 — restrict to editor/admin only
-- Viewers should only see public (privacy_level=0) documents.
-- AncestorTree v2.3.1
-- ══════════════════════════════════════════════════════════════

-- The previous policy allowed ALL authenticated users (incl. viewer) to read
-- privacy_level=1 documents. Per FR: viewer role sees public docs only.
DROP POLICY IF EXISTS "Auth view members-only documents" ON clan_documents;

CREATE POLICY "Members can view members-only documents" ON clan_documents
  FOR SELECT USING (
    privacy_level = 1
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
