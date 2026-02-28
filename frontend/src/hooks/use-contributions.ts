/**
 * @project AncestorTree
 * @file src/hooks/use-contributions.ts
 * @description React Query hooks for contributions data
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContributions,
  getContribution,
  createContribution,
  reviewContribution,
  getContributionsByPerson,
  deleteContribution,
} from '@/lib/supabase-data';
import type { Contribution, ContributionStatus } from '@/types';

export const contributionKeys = {
  all: ['contributions'] as const,
  lists: () => [...contributionKeys.all, 'list'] as const,
  list: (status?: ContributionStatus) => [...contributionKeys.lists(), { status }] as const,
  details: () => [...contributionKeys.all, 'detail'] as const,
  detail: (id: string) => [...contributionKeys.details(), id] as const,
  byPerson: (personId: string) => [...contributionKeys.all, 'person', personId] as const,
};

export function useContributions(status?: ContributionStatus) {
  return useQuery({
    queryKey: contributionKeys.list(status),
    queryFn: () => getContributions(status),
  });
}

export function useContribution(id: string | undefined) {
  return useQuery({
    queryKey: contributionKeys.detail(id!),
    queryFn: () => getContribution(id!),
    enabled: !!id,
  });
}

export function useContributionsByPerson(personId: string | undefined) {
  return useQuery({
    queryKey: contributionKeys.byPerson(personId!),
    queryFn: () => getContributionsByPerson(personId!),
    enabled: !!personId,
  });
}

export function useCreateContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      author_id: string;
      target_person: string;
      change_type: Contribution['change_type'];
      changes: Record<string, unknown>;
      reason?: string;
    }) => createContribution(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}

export function useDeleteContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}

export function useReviewContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reviewerId,
      reviewNotes,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reviewerId: string;
      reviewNotes?: string;
    }) => reviewContribution(id, status, reviewerId, reviewNotes),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contributionKeys.lists() });
      // If approved, person data was updated — invalidate people queries
      if (status === 'approved') {
        queryClient.invalidateQueries({ queryKey: ['people'] });
      }
    },
  });
}
