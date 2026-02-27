/**
 * @project AncestorTree
 * @file src/app/(main)/help/error.tsx
 * @description Error boundary for help page
 * @version 1.0.0
 * @updated 2026-02-27
 */

'use client';

import { RouteError } from '@/components/shared/route-error';

export default function HelpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang hướng dẫn" />;
}
