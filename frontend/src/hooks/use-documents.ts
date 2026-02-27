/**
 * @project AncestorTree
 * @file src/hooks/use-documents.ts
 * @description React Query hooks for clan documents (Kho tài liệu)
 * @version 1.0.0
 * @updated 2026-02-27
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  getDocumentsByPerson,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
  deleteDocumentFile,
} from '@/lib/supabase-data-documents';
import type { DocumentCategory, CreateClanDocumentInput, UpdateClanDocumentInput } from '@/types';

// ─── Query Keys ─────────────────────────────────────────────────────

export const documentKeys = {
  all: ['clan_documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (category?: DocumentCategory, search?: string) =>
    [...documentKeys.lists(), { category, search }] as const,
  byPerson: (personId: string) => [...documentKeys.all, 'person', personId] as const,
};

// ─── Query Hooks ────────────────────────────────────────────────────

export function useDocuments(category?: DocumentCategory, search?: string) {
  return useQuery({
    queryKey: documentKeys.list(category, search),
    queryFn: () => getDocuments(category, search),
  });
}

export function usePersonDocuments(personId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.byPerson(personId!),
    queryFn: () => getDocumentsByPerson(personId!),
    enabled: !!personId,
  });
}

// ─── Mutation Hooks ─────────────────────────────────────────────────

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClanDocumentInput) => createDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClanDocumentInput }) =>
      updateDocument(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      await deleteDocumentFile(fileUrl);
      await deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useUploadDocumentFile() {
  return useMutation({
    mutationFn: ({ file, path }: { file: File; path: string }) =>
      uploadDocumentFile(file, path),
  });
}
