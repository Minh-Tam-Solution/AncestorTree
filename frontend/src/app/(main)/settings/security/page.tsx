/**
 * @project AncestorTree
 * @file src/app/(main)/settings/security/page.tsx
 * @description MFA (TOTP) self-service setup page.
 *              Users can enroll Google Authenticator, view enrolled factors,
 *              and unenroll. Desktop mode shows an info panel instead.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Info,
  Loader2,
  QrCode,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TotpFactor {
  id: string;
  friendly_name?: string;
  status: 'verified' | 'unverified';
}

interface EnrollState {
  factorId: string;
  qrCode: string;   // data URL
  secret: string;   // manual entry backup
}

// ─── Desktop guard ─────────────────────────────────────────────────────────────

const isDesktop = process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [enrollState, setEnrollState] = useState<EnrollState | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [unenrollId, setUnenrollId] = useState<string | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const loadFactors = async () => {
    setIsLoadingFactors(true);
    try {
      // Use getUser() (live server call) instead of mfa.listFactors() (reads cached session).
      // This guarantees fresh factor status immediately after challengeAndVerify().
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      const totp = (user?.factors ?? []).filter(
        (f) => f.factor_type === 'totp'
      ) as TotpFactor[];
      setFactors(totp);
    } catch (err) {
      console.error('Failed to load MFA factors', err);
    } finally {
      setIsLoadingFactors(false);
    }
  };

  useEffect(() => {
    if (!isDesktop) loadFactors();
    else setIsLoadingFactors(false);
  }, []);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'AncestorTree',
        friendlyName: 'Google Authenticator',
      });
      if (error) throw error;
      setEnrollState({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setTotpCode('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi khởi tạo xác thực');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollState || totpCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollState.factorId,
        code: totpCode,
      });
      if (error) throw error;
      toast.success('Xác thực 2 bước đã được bật thành công!');
      setEnrollState(null);
      setTotpCode('');
      await loadFactors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Mã xác thực không đúng. Vui lòng thử lại.');
      setTotpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelEnroll = async () => {
    if (enrollState) {
      // Clean up the unverified factor
      await supabase.auth.mfa.unenroll({ factorId: enrollState.factorId }).catch(() => null);
    }
    setEnrollState(null);
    setTotpCode('');
  };

  const handleUnenroll = async () => {
    if (!unenrollId) return;
    setIsUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: unenrollId });
      if (error) throw error;
      toast.success('Đã tắt xác thực 2 bước.');
      setUnenrollId(null);
      await loadFactors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tắt xác thực');
    } finally {
      setIsUnenrolling(false);
    }
  };

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const hasVerifiedMfa = verifiedFactors.length > 0;

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
            <ShieldCheck className="h-6 w-6" />
            Bảo mật tài khoản
          </h1>
          <p className="text-muted-foreground text-sm">Quản lý xác thực 2 bước (MFA)</p>
        </div>
      </div>

      {/* Desktop mode — MFA not applicable */}
      {isDesktop ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Không khả dụng ở chế độ offline
            </CardTitle>
            <CardDescription>
              Xác thực 2 bước yêu cầu kết nối đến máy chủ Supabase.
              Tính năng này không áp dụng cho chế độ desktop offline.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* MFA Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Xác thực 2 bước (TOTP)
              </CardTitle>
              <CardDescription>
                Bảo vệ tài khoản bằng mã xác thực từ Google Authenticator hoặc ứng dụng tương tự.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFactors ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ) : enrollState ? (
                /* Enrollment flow */
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <QrCode className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 space-y-1">
                      <p className="font-medium">Bước 1: Quét mã QR</p>
                      <p>Mở Google Authenticator → Thêm tài khoản → Quét mã QR bên dưới.</p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="p-3 border rounded-lg bg-white shadow-sm">
                      <Image
                        src={enrollState.qrCode}
                        alt="QR code cho Google Authenticator"
                        width={180}
                        height={180}
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Manual entry fallback */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Không quét được mã QR? Nhập thủ công
                    </summary>
                    <div className="mt-2 p-2 bg-muted rounded font-mono text-xs break-all select-all">
                      {enrollState.secret}
                    </div>
                  </details>

                  {/* Verification */}
                  <form onSubmit={handleVerifyEnroll} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="enroll-code">
                        Bước 2: Nhập mã xác thực (6 chữ số)
                      </Label>
                      <Input
                        id="enroll-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-xl tracking-[0.4em] font-mono max-w-[180px]"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isVerifying || totpCode.length !== 6}
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xác nhận...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Xác nhận & Bật
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEnroll}
                        disabled={isVerifying}
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                </div>
              ) : hasVerifiedMfa ? (
                /* MFA active state */
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Đang hoạt động
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Xác thực 2 bước đã được bật
                    </span>
                  </div>
                  <div className="space-y-2">
                    {verifiedFactors.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {f.friendly_name || 'Google Authenticator'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setUnenrollId(f.id)}
                        >
                          <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                          Tắt
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* No MFA enrolled */
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Xác thực 2 bước chưa được bật. Bật ngay để bảo vệ tài khoản tốt hơn.
                  </p>
                  <Button onClick={handleEnroll} disabled={isEnrolling}>
                    {isEnrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang khởi tạo...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Bật xác thực 2 bước
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="flex gap-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Khi bật xác thực 2 bước, mỗi lần đăng nhập bạn sẽ cần nhập mã 6 chữ số
                  từ ứng dụng xác thực (Google Authenticator, Authy, ...) ngoài mật khẩu.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Unenroll confirmation dialog */}
      <AlertDialog open={!!unenrollId} onOpenChange={(open) => { if (!open) setUnenrollId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Tắt xác thực 2 bước?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi tắt, tài khoản chỉ được bảo vệ bằng mật khẩu.
              Bạn có thể bật lại bất cứ lúc nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnenroll}
              disabled={isUnenrolling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUnenrolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tắt...
                </>
              ) : (
                'Tắt xác thực 2 bước'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
