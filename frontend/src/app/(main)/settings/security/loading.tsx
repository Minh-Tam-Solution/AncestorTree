/**
 * @project AncestorTree
 * @file src/app/(main)/settings/security/loading.tsx
 * @description Loading skeleton for the MFA security settings page
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SecurityLoading() {
  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
