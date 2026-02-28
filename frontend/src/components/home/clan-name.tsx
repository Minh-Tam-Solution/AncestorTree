/**
 * @project AncestorTree
 * @file src/components/home/clan-name.tsx
 * @description Client component that renders the dynamic clan full name.
 *              Uses useClanSettings() so the Supabase call is made from the
 *              browser (not the server), avoiding Docker networking issues
 *              where localhost:54321 is unreachable inside the container.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useClanSettings } from '@/hooks/use-clan-settings';
import { CLAN_FULL_NAME } from '@/lib/clan-config';

/** Renders the dynamic clan full name; falls back to env var while loading. */
export function ClanFullName() {
  const { data: cs } = useClanSettings();
  return <>{cs?.clan_full_name ?? CLAN_FULL_NAME}</>;
}
