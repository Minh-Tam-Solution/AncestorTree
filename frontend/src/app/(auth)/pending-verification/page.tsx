/**
 * @project AncestorTree
 * @file src/app/(auth)/pending-verification/page.tsx
 * @description Waiting page for users who registered but not yet verified by admin
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

export default function PendingVerificationPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Chờ xác nhận tài khoản</CardTitle>
          <CardDescription className="text-base">
            Tài khoản của bạn đã được đăng ký thành công.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vui lòng chờ quản trị viên xác nhận tài khoản để truy cập đầy đủ hệ thống gia phả.
            Bạn sẽ được thông báo khi tài khoản được kích hoạt.
          </p>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              Nếu bạn cho rằng đây là lỗi, hãy liên hệ quản trị viên dòng họ.
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
