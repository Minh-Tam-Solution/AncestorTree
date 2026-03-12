/**
 * @project AncestorTree
 * @file src/app/(auth)/login/page.tsx
 * @description Login page — email+password or OTP email (configurable)
 * @version 2.1.0
 * @updated 2026-03-22
 */

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
import { ShieldCheck, ArrowLeft, Loader2, Mail, KeyRound } from 'lucide-react';
import type { LoginMethod } from '@/types';

// ─── TOTP second step ──────────────────────────────────────────────────────────

interface TotpStepProps {
  factorId: string;
  onSuccess: () => void;
  onBack: () => void;
}

function TotpStep({ factorId, onSuccess, onBack }: TotpStepProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const requestChallenge = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });
      if (error) {
        console.error('[MFA] challenge error:', error.message, error.status);
        return;
      }
      setChallengeId(data.id);
    } catch (err) {
      console.error('[MFA] challenge exception:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa.challenge({ factorId }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error('[MFA] challenge on mount error:', error.message, error.status);
        return;
      }
      setChallengeId(data.id);
    });
    return () => { cancelled = true; };
  }, [factorId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setIsVerifying(true);
    try {
      let verifyError: Error | null = null;

      if (challengeId) {
        const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
        verifyError = error ?? null;
      } else {
        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
        verifyError = error ?? null;
      }

      if (verifyError) {
        await requestChallenge();
        const is422 = (verifyError as unknown as { status?: number }).status === 422;
        toast.error(
          is422
            ? 'Mã không đúng hoặc đã hết hạn. Kiểm tra đồng hồ thiết bị và thử lại.'
            : verifyError.message
        );
        setCode('');
        return;
      }

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

// ─── OTP Email step ────────────────────────────────────────────────────────────

interface OtpStepProps {
  onBack: () => void;
}

function OtpEmailForm({ onBack }: OtpStepProps) {
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;
    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) {
        // shouldCreateUser=false → Supabase returns error for unregistered email
        if (error.message?.toLowerCase().includes('signups not allowed')) {
          toast.error('Email này chưa có tài khoản. Vui lòng đăng ký trước.');
        } else {
          toast.error(error.message ?? 'Không thể gửi mã OTP');
        }
        return;
      }
      toast.success('Mã OTP đã được gửi đến email của bạn');
      setOtpStep('code');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi mã OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) {
        const is422 = (error as unknown as { status?: number }).status === 422;
        toast.error(
          is422
            ? 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.'
            : (error.message ?? 'Mã OTP không hợp lệ')
        );
        setOtpCode('');
        return;
      }
      toast.success('Đăng nhập thành công!');
      window.location.replace('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đăng nhập thất bại');
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (otpStep === 'code') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Mail className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            Mã OTP đã gửi đến <strong>{otpEmail}</strong>. Kiểm tra hộp thư (kể cả spam).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp-code">Mã OTP (6 chữ số)</Label>
          <Input
            id="otp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground">Mã có hiệu lực trong 15 phút</p>
        </div>
        <Button type="submit" className="w-full" disabled={isVerifying || otpCode.length !== 6}>
          {isVerifying ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xác nhận...</>
          ) : 'Đăng nhập'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => { setOtpStep('email'); setOtpCode(''); }}
          disabled={isVerifying}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Đổi email
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Mail className="h-5 w-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800">
          Nhập email đã đăng ký — chúng tôi sẽ gửi mã OTP 6 chữ số để đăng nhập ngay, không cần mật khẩu.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="otp-email">Email</Label>
        <Input
          id="otp-email"
          type="email"
          placeholder="email@example.com"
          value={otpEmail}
          onChange={(e) => setOtpEmail(e.target.value)}
          autoFocus
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSending}>
        {isSending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi mã...</>
        ) : 'Gửi mã OTP'}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Đăng nhập bằng mật khẩu
      </Button>
    </form>
  );
}

// ─── Login backoff config ──────────────────────────────────────────────────────
const LOCKOUT_STEPS = [
  { failsRequired: 5,  lockSec: 30  },
  { failsRequired: 8,  lockSec: 120 },
  { failsRequired: 12, lockSec: 300 },
];

function getLockoutSec(failCount: number): number {
  let sec = 0;
  for (const step of LOCKOUT_STEPS) {
    if (failCount >= step.failsRequired) sec = step.lockSec;
  }
  return sec;
}

// ─── Inner login form ──────────────────────────────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { data: cs } = useClanSettings();
  const clanName = cs?.clan_name ?? CLAN_NAME;
  const parts = clanName.trim().split(' ');
  const clanInitial = parts.length > 1 ? (parts[parts.length - 1][0] ?? '?') : (parts[0][0] ?? '?');

  // Determine enabled methods (default: both)
  const enabledMethods: LoginMethod[] = cs?.login_config?.methods ?? ['email_password', 'email_otp'];
  const hasPassword = enabledMethods.includes('email_password');
  const hasOtp = enabledMethods.includes('email_otp');

  // Active tab: default to password if enabled, else OTP
  const defaultTab: 'password' | 'otp' = hasPassword ? 'password' : 'otp';
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // MFA state
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);

  // Client-side brute-force backoff
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (lockedUntil <= 0) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemainingSec(left);
      if (left === 0) setLockedUntil(0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil > Date.now();

  useEffect(() => {
    if (searchParams.get('error') === 'suspended') {
      toast.error('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLocked) return;
    setIsLoading(true);

    try {
      await signIn(email, password);

      setFailCount(0);
      setLockedUntil(0);

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totp = factorsData?.totp?.find((f) => f.status === 'verified');
        if (totp) {
          setTotpFactorId(totp.id);
          setIsLoading(false);
          return;
        }
      }

      toast.success('Đăng nhập thành công!');
      window.location.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      const newFails = failCount + 1;
      setFailCount(newFails);
      const lockSec = getLockoutSec(newFails);
      if (lockSec > 0) {
        setLockedUntil(Date.now() + lockSec * 1000);
        toast.error(`Sai thông tin đăng nhập nhiều lần. Thử lại sau ${lockSec} giây.`);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSuccess = () => window.location.replace('/');

  const handleTotpBack = async () => {
    await supabase.auth.signOut();
    setTotpFactorId(null);
    setPassword('');
  };

  // Determine card title/description based on current view
  let cardTitle = 'Đăng nhập';
  let cardDescription = 'Cổng thông tin gia phả';
  if (totpFactorId) {
    cardTitle = 'Xác thực 2 bước';
    cardDescription = 'Nhập mã từ ứng dụng xác thực';
  } else if (activeTab === 'otp') {
    cardTitle = 'Đăng nhập bằng mã OTP';
    cardDescription = 'Không cần mật khẩu';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
            {clanInitial}
          </div>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
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
              {/* Tab switcher — only shown when both methods are enabled */}
              {hasPassword && hasOtp && (
                <div className="flex rounded-lg border bg-muted/40 p-1 mb-5 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'password'
                        ? 'bg-white shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('otp')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'otp'
                        ? 'bg-white shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Mã OTP
                  </button>
                </div>
              )}

              {/* Password login */}
              {activeTab === 'password' && hasPassword && (
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
                    <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
                      {isLoading
                        ? 'Đang đăng nhập...'
                        : isLocked
                        ? `Thử lại sau ${remainingSec}s`
                        : 'Đăng nhập'}
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

              {/* OTP email login */}
              {activeTab === 'otp' && hasOtp && (
                <OtpEmailForm onBack={() => setActiveTab('password')} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
