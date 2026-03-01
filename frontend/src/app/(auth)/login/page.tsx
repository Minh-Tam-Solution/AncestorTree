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
  // Challenge is created on mount (after the component renders, isolated from parent's async flow).
  // Keeping state internal avoids timing races between signIn's onAuthStateChange and verify.
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

  // Create challenge immediately after mount so it is ready before user opens the authenticator app.
  // useEffect runs after paint — by then, signIn's onAuthStateChange handler has fully settled,
  // eliminating the noopLock race window that caused concurrent _acquireLock collisions.
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
        // Pre-created challenge: mfa.verify() goes straight to _verify, no _challengeAndVerify.
        const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
        verifyError = error ?? null;
      } else {
        // Fallback: challenge was not ready yet (e.g. very fast user, or network hiccup).
        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
        verifyError = error ?? null;
      }

      if (verifyError) {
        // Refresh challenge so the next attempt works (old challenge is consumed/expired).
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

// ─── Login backoff config ──────────────────────────────────────────────────────
// Client-side protection: direct Supabase auth calls bypass the proxy, so this
// adds a UX-level cooldown after consecutive failures (stops naive automation).
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

  // MFA state — challenge lifecycle is managed inside TotpStep (useEffect on mount)
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);

  // Client-side brute-force backoff
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [remainingSec, setRemainingSec] = useState(0);

  // Countdown ticker
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

  // Show suspended error from query param
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

      // Reset fail counter on success
      setFailCount(0);
      setLockedUntil(0);

      // Check if MFA (AAL2) is required
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        // MFA enrolled — get first verified TOTP factor
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totp = factorsData?.totp?.find((f) => f.status === 'verified');
        if (totp) {
          setTotpFactorId(totp.id);
          setIsLoading(false);
          return; // Show TOTP step — TotpStep creates the challenge in its useEffect
        }
      }

      // No MFA or already at AAL2 — proceed
      toast.success('Đăng nhập thành công!');
      // Full page navigation to ensure auth cookies are sent in the next request.
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
