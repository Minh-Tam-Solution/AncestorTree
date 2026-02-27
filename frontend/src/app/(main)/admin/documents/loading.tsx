/**
 * @project AncestorTree
 * @file src/app/(main)/admin/documents/loading.tsx
 * @description Loading skeleton for admin documents page
 * @version 1.0.0
 * @updated 2026-02-27
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDocumentsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-10 w-72" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
