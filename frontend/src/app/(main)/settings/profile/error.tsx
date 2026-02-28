/**
 * @project AncestorTree
 * @file src/app/(main)/settings/profile/error.tsx
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { Button } from '@/components/ui/button';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto p-4 max-w-2xl text-center py-12">
      <p className="text-destructive mb-4">Lỗi: {error.message}</p>
      <Button onClick={reset} variant="outline">Thử lại</Button>
    </div>
  );
}
