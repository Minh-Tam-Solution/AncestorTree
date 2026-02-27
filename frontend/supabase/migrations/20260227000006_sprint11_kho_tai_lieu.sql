-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 11: Kho tài liệu (Document Repository)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Table
CREATE TABLE IF NOT EXISTS clan_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  category VARCHAR(50) NOT NULL DEFAULT 'khac',
  tags TEXT,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clan_documents_category ON clan_documents(category);
CREATE INDEX IF NOT EXISTS idx_clan_documents_person ON clan_documents(person_id);

-- 2. RLS
ALTER TABLE clan_documents ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all documents
CREATE POLICY "Authenticated users can view documents"
ON clan_documents FOR SELECT TO authenticated
USING (true);

-- Editors and admins can insert
CREATE POLICY "Editors and admins can create documents"
ON clan_documents FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Editors and admins can update
CREATE POLICY "Editors and admins can update documents"
ON clan_documents FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Editors and admins can delete
CREATE POLICY "Editors and admins can delete documents"
ON clan_documents FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);
