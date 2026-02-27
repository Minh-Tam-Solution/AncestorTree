/**
 * @project AncestorTree
 * @file src/lib/supabase-data-documents.ts
 * @description Supabase data functions for clan documents (Kho tài liệu)
 * @version 1.0.0
 * @updated 2026-02-27
 */

import { supabase } from './supabase';
import type { ClanDocument, DocumentCategory, CreateClanDocumentInput, UpdateClanDocumentInput } from '@/types';

export async function getDocuments(category?: DocumentCategory, search?: string): Promise<ClanDocument[]> {
  let query = supabase
    .from('clan_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getDocument(id: string): Promise<ClanDocument | null> {
  const { data, error } = await supabase
    .from('clan_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getDocumentsByPerson(personId: string): Promise<ClanDocument[]> {
  const { data, error } = await supabase
    .from('clan_documents')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDocument(input: CreateClanDocumentInput): Promise<ClanDocument> {
  const { data, error } = await supabase
    .from('clan_documents')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocument(id: string, input: UpdateClanDocumentInput): Promise<ClanDocument> {
  const { data, error } = await supabase
    .from('clan_documents')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('clan_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadDocumentFile(file: File, path: string): Promise<string> {
  const isDesktop = typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

  if (isDesktop) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/media/documents/${path}`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return `/api/media/documents/${path}`;
  }

  const { error } = await supabase.storage
    .from('media')
    .upload(`documents/${path}`, file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(`documents/${path}`);

  return urlData.publicUrl;
}

export async function deleteDocumentFile(fileUrl: string): Promise<void> {
  const isDesktop = typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

  if (isDesktop) {
    const path = fileUrl.replace('/api/media/', '');
    await fetch(`/api/media/${path}`, { method: 'DELETE' });
    return;
  }

  const path = fileUrl.split('/media/').pop();
  if (path) {
    await supabase.storage.from('media').remove([path]);
  }
}
