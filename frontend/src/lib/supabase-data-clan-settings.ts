/**
 * @project AncestorTree
 * @file src/lib/supabase-data-clan-settings.ts
 * @description Supabase data functions for clan settings (singleton table)
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { supabase } from './supabase';
import type { ClanSettings, UpdateClanSettingsInput } from '@/types';

/**
 * Get the clan settings (singleton row).
 * Returns null if the table is empty or not yet migrated.
 */
export async function getClanSettings(): Promise<ClanSettings | null> {
  const { data, error } = await supabase
    .from('clan_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update the clan settings row.
 * The row must already exist (seeded by migration).
 * Sets updated_by to the current authenticated user.
 */
export async function updateClanSettings(
  id: string,
  input: UpdateClanSettingsInput,
  userId?: string
): Promise<ClanSettings> {
  const { data, error } = await supabase
    .from('clan_settings')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
      ...(userId ? { updated_by: userId } : {}),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
