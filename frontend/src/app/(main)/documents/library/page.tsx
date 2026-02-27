/**
 * @project AncestorTree
 * @file src/app/(main)/documents/library/page.tsx
 * @description Kho tài liệu — gallery view with category filter and search
 * @version 1.0.0
 * @updated 2026-02-27
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDocuments } from '@/hooks/use-documents';
import { usePeople } from '@/hooks/use-people';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Search, Image, FileText, Map, Video, PenLine, File, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import type { DocumentCategory, ClanDocument } from '@/types';
import { DOCUMENT_CATEGORY_LABELS } from '@/types';

const ALL_CATEGORIES: DocumentCategory[] = ['anh_lich_su', 'giay_to', 'ban_do', 'video', 'bai_viet', 'khac'];

const CATEGORY_ICONS: Record<DocumentCategory, typeof Image> = {
  anh_lich_su: Image,
  giay_to: FileText,
  ban_do: Map,
  video: Video,
  bai_viet: PenLine,
  khac: File,
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageUrl(url: string, fileType?: string): boolean {
  if (fileType?.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export default function DocumentLibraryPage() {
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | undefined>();
  const [search, setSearch] = useState('');
  const { data: documents, isLoading } = useDocuments(categoryFilter, search || undefined);
  const { data: people } = usePeople();

  const peopleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of people || []) map[p.id] = p.display_name;
    return map;
  }, [people]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents"><ArrowLeft className="h-4 w-4 mr-1" />Tài liệu</Link>
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Archive className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kho tài liệu</h1>
            <p className="text-muted-foreground">Ảnh lịch sử, giấy tờ, bản đồ, video — ký ức dòng họ</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={categoryFilter === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(undefined)}
          >
            Tất cả
          </Button>
          {ALL_CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat === categoryFilter ? undefined : cat)}
            >
              {DOCUMENT_CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : !documents || documents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Archive className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {search || categoryFilter ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              personName={doc.person_id ? peopleMap[doc.person_id] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentCard({ doc, personName }: { doc: ClanDocument; personName?: string }) {
  const Icon = CATEGORY_ICONS[doc.category] || File;
  const isImage = isImageUrl(doc.file_url, doc.file_type);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail / Icon area */}
      {isImage ? (
        <div className="h-40 bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.file_url}
            alt={doc.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-28 bg-gray-50 flex items-center justify-center">
          <Icon className="h-10 w-10 text-gray-300" />
        </div>
      )}

      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-2">{doc.title}</h3>
          <Badge variant="outline" className="text-xs shrink-0">
            {DOCUMENT_CATEGORY_LABELS[doc.category]}
          </Badge>
        </div>

        {doc.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            {personName && <span>{personName}</span>}
            {doc.file_size ? <span>{formatFileSize(doc.file_size)}</span> : null}
          </div>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
          >
            {isImage ? <ExternalLink className="h-3 w-3" /> : <Download className="h-3 w-3" />}
            {isImage ? 'Xem' : 'Tải'}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
