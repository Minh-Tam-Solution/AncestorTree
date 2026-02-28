'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CLAN_NAME } from '@/lib/clan-config';
import { useClanSettings } from '@/hooks/use-clan-settings';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

// ─── TOTP second step ──────────────────────────────────────────────────────────

interface TotpStepProps {
  factorId: string;
  onSuccess: () => void;
  onBack: () => void;
}

function TotpStep({ factorId, onSuccess, onBack }: TotpStepProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      toast.success('Xác thực 2 bước thành công!');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mã xác thực không đúng';
      toast.error(msg);
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          Nhập mã 6 chữ số từ ứng dụng xác thực (Google Authenticator).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="totp-code">Mã xác thực</Label>
        <Input
          id="totp-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="text-center text-xl tracking-[0.4em] font-mono"
          autoFocus
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isVerifying || code.length !== 6}>
        {isVerifying ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang xác thực...
          </>
        ) : (
          'Xác nhận'
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
        disabled={isVerifying}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại đăng nhập
      </Button>
    </form>
  );
}

// ─── Inner login form (needs useSearchParams — must be inside Suspense) ────────

function LoginForm() {
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { data: cs } = useClanSettings();
  const clanName = cs?.clan_name ?? CLAN_NAME;
  const parts = clanName.trim().split(' ');
  const clanInitial = parts.length > 1 ? (parts[parts.length - 1][0] ?? '?') : (parts[0][0] ?? '?');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // MFA state
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);

  // Show suspended error from query param
  useEffect(() => {
    if (searchParams.get('error') === 'suspended') {
      toast.error('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);

      // Check if MFA (AAL2) is required
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        // MFA enrolled — get first verified TOTP factor
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totp = factorsData?.totp?.find((f) => f.status === 'verified');
        if (totp) {
          setTotpFactorId(totp.id);
          setIsLoading(false);
          return; // Show TOTP step instead of redirecting
        }
      }

      // No MFA or already at AAL2 — proceed
      toast.success('Đăng nhập thành công!');
      // Full page navigation to ensure auth cookies are sent in the next request.
      window.location.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSuccess = () => {
    window.location.replace('/');
  };

  const handleTotpBack = async () => {
    await supabase.auth.signOut();
    setTotpFactorId(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
            {clanInitial}
          </div>
          <CardTitle>{totpFactorId ? 'Xác thực 2 bước' : 'Đăng nhập'}</CardTitle>
          <CardDescription>
            {totpFactorId ? 'Nhập mã từ ứng dụng xác thực' : 'Cổng thông tin gia phả'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totpFactorId ? (
            <TotpStep
              factorId={totpFactorId}
              onSuccess={handleTotpSuccess}
              onBack={handleTotpBack}
            />
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-emerald-600 hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Chưa có tài khoản? </span>
                <Link href="/register" className="text-emerald-600 hover:underline">
                  Đăng ký
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page wrapper — useSearchParams requires Suspense boundary ─────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
