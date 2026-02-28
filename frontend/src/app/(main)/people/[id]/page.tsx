/**
 * @project AncestorTree
 * @file src/app/(main)/people/[id]/page.tsx
 * @description Person detail page
 * @version 2.0.0
 * @updated 2026-02-25
 */

'use client';

import { use } from 'react';
import { usePerson, useDeletePerson } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { useCanEditPerson } from '@/hooks/use-can-edit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/people/avatar-upload';
import { PhotoGallery } from '@/components/people/photo-gallery';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Trash2,
  ArrowLeft,
  MessageCircle,
  Facebook,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getZodiacYear } from '@/types';
import { FamilyRelationsCard } from '@/components/people/family-relations-card';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PersonDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: person, isLoading, error } = usePerson(id);
  const deleteMutation = useDeletePerson();
  const { profile } = useAuth();
  const { data: canEdit = false } = useCanEditPerson(id);
  const isViewer = profile?.role === 'viewer';
  const isSelf = profile?.linked_person === id;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xóa thành công');
      router.push('/people');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {error ? `Lỗi: ${error.message}` : 'Không tìm thấy thông tin'}
            </p>
            <Button asChild variant="outline">
              <Link href="/people">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/people">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Danh sách thành viên
        </Link>
      </Button>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <AvatarUpload person={person} canEdit={canEdit} />

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-bold">{person.display_name}</h1>
                <div className="flex gap-2">
                  <Badge variant="outline">Đời {person.generation}</Badge>
                  {person.chi && <Badge variant="outline">Chi {person.chi}</Badge>}
                  <Badge className={person.is_living ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {person.is_living ? 'Còn sống' : 'Đã mất'}
                  </Badge>
                  {person.is_patrilineal && (
                    <Badge className="bg-amber-100 text-amber-800">Chính tộc</Badge>
                  )}
                </div>
              </div>

              {(person.pen_name || person.taboo_name) && (
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  {person.taboo_name && <span>Tên húy: <strong>{person.taboo_name}</strong></span>}
                  {person.pen_name && <span>Tên tự: <strong>{person.pen_name}</strong></span>}
                </div>
              )}

              {person.occupation && (
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {person.occupation}
                </p>
              )}

              {canEdit && (
                <div className="flex gap-2 mt-4">
                  <Button asChild size="sm">
                    <Link href={`/people/${id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa {person.display_name}? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Birth & Death Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin sinh/mất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Ngày sinh</h4>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {person.birth_date || person.birth_year || 'Chưa rõ'}
                  {person.birth_year && ` (${getZodiacYear(person.birth_year)})`}
                </span>
              </div>
              {person.birth_place && (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{person.birth_place}</span>
                </div>
              )}
            </div>

            {!person.is_living && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Ngày mất</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {person.death_date || person.death_year || 'Chưa rõ'}
                      {person.death_lunar && ` (Âm lịch: ${person.death_lunar})`}
                    </span>
                  </div>
                  {person.death_place && (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{person.death_place}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {person.hometown && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Quê quán</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{person.hometown}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Info — hidden for viewers (except self) */}
        {(!isViewer || isSelf) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${person.phone}`} className="text-primary hover:underline">
                    {person.phone}
                  </a>
                </div>
              )}
              {person.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${person.email}`} className="text-primary hover:underline">
                    {person.email}
                  </a>
                </div>
              )}
              {person.zalo && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Zalo: {person.zalo}</span>
                </div>
              )}
              {person.facebook && (
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  <a href={person.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Facebook
                  </a>
                </div>
              )}
              {person.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{person.address}</span>
                </div>
              )}
              {!person.phone && !person.email && !person.zalo && !person.facebook && !person.address && (
                <p className="text-muted-foreground">Chưa có thông tin liên hệ</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Biography */}
      {person.biography && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tiểu sử</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{person.biography}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {person.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{person.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Family Relations */}
      <FamilyRelationsCard person={person} canEdit={canEdit} />

      {/* Photo Gallery */}
      <PhotoGallery personId={id} canEdit={canEdit} />
    </div>
  );
}
