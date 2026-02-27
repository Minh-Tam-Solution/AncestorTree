/**
 * @project AncestorTree
 * @file src/app/(main)/admin/settings/loading.tsx
 * @description Loading skeleton for admin settings page
 * @version 1.0.0
 * @updated 2026-02-27
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettingsLoading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
