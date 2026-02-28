/**
 * @project AncestorTree
 * @file src/app/(main)/admin/contributions/page.tsx
 * @description Admin page to review and approve/reject contributions
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { usePeople } from '@/hooks/use-people';
import { useContributions, useReviewContribution, useDeleteContribution } from '@/hooks/use-contributions';
import { useProfiles } from '@/hooks/use-profiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  User,
  FileEdit,
  Trash2,
} from 'lucide-react';
import type { ContributionStatus, ChangeType, Contribution } from '@/types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<ContributionStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'text-amber-600' },
  approved: { label: 'Đã duyệt', color: 'text-green-600' },
  rejected: { label: 'Từ chối', color: 'text-destructive' },
};

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  create: 'Thêm mới',
  update: 'Cập nhật',
  delete: 'Xóa',
};

const FIELD_LABELS: Record<string, string> = {
  display_name: 'Họ tên',
  phone: 'Số điện thoại',
  email: 'Email',
  address: 'Địa chỉ',
  birth_year: 'Năm sinh',
  death_year: 'Năm mất',
  death_lunar: 'Ngày giỗ (ÂL)',
  occupation: 'Nghề nghiệp',
  biography: 'Tiểu sử',
  notes: 'Ghi chú',
};

export default function AdminContributionsPage() {
  const { profile, isAdmin } = useAuth();
  const { data: contributions, isLoading } = useContributions();
  const { data: people } = usePeople();
  const { data: profiles } = useProfiles();
  const reviewContribution = useReviewContribution();
  const deleteContribution = useDeleteContribution();

  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Bạn cần quyền quản trị viên để truy cập trang này
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredContributions = contributions?.filter(c =>
    statusFilter === 'all' ? true : c.status === statusFilter
  ) || [];

  const pendingCount = contributions?.filter(c => c.status === 'pending').length || 0;

  const handleDelete = async (c: Contribution) => {
    try {
      await deleteContribution.mutateAsync(c.id);
      toast.success('Đã xóa đề xuất');
    } catch {
      toast.error('Lỗi khi xóa đề xuất');
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    if (!profile) return;
    try {
      await reviewContribution.mutateAsync({
        id,
        status,
        reviewerId: profile.id,
        reviewNotes: reviewNotes[id],
      });
      toast.success(status === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối');
      setReviewNotes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      toast.error('Lỗi khi xử lý đề xuất');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quản trị
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <ClipboardList className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Duyệt đề xuất chỉnh sửa</h1>
            <p className="text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount} đề xuất đang chờ duyệt` : 'Không có đề xuất chờ duyệt'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Chờ duyệt ({pendingCount})</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Đã từ chối</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
        <CardDescription>
          {isLoading ? 'Đang tải...' : `${filteredContributions.length} đề xuất`}
        </CardDescription>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filteredContributions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {statusFilter === 'pending'
              ? 'Không có đề xuất chờ duyệt'
              : 'Không có đề xuất nào'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContributions.map(c => {
            const person = people?.find(p => p.id === c.target_person);
            const author = profiles?.find(p => p.id === c.author_id);
            const reviewer = c.reviewed_by
              ? profiles?.find(p => p.id === c.reviewed_by)
              : undefined;
            const statusInfo = STATUS_CONFIG[c.status];

            return (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={c.status === 'pending' ? 'default' : c.status === 'approved' ? 'secondary' : 'destructive'}
                      >
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="outline">
                        {CHANGE_TYPE_LABELS[c.change_type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa đề xuất?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Xóa vĩnh viễn đề xuất này. Hành động không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(c)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">
                    {person ? (
                      <Link href={`/people/${person.id}`} className="hover:underline">
                        {person.display_name}
                      </Link>
                    ) : (
                      'Thành viên không xác định'
                    )}
                  </CardTitle>
                  {author && (
                    <CardDescription className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Đề xuất bởi: {author.full_name || author.email}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Changes diff */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                      <FileEdit className="h-3.5 w-3.5" /> Thay đổi đề xuất
                    </div>
                    <div className="bg-muted rounded-lg p-3 space-y-1">
                      {Object.entries(c.changes).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="font-medium min-w-[120px]">
                            {FIELD_LABELS[key] || key}:
                          </span>
                          <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {String(val)}
                          </span>
                          {person && key in person && (
                            <span className="text-muted-foreground text-xs">
                              (hiện tại: {String((person as unknown as Record<string, string>)[key])})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {c.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Lý do: </span>
                      <span className="text-muted-foreground">{c.reason}</span>
                    </div>
                  )}

                  {/* Review section */}
                  {c.status === 'pending' && (
                    <div className="border-t pt-4 space-y-3">
                      <Textarea
                        placeholder="Ghi chú duyệt (tùy chọn)..."
                        value={reviewNotes[c.id] || ''}
                        onChange={e => setReviewNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReview(c.id, 'approved')}
                          disabled={reviewContribution.isPending}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Phê duyệt
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReview(c.id, 'rejected')}
                          disabled={reviewContribution.isPending}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" /> Từ chối
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Review result */}
                  {c.status !== 'pending' && (
                    <div className="border-t pt-3 text-sm text-muted-foreground">
                      {reviewer && <span>Duyệt bởi: {reviewer.full_name || reviewer.email}</span>}
                      {c.reviewed_at && (
                        <span> · {new Date(c.reviewed_at).toLocaleDateString('vi-VN')}</span>
                      )}
                      {c.review_notes && <p className="mt-1">Ghi chú: {c.review_notes}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
