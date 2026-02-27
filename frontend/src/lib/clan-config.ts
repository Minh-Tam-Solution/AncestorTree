/**
 * @project AncestorTree
 * @file src/lib/clan-config.ts
 * @description Clan name configuration from environment variables
 * @version 1.0.0
 * @updated 2026-02-27
 */

// Short clan name (e.g. "Họ Đặng")
export const CLAN_NAME = process.env.NEXT_PUBLIC_CLAN_NAME || 'Họ Đặng';

// Full clan name with location (e.g. "Họ Đặng làng Kỷ Các")
export const CLAN_FULL_NAME = process.env.NEXT_PUBLIC_CLAN_FULL_NAME || 'Họ Đặng làng Kỷ Các';

// Derived: first letter of the family surname (e.g. "Đ" from "Họ Đặng")
const parts = CLAN_NAME.split(' ');
export const CLAN_INITIAL = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][0];

// Derived: location subtitle (e.g. "làng Kỷ Các" from full name minus short name)
export const CLAN_SUBTITLE = CLAN_FULL_NAME.startsWith(CLAN_NAME)
  ? CLAN_FULL_NAME.slice(CLAN_NAME.length).trim()
  : '';
