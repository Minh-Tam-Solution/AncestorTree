/**
 * @project AncestorTree
 * @file src/hooks/use-profiles.ts
 * @description React Query hooks for user profiles
 * @version 1.2.0
 * @updated 2026-03-01
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfiles,
  getProfile,
  updateProfile,
  updateUserRole,
  updateLinkedPerson,
  updateEditRootPerson,
} from '@/lib/supabase-data';
import { deleteUserAccount } from '@/app/(main)/admin/users/actions';
import type { Profile, UserRole } from '@/types';

// Query keys
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  unverified: () => [...profileKeys.all, 'unverified'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn: getProfiles,
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(userId!),
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });
}

export function useUnverifiedProfiles() {
  return useQuery({
    queryKey: profileKeys.unverified(),
    queryFn: getUnverifiedProfiles,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: Partial<Profile> }) =>
      updateProfile(userId, input),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// FR-507: link a user to a person in the family tree
export function useUpdateLinkedPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, personId }: { userId: string; personId: string | null }) =>
      updateLinkedPerson(userId, personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// FR-508: set the subtree edit boundary for a branch editor
export function useUpdateEditRootPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, personId }: { userId: string; personId: string | null }) =>
      updateEditRootPerson(userId, personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
