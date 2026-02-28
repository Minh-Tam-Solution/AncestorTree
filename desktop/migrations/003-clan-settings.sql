-- ═══════════════════════════════════════════════════════════════════════════
-- AncestorTree Desktop — Clan Settings
-- SQLite version of clan_settings (singleton table)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clan_settings (
  id               TEXT PRIMARY KEY,
  clan_name        TEXT NOT NULL DEFAULT 'Họ Đặng',
  clan_full_name   TEXT NOT NULL DEFAULT 'Họ Đặng làng Kỷ Các',
  clan_founding_year INTEGER,
  clan_origin      TEXT,
  clan_patriarch   TEXT,
  clan_description TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  updated_at       TEXT DEFAULT (datetime('now')),
  updated_by       TEXT
);

-- Seed default singleton row
INSERT OR IGNORE INTO clan_settings (id, clan_name, clan_full_name)
  VALUES ('00000000-0000-0000-0000-000000000001', 'Họ Đặng', 'Họ Đặng làng Kỷ Các');
