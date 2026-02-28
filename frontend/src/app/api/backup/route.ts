/**
 * @project AncestorTree
 * @file src/app/api/backup/route.ts
 * @description Unified backup API — exports all 13 tables to a single ZIP file.
 *              Works in both Desktop (SQLite via sql.js) and Web (Supabase) modes.
 *              Desktop: queries SQLite directly + optional media embedding.
 *              Web:     uses service-role client to bypass RLS; inline media skipped.
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

/** All tables exported (profiles skipped — CTO Obs 3: UUID remapping) */
const EXPORT_TABLES = [
  'people', 'families', 'children',
  'contributions', 'events', 'media',
  'achievements', 'fund_transactions', 'scholarships', 'clan_articles',
  'cau_duong_pools', 'cau_duong_assignments',
  'clan_documents',
] as const;

type IncludeMedia = 'skip' | 'reference' | 'inline';

const APP_VERSION = process.env.npm_package_version || '2.2.1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const includeMedia: IncludeMedia = body.include_media ?? 'reference';

    const isDesktop =
      process.env.DESKTOP_MODE === 'true' ||
      process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

    const zip = new AdmZip();
    const exportedData: Record<string, unknown[]> = {};

    // ── Desktop mode: query SQLite ─────────────────────────────────────────
    if (isDesktop) {
      const { getDatabase } = await import('../desktop-db/sqlite-db');
      const db = await getDatabase();

      for (const table of EXPORT_TABLES) {
        try {
          const result = db.exec(`SELECT * FROM "${table}"`);
          if (result.length > 0) {
            const { columns, values } = result[0];
            exportedData[table] = values.map(row => {
              const obj: Record<string, unknown> = {};
              columns.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
          } else {
            exportedData[table] = [];
          }
        } catch {
          exportedData[table] = []; // table may not exist in older schema
        }
      }

      // Embed media files when requested
      if (includeMedia === 'inline') {
        const path = await import('path');
        const fs = await import('fs');
        const os = await import('os');
        const mediaRoot = path.join(
          process.env.DESKTOP_DATA_DIR || path.join(os.homedir(), 'AncestorTree'),
          'media'
        );
        if (fs.existsSync(mediaRoot)) {
          const walkDir = (dir: string, base: string) => {
            for (const entry of fs.readdirSync(dir)) {
              const full = path.join(dir, entry);
              const rel = path.join(base, entry);
              if (fs.statSync(full).isDirectory()) {
                walkDir(full, rel);
              } else {
                zip.addLocalFile(
                  full,
                  path.dirname(rel) === '.' ? '' : path.dirname(rel),
                  path.basename(rel)
                );
              }
            }
          };
          walkDir(mediaRoot, 'media');
        }
      }

    // ── Web mode: query Supabase with service role ─────────────────────────
    } else {
      const { createServiceRoleClient } = await import('@/lib/supabase');
      const supabase = createServiceRoleClient();

      for (const table of EXPORT_TABLES) {
        try {
          const { data } = await supabase.from(table).select('*');
          exportedData[table] = data ?? [];
        } catch {
          exportedData[table] = [];
        }
      }
      // Note: inline media not supported in web mode (files reside in Supabase Storage)
    }

    // ── Build manifest ─────────────────────────────────────────────────────
    const manifest = {
      version: '1.0',
      app_version: APP_VERSION,
      exported_at: new Date().toISOString(),
      mode: isDesktop ? 'desktop' : 'web',
      include_media: includeMedia,
      row_counts: Object.fromEntries(EXPORT_TABLES.map(t => [t, exportedData[t].length])),
      tables: exportedData,
    };

    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

    const zipBuffer = zip.toBuffer();
    const filename = `giapha-${new Date().toISOString().slice(0, 10)}.zip`;

    // ── Docker volume persistence (BACKUP_DIR env var) ──────────────────────
    // When running in Docker, mount a host directory to BACKUP_DIR so backup
    // ZIPs are persisted on the host filesystem in addition to the download.
    const backupDir = process.env.BACKUP_DIR;
    if (backupDir) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        fs.writeFileSync(path.join(backupDir, filename), zipBuffer);
      } catch {
        // Non-fatal: still return the download even if disk write fails
      }
    }

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sao lưu thất bại' },
      { status: 500 }
    );
  }
}
