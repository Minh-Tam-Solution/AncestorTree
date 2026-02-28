/**
 * @project AncestorTree
 * @file src/app/(main)/settings/profile/page.tsx
 * @description User profile settings — edit display name, view account info,
 *              and change password. Avatar uses initials fallback.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useUpdateProfile } from '@/hooks/use-profiles';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  KeyRound,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Mail,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

// ─── Role display helpers ─────────────────────────────────────────────────────

const roleLabels: Record<string, { label: string; color: string }> = {
  admin:  { label: 'Quản trị viên', color: 'bg-red-100 text-red-800' },
  editor: { label: 'Biên tập viên', color: 'bg-blue-100 text-blue-800' },
  viewer: { label: 'Người xem',     color: 'bg-gray-100 text-gray-800' },
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }
  return (email?.charAt(0) ?? '?').toUpperCase();
}

// ─── Profile info form ────────────────────────────────────────────────────────

function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Sync form when profile loads
  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setIsDirty(false);
  }, [profile?.full_name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;
    try {
      await updateProfile.mutateAsync({
        userId: profile.user_id,
        input: { full_name: fullName.trim() },
      });
      // Sync Supabase Auth metadata so display name is consistent
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      await refreshProfile();
      toast.success('Đã lưu thông tin cá nhân');
      setIsDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu');
    }
  };

  const roleInfo = roleLabels[profile?.role ?? 'viewer'] ?? roleLabels.viewer;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 text-lg">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-emerald-600 text-white text-xl font-bold">
            {getInitials(profile?.full_name, user?.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg">{profile?.full_name || 'Chưa cập nhật tên'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Badge className={`mt-1 text-xs ${roleInfo.color}`}>{roleInfo.label}</Badge>
        </div>
      </div>

      <Separator />

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="full-name">Tên hiển thị</Label>
        <Input
          id="full-name"
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setIsDirty(e.target.value.trim() !== (profile?.full_name ?? ''));
          }}
          maxLength={100}
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          Email
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="email"
            value={user?.email ?? ''}
            readOnly
            className="bg-muted cursor-not-allowed"
          />
          {user?.email_confirmed_at && (
            <span title="Email đã xác thực">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Email không thể thay đổi qua giao diện này.</p>
      </div>

      {/* Role (read-only) */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Vai trò
        </Label>
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted text-sm">
          <Badge className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</Badge>
          <span className="text-muted-foreground text-xs">— do quản trị viên phân quyền</span>
        </div>
      </div>

      {/* Account dates */}
      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground text-xs mb-0.5">Ngày tạo</p>
          <p>{profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('vi-VN')
            : '—'}
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground text-xs mb-0.5">Cập nhật lần cuối</p>
          <p>{profile?.updated_at
            ? new Date(profile.updated_at).toLocaleDateString('vi-VN')
            : '—'}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isDirty || updateProfile.isPending}
        className="w-full sm:w-auto"
      >
        {updateProfile.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Lưu thay đổi
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Password change form ─────────────────────────────────────────────────────

function PasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isValid = newPassword.length >= 8 && passwordsMatch;

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Đã đổi mật khẩu thành công');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <form onSubmit={handleChange} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-destructive">Mật khẩu không khớp.</p>
        )}
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={!isValid || isChanging}
        className="w-full sm:w-auto"
      >
        {isChanging ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang đổi...
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4 mr-2" />
            Đổi mật khẩu
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trang chủ
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Hồ sơ cá nhân
          </h1>
          <p className="text-muted-foreground text-sm">Thông tin tài khoản và cài đặt cá nhân</p>
        </div>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật tên hiển thị của bạn trong hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Mật khẩu mới phải có ít nhất 8 ký tự.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
