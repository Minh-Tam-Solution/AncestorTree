/**
 * @project AncestorTree
 * @file src/app/(main)/admin/documents/error.tsx
 * @description Error boundary for admin documents page
 * @version 1.0.0
 * @updated 2026-02-27
 */

'use client';

import { RouteError } from '@/components/shared/route-error';

export default function AdminDocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang quản lý tài liệu" />;
}
