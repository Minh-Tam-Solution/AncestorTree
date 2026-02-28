/**
 * @project AncestorTree
 * @file src/app/(main)/admin/events/loading.tsx
 * @description Loading skeleton for admin events page
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminEventsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
