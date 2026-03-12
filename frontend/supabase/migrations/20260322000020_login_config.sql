-- ============================================================
-- Migration: Login Config
-- Adds login_config JSONB to clan_settings for configurable
-- login methods (email+password, OTP email)
-- ============================================================

ALTER TABLE clan_settings
  ADD COLUMN IF NOT EXISTS login_config JSONB NOT NULL DEFAULT '{"methods":["email_password","email_otp"],"otp_expiry_minutes":15}';

-- Backfill existing rows (singleton table)
UPDATE clan_settings
SET login_config = '{"methods":["email_password","email_otp"],"otp_expiry_minutes":15}'
WHERE login_config IS NULL OR login_config = 'null';

-- Verify
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clan_settings' AND column_name = 'login_config'
  ) THEN
    RAISE EXCEPTION 'login_config column not found';
  END IF;
END $$;
