/**
 * @project AncestorTree
 * @file src/app/(main)/admin/settings/page.tsx
 * @description Admin settings page — dynamic clan configuration CRUD
 * @version 2.0.0
 * @updated 2026-02-28
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClanSettings, useUpdateClanSettings } from '@/hooks/use-clan-settings';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Globe, Database, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { CLAN_NAME as ENV_CLAN_NAME, CLAN_FULL_NAME as ENV_CLAN_FULL_NAME } from '@/lib/clan-config';
import type { UpdateClanSettingsInput } from '@/types';

const isDesktop = process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';
const APP_VERSION = 'v2.2.1';

function deriveInitial(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[parts.length - 1][0] ?? '?') : (parts[0][0] ?? '?');
}

function deriveSubtitle(fullName: string, shortName: string): string {
  return fullName.startsWith(shortName) ? fullName.slice(shortName.length).trim() : '';
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isEditor } = useAuth();
  const { data: clanSettings, isLoading } = useClanSettings();
  const updateMutation = useUpdateClanSettings();

  const [clanName, setClanName] = useState('');
  const [clanFullName, setClanFullName] = useState('');
  const [foundingYear, setFoundingYear] = useState('');
  const [origin, setOrigin] = useState('');
  const [patriarch, setPatriarch] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    if (!clanSettings) return;
    setClanName(clanSettings.clan_name);
    setClanFullName(clanSettings.clan_full_name);
    setFoundingYear(clanSettings.clan_founding_year?.toString() ?? '');
    setOrigin(clanSettings.clan_origin ?? '');
    setPatriarch(clanSettings.clan_patriarch ?? '');
    setDescription(clanSettings.clan_description ?? '');
    setContactEmail(clanSettings.contact_email ?? '');
    setContactPhone(clanSettings.contact_phone ?? '');
  }, [clanSettings]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clanSettings) return;
    if (!clanName.trim() || !clanFullName.trim()) {
      toast.error('Tên dòng họ không được để trống');
      return;
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error('Email không hợp lệ');
      return;
    }
    const input: UpdateClanSettingsInput = {
      clan_name: clanName.trim(),
      clan_full_name: clanFullName.trim(),
      clan_founding_year: foundingYear ? parseInt(foundingYear) : undefined,
      clan_origin: origin.trim() || undefined,
      clan_patriarch: patriarch.trim() || undefined,
      clan_description: description.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
    };
    try {
      await updateMutation.mutateAsync({ id: clanSettings.id, input });
      toast.success('Đã lưu thông tin dòng họ');
      router.refresh();
    } catch {
      toast.error('Lỗi khi lưu cài đặt');
    }
  };

  const previewInitial = deriveInitial(clanName || ENV_CLAN_NAME);
  const previewSubtitle = deriveSubtitle(clanFullName || ENV_CLAN_FULL_NAME, clanName || ENV_CLAN_NAME);

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cài đặt
        </h1>
        <p className="text-muted-foreground">Cấu hình thông tin dòng họ hiển thị trên toàn bộ ứng dụng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Thông tin dòng họ
          </CardTitle>
          <CardDescription>
            Chỉnh sửa và lưu để cập nhật ngay — không cần build lại ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tên dòng họ (ngắn) *</Label>
                  <Input
                    value={clanName}
                    onChange={e => setClanName(e.target.value)}
                    placeholder="Họ Đặng"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Hiển thị trên sidebar</p>
                </div>
                <div>
                  <Label>Năm thành lập</Label>
                  <Input
                    type="number"
                    value={foundingYear}
                    onChange={e => setFoundingYear(e.target.value)}
                    placeholder="1750"
                    min={1000}
                    max={2100}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Tên dòng họ (đầy đủ) *</Label>
                <Input
                  value={clanFullName}
                  onChange={e => setClanFullName(e.target.value)}
                  placeholder="Họ Đặng làng Kỷ Các, Thạch Lâm, Hà Tĩnh"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Hiển thị trên trang chủ, đăng nhập, gia phả sách</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Thủy tổ</Label>
                  <Input
                    value={patriarch}
                    onChange={e => setPatriarch(e.target.value)}
                    placeholder="Cụ Đặng Đình..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Quê gốc</Label>
                  <Input
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="Thạch Lâm, Thạch Hà, Hà Tĩnh"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Lịch sử / Mô tả</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Giới thiệu lịch sử dòng họ..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email liên hệ</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="hoidong@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Điện thoại liên hệ</Label>
                  <Input
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Xem trước — Sidebar</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shrink-0">
                    {previewInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{clanName || ENV_CLAN_NAME}</p>
                    {previewSubtitle && (
                      <p className="text-xs text-muted-foreground">{previewSubtitle}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending || !clanSettings}>
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Lưu thay đổi</>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Thông tin hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Phiên bản</span>
              <Badge variant="outline">{APP_VERSION}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Chế độ</span>
              <Badge variant={isDesktop ? 'default' : 'secondary'}>
                {isDesktop ? 'Desktop (Offline)' : 'Web (Online)'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Cơ sở dữ liệu</span>
              <Badge variant="outline">
                {isDesktop ? 'SQLite (local)' : 'PostgreSQL (Supabase)'}
              </Badge>
            </div>
            {clanSettings?.updated_at && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Cài đặt cập nhật lần cuối</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(clanSettings.updated_at).toLocaleDateString('vi-VN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
