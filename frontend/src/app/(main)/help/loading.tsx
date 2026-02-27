/**
 * @project AncestorTree
 * @file src/app/(main)/help/loading.tsx
 * @description Loading skeleton for help page
 * @version 1.0.0
 * @updated 2026-02-27
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function HelpLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-64 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
