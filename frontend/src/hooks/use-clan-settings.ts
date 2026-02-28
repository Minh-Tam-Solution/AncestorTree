/**
 * @project AncestorTree
 * @file src/hooks/use-clan-settings.ts
 * @description React Query hooks for clan settings (dynamic clan info)
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { getClanSettings, updateClanSettings } from '@/lib/supabase-data-clan-settings';
import type { UpdateClanSettingsInput } from '@/types';

export const clanSettingsKeys = {
  all: ['clan_settings'] as const,
};

/** Fetch clan settings from DB. staleTime=5min to avoid over-fetching. */
export function useClanSettings() {
  return useQuery({
    queryKey: clanSettingsKeys.all,
    queryFn: getClanSettings,
    staleTime: 5 * 60 * 1000,
  });
}

/** Update clan settings. Invalidates query cache on success. */
export function useUpdateClanSettings() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClanSettingsInput }) =>
      updateClanSettings(id, input, profile?.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clanSettingsKeys.all });
    },
  });
}
