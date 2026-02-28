/**
 * @project AncestorTree
 * @file src/app/(main)/admin/events/error.tsx
 * @description Error boundary for admin events page
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { RouteError } from '@/components/shared/route-error';

export default function AdminEventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang quản lý lịch sự kiện" />;
}
