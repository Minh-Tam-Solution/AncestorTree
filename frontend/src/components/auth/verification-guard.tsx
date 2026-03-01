/**
 * @project AncestorTree
 * @file src/components/auth/verification-guard.tsx
 * @description Client-side guard redirecting unverified users to /pending-verification (ISS-06)
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

export function VerificationGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isVerified, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip during loading or if not logged in (middleware handles auth redirect)
    if (isLoading || !user) return;
    // Desktop mode: always verified
    if (process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true') return;
    // Admin and editor bypass verification — they ARE the verifiers
    if (profile?.role === 'admin' || profile?.role === 'editor') return;
    // Redirect unverified users to pending page
    if (!isVerified && pathname !== '/pending-verification') {
      router.replace('/pending-verification');
    }
  }, [user, profile, isVerified, isLoading, router, pathname]);

  return <>{children}</>;
}
