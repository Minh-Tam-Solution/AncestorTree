/**
 * @project AncestorTree
 * @file src/hooks/use-people.ts
 * @description React Query hooks for people data
 * @version 1.0.0
 * @updated 2026-02-24
 */

'use client';

import {
  createPerson,
  deletePerson,
  getPeople,
  getPeopleByGeneration,
  getPerson,
  getStats,
  searchPeople,
  searchPeopleAdvanced,
  updatePerson,
} from '@/lib/supabase-data';
import type { CreatePersonInput, UpdatePersonInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys
export const peopleKeys = {
  all: ['people'] as const,
  lists: () => [...peopleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...peopleKeys.lists(), filters] as const,
  details: () => [...peopleKeys.all, 'detail'] as const,
  detail: (id: string) => [...peopleKeys.details(), id] as const,
  search: (query: string) => [...peopleKeys.all, 'search', query] as const,
  byGeneration: (gen: number) =>
    [...peopleKeys.all, 'generation', gen] as const,
  stats: () => [...peopleKeys.all, 'stats'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePeople() {
  return useQuery({
    queryKey: peopleKeys.lists(),
    queryFn: getPeople,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.detail(id!),
    queryFn: () => getPerson(id!),
    enabled: !!id,
  });
}

export function useSearchPeople(query: string) {
  return useQuery({
    queryKey: peopleKeys.search(query),
    queryFn: () => searchPeople(query),
    enabled: query.length >= 2,
  });
}

export function useSearchPeopleAdvanced(query: string, ignoreAccents: boolean = true) {
  return useQuery({
    queryKey: peopleKeys.search(query),
    queryFn: () => searchPeopleAdvanced(query, ignoreAccents),
    enabled: query.length >= 2,
  });
}

export function usePeopleByGeneration(generation: number) {
  return useQuery({
    queryKey: peopleKeys.byGeneration(generation),
    queryFn: () => getPeopleByGeneration(generation),
  });
}

export function useStats() {
  return useQuery({
    queryKey: peopleKeys.stats(),
    queryFn: getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePersonInput) => createPerson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePersonInput }) =>
      updatePerson(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}
