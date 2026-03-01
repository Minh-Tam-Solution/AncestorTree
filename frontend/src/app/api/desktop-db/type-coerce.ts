/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/type-coerce.ts
 * @description SQLite ↔ PostgreSQL type coercion.
 *              Boolean 0/1 ↔ true/false, JSONB ↔ TEXT, UUID generation.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { randomUUID } from 'crypto';

/** Columns that are BOOLEAN in PostgreSQL but INTEGER 0/1 in SQLite */
const BOOLEAN_COLUMNS: Record<string, Set<string>> = {
  people: new Set(['is_living', 'is_patrilineal']),
  profiles: new Set(['is_verified', 'can_verify_members', 'is_suspended']),
  events: new Set(['recurring']),
  media: new Set(['is_primary']),
  achievements: new Set(['is_featured']),
  clan_articles: new Set(['is_featured']),
  cau_duong_pools: new Set(['is_active']),
};

/** Check if a column is boolean for a given table */
export function isBooleanColumn(table: string, column: string): boolean {
  return BOOLEAN_COLUMNS[table]?.has(column) ?? false;
}

/** Columns that are JSONB in PostgreSQL but TEXT in SQLite */
const JSON_COLUMNS: Record<string, Set<string>> = {
  contributions: new Set(['changes']),
};

/** Convert a row from SQLite types to PostgreSQL-like types */
export function coerceRowFromSqlite(
  table: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const boolCols = BOOLEAN_COLUMNS[table];
  const jsonCols = JSON_COLUMNS[table];

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (boolCols?.has(key)) {
      result[key] = value === 1 || value === true;
    } else if (jsonCols?.has(key) && typeof value === 'string') {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Convert input data from PostgreSQL-like types to SQLite types */
export function coerceDataToSqlite(
  table: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const boolCols = BOOLEAN_COLUMNS[table];
  const jsonCols = JSON_COLUMNS[table];

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (boolCols?.has(key)) {
      result[key] = value ? 1 : 0;
    } else if (jsonCols?.has(key) && typeof value === 'object' && value !== null) {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Generate a new UUID (replaces PostgreSQL's uuid_generate_v4()) */
export function generateUUID(): string {
  return randomUUID();
}
