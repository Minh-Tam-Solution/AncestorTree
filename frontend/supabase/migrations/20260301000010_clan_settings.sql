-- ═══════════════════════════════════════════════════════════════════════════
-- Clan Settings — Dynamic configuration for clan information
-- Singleton table: one row, updated via admin UI
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clan_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_name        VARCHAR(200) NOT NULL DEFAULT 'Họ Đặng',
  clan_full_name   VARCHAR(500) NOT NULL DEFAULT 'Họ Đặng làng Kỷ Các',
  clan_founding_year INTEGER,
  clan_origin      VARCHAR(500),
  clan_patriarch   VARCHAR(200),
  clan_description TEXT,
  contact_email    VARCHAR(200),
  contact_phone    VARCHAR(50),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed one default row (singleton) using a fixed UUID so ON CONFLICT is meaningful
INSERT INTO clan_settings (id, clan_name, clan_full_name)
  VALUES ('00000000-0000-0000-0000-000000000001', 'Họ Đặng', 'Họ Đặng làng Kỷ Các')
  ON CONFLICT (id) DO NOTHING;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE clan_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotent re-run
DROP POLICY IF EXISTS "Authenticated users can view clan settings" ON clan_settings;
DROP POLICY IF EXISTS "Anonymous users can view clan settings" ON clan_settings;
DROP POLICY IF EXISTS "Admins and editors can update clan settings" ON clan_settings;

-- All authenticated users can read clan settings
CREATE POLICY "Authenticated users can view clan settings"
  ON clan_settings FOR SELECT TO authenticated
  USING (true);

-- Anonymous users can also read (needed for login page before auth)
CREATE POLICY "Anonymous users can view clan settings"
  ON clan_settings FOR SELECT TO anon
  USING (true);

-- Only admins and editors can update
CREATE POLICY "Admins and editors can update clan settings"
  ON clan_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- No INSERT or DELETE (singleton — managed via seed row only)
