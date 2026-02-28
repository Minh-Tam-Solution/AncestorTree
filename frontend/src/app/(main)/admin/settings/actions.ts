/**
 * @project AncestorTree
 * @file src/app/(main)/admin/settings/actions.ts
 * @description Server actions for clan settings — revalidates cached routes
 *              after clan info is updated so server components serve fresh data.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use server';

import { revalidatePath } from 'next/cache';

/**
 * Purge the Next.js Router Cache + Full Route Cache for all pages
 * that render clan name/info as server components.
 * Called from the admin settings client component after a successful save.
 */
export async function revalidateClanSettings(): Promise<void> {
  // Homepage — async server component that calls getClanSettings()
  revalidatePath('/');
}
