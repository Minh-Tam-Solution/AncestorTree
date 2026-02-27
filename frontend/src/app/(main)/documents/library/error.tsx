/**
 * @project AncestorTree
 * @file src/app/(main)/documents/library/error.tsx
 * @description Error boundary for document library
 * @version 1.0.0
 * @updated 2026-02-27
 */

'use client';

import { RouteError } from '@/components/shared/route-error';

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải kho tài liệu" />;
}
