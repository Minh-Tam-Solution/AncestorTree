/**
 * @project AncestorTree
 * @file src/app/(main)/admin/documents/page.tsx
 * @description Admin document management — CRUD for Kho tài liệu
 * @version 1.1.0
 * @updated 2026-02-28
 */

'use client';

import { useState, useMemo, useRef } from 'react';
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument, useUploadDocumentFile } from '@/hooks/use-documents';
import { usePeople } from '@/hooks/use-people';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Archive, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import type { ClanDocument, DocumentCategory, CreateClanDocumentInput, Person } from '@/types';
import { DOCUMENT_CATEGORY_LABELS } from '@/types';

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'anh_lich_su', label: 'Ảnh lịch sử' },
  { value: 'giay_to', label: 'Giấy tờ' },
  { value: 'ban_do', label: 'Bản đồ' },
  { value: 'video', label: 'Video' },
  { value: 'bai_viet', label: 'Bài viết' },
  { value: 'khac', label: 'Khác' },
];

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentForm({
  document: doc,
  people,
  onSubmit,
  isPending,
}: {
  document?: ClanDocument;
  people: Person[];
  onSubmit: (data: CreateClanDocumentInput, file?: File) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(doc?.title || '');
  const [category, setCategory] = useState<DocumentCategory>(doc?.category || 'khac');
  const [description, setDescription] = useState(doc?.description || '');
  const [tags, setTags] = useState(doc?.tags || '');
  const [personId, setPersonId] = useState(doc?.person_id || 'none');
  const [privacyLevel, setPrivacyLevel] = useState(doc?.privacy_level ?? 1);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!doc && !file) {
      toast.error('Vui lòng chọn file tải lên');
      return;
    }
    onSubmit({
      title,
      category,
      description: description || undefined,
      tags: tags || undefined,
      person_id: personId === 'none' ? undefined : personId || undefined,
      file_url: doc?.file_url || '',
      file_type: file?.type || doc?.file_type,
      file_size: file?.size || doc?.file_size,
      privacy_level: privacyLevel,
    }, file || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tiêu đề *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ảnh nhà thờ tổ năm 1960" />
      </div>
      {!doc && (
        <div>
          <Label>File *</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.mp4,.webm"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {file && (
            <p className="text-xs text-muted-foreground mt-1">
              {file.name} ({formatFileSize(file.size)})
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Danh mục</Label>
          <Select value={category} onValueChange={v => setCategory(v as DocumentCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Thành viên liên quan</Label>
          <Select value={personId} onValueChange={setPersonId}>
            <SelectTrigger><SelectValue placeholder="Không chọn" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không chọn</SelectItem>
              {people.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.display_name} (Đời {p.generation})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Mô tả</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả ngắn về tài liệu" />
      </div>
      <div>
        <Label>Tags (phân cách bằng dấu phẩy)</Label>
        <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="nhà thờ, lịch sử, 1960" />
      </div>
      <div>
        <Label>Quyền riêng tư</Label>
        <Select value={privacyLevel.toString()} onValueChange={v => setPrivacyLevel(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Công khai (ai cũng xem được)</SelectItem>
            <SelectItem value="1">Thành viên (đăng nhập mới xem)</SelectItem>
            <SelectItem value="2">Nội bộ (chỉ quản trị viên)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Đang lưu...' : (doc ? 'Cập nhật' : 'Tải lên')}
      </Button>
    </form>
  );
}

export default function AdminDocumentsPage() {
  const { isEditor } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClanDocument | undefined>();
  const [search, setSearch] = useState('');

  const { data: documents, isLoading } = useDocuments();
  const { data: people } = usePeople();
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();
  const uploadMutation = useUploadDocumentFile();

  const peopleMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people || []) map.set(p.id, p);
    return map;
  }, [people]);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents || [];
    const q = search.toLowerCase();
    return (documents || []).filter(d => {
      const person = d.person_id ? peopleMap.get(d.person_id) : undefined;
      return d.title.toLowerCase().includes(q) ||
        d.tags?.toLowerCase().includes(q) ||
        person?.display_name.toLowerCase().includes(q);
    });
  }, [documents, search, peopleMap]);

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
            <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = async (data: CreateClanDocumentInput, file?: File) => {
    if (!file) return;
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fileUrl = await uploadMutation.mutateAsync({ file, path: fileName });
      await createMutation.mutateAsync({
        ...data,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
      });
      toast.success('Đã tải lên tài liệu');
      setDialogOpen(false);
    } catch (err) {
      console.error('Document upload error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Lỗi khi tải lên: ${message}`);
    }
  };

  const handleUpdate = async (data: CreateClanDocumentInput) => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        input: {
          title: data.title,
          category: data.category,
          description: data.description,
          tags: data.tags,
          person_id: data.person_id === 'none' ? undefined : data.person_id,
          privacy_level: data.privacy_level,
        },
      });
      toast.success('Đã cập nhật tài liệu');
      setDialogOpen(false);
      setEditingItem(undefined);
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleDelete = async (doc: ClanDocument) => {
    try {
      await deleteMutation.mutateAsync({ id: doc.id, fileUrl: doc.file_url });
      toast.success('Đã xóa tài liệu');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Kho tài liệu</h1>
          <p className="text-muted-foreground">Tải lên, sửa, xóa tài liệu dòng họ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(undefined); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /><Upload className="h-4 w-4 mr-2" />Tải lên</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Sửa tài liệu' : 'Tải lên tài liệu mới'}</DialogTitle>
            </DialogHeader>
            <DocumentForm
              key={editingItem?.id || 'new'}
              document={editingItem}
              people={people || []}
              onSubmit={editingItem ? handleUpdate : handleCreate}
              isPending={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Tìm kiếm theo tiêu đề, tags, hoặc thành viên..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 h-16" /></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Archive className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Chưa có tài liệu nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const person = doc.person_id ? peopleMap.get(doc.person_id) : undefined;
            return (
              <Card key={doc.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        <Badge variant="outline" className="mr-1 text-xs">
                          {DOCUMENT_CATEGORY_LABELS[doc.category]}
                        </Badge>
                        {doc.privacy_level === 0 && (
                          <Badge className="mr-1 text-xs bg-green-100 text-green-800">Công khai</Badge>
                        )}
                        {doc.privacy_level === 1 && (
                          <Badge className="mr-1 text-xs bg-blue-100 text-blue-800">Thành viên</Badge>
                        )}
                        {doc.privacy_level === 2 && (
                          <Badge className="mr-1 text-xs bg-red-100 text-red-800">Nội bộ</Badge>
                        )}
                        {person && <span>{person.display_name} · </span>}
                        {formatFileSize(doc.file_size)}
                        {doc.tags && <span className="ml-1">· {doc.tags}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => { setEditingItem(doc); setDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa tài liệu?</AlertDialogTitle>
                          <AlertDialogDescription>
                            File &quot;{doc.title}&quot; sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(doc)}>Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
