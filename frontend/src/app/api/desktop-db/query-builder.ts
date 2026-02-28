/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/query-builder.ts
 * @description Translates Supabase query DSL to SQL and executes against sql.js.
 *              Handles: select, insert, update, delete, filters, order, limit.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import type { Database } from 'sql.js';
import { coerceRowFromSqlite, coerceDataToSqlite, generateUUID, isBooleanColumn } from './type-coerce';
import { notFoundError, sqliteError } from './error-mapper';

/** Tables that have an updated_at column (from schema inspection) */
const TABLES_WITH_UPDATED_AT = new Set([
  'people', 'families', 'profiles', 'achievements',
  'clan_articles', 'cau_duong_pools', 'cau_duong_assignments',
  'clan_settings',
]);

// ─── Types ──────────────────────────────────────────────────────────────────

interface Filter {
  type: 'eq' | 'in' | 'is' | 'ilike' | 'not' | 'or';
  column?: string;
  value?: unknown;
  operator?: string;
  condition?: string;
}

interface QueryPayload {
  table: string;
  method: 'select' | 'insert' | 'update' | 'delete';
  columns?: string;
  body?: Record<string, unknown> | Record<string, unknown>[];
  filters: Filter[];
  order?: { column: string; ascending: boolean }[];
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
}

interface QueryResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

// ─── Filter Builder ─────────────────────────────────────────────────────────

function buildWhere(filters: Filter[], table?: string): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  /** Coerce boolean values to SQLite INTEGER 0/1 when column is boolean */
  const coerceFilterValue = (column: string | undefined, value: unknown): unknown => {
    if (column && table && isBooleanColumn(table, column)) {
      if (value === true) return 1;
      if (value === false) return 0;
    }
    return value;
  };

  for (const f of filters) {
    switch (f.type) {
      case 'eq':
        conditions.push(`"${f.column}" = ?`);
        params.push(coerceFilterValue(f.column, f.value));
        break;

      case 'in': {
        const values = f.value as unknown[];
        if (values.length === 0) {
          conditions.push('1 = 0'); // empty IN → no results
        } else {
          const placeholders = values.map(() => '?').join(', ');
          conditions.push(`"${f.column}" IN (${placeholders})`);
          params.push(...values.map(v => coerceFilterValue(f.column, v)));
        }
        break;
      }

      case 'is':
        if (f.value === null) {
          conditions.push(`"${f.column}" IS NULL`);
        }
        break;

      case 'ilike':
        // SQLite LIKE is case-insensitive for ASCII only.
        // Use LOWER() for Vietnamese Unicode support.
        conditions.push(`LOWER("${f.column}") LIKE LOWER(?)`);
        params.push(f.value);
        break;

      case 'not':
        if (f.operator === 'is' && f.value === null) {
          conditions.push(`"${f.column}" IS NOT NULL`);
        } else {
          conditions.push(`"${f.column}" != ?`);
          params.push(coerceFilterValue(f.column, f.value));
        }
        break;

      case 'or': {
        // Parse Supabase OR DSL: "father_id.eq.X,mother_id.eq.Y"
        const orCondition = f.condition || '';
        const orParts = parseOrCondition(orCondition);
        if (orParts.length > 0) {
          const orClauses: string[] = [];
          for (const part of orParts) {
            orClauses.push(`"${part.column}" ${part.op} ?`);
            params.push(part.value);
          }
          conditions.push(`(${orClauses.join(' OR ')})`);
        }
        break;
      }
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

/** Parse Supabase OR condition string: "col.op.val,col.op.val" */
function parseOrCondition(condition: string): { column: string; op: string; value: string }[] {
  const parts = condition.split(',');
  return parts.map(part => {
    const segments = part.trim().split('.');
    const column = segments[0];
    const operator = segments[1];
    const value = segments.slice(2).join('.'); // value might contain dots

    let op = '=';
    if (operator === 'eq') op = '=';
    else if (operator === 'neq') op = '!=';
    else if (operator === 'gt') op = '>';
    else if (operator === 'gte') op = '>=';
    else if (operator === 'lt') op = '<';
    else if (operator === 'lte') op = '<=';

    return { column, op, value };
  });
}

// ─── Query Executor ─────────────────────────────────────────────────────────

export function executeQuery(db: Database, payload: QueryPayload): QueryResult {
  try {
    switch (payload.method) {
      case 'select':
        return executeSelect(db, payload);
      case 'insert':
        return executeInsert(db, payload);
      case 'update':
        return executeUpdate(db, payload);
      case 'delete':
        return executeDelete(db, payload);
      default:
        return { data: null, error: { message: `Unknown method: ${payload.method}` } };
    }
  } catch (err) {
    // Check for unique constraint violation
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE constraint failed')) {
      return { data: null, error: { message: msg, code: '23505' } };
    }
    return { data: null, error: sqliteError(err) };
  }
}

function executeSelect(db: Database, payload: QueryPayload): QueryResult {
  const columns = payload.columns === '*' ? '*' : payload.columns || '*';
  const { clause, params } = buildWhere(payload.filters, payload.table);

  let sql = `SELECT ${columns} FROM "${payload.table}" ${clause}`;

  // ORDER BY
  if (payload.order && payload.order.length > 0) {
    const orderParts = payload.order.map(
      o => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`
    );
    sql += ` ORDER BY ${orderParts.join(', ')}`;
  }

  // LIMIT
  if (payload.limit) {
    sql += ` LIMIT ${payload.limit}`;
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    rows.push(coerceRowFromSqlite(payload.table, row));
  }
  stmt.free();

  // Handle .single() / .maybeSingle()
  if (payload.single) {
    if (rows.length === 0) {
      return { data: null, error: notFoundError() };
    }
    return { data: rows[0], error: null };
  }

  if (payload.maybeSingle) {
    return { data: rows.length > 0 ? rows[0] : null, error: null };
  }

  return { data: rows, error: null };
}

function executeInsert(db: Database, payload: QueryPayload): QueryResult {
  const records = Array.isArray(payload.body) ? payload.body : [payload.body || {}];
  const insertedRows: Record<string, unknown>[] = [];

  for (const record of records) {
    const coerced = coerceDataToSqlite(payload.table, record);

    // Auto-generate UUID if id is missing
    if (!coerced.id) {
      coerced.id = generateUUID();
    }

    // Auto-set timestamps
    const now = new Date().toISOString();
    if (!coerced.created_at) coerced.created_at = now;
    if (TABLES_WITH_UPDATED_AT.has(payload.table) && !coerced.updated_at) {
      coerced.updated_at = now;
    }

    const columns = Object.keys(coerced);
    const values = Object.values(coerced);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO "${payload.table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
    db.run(sql, values);

    // Return the inserted row if .select() was chained
    if (payload.columns) {
      const selectCols = payload.columns === '*' ? '*' : payload.columns;
      const returnStmt = db.prepare(`SELECT ${selectCols} FROM "${payload.table}" WHERE id = ?`);
      returnStmt.bind([coerced.id]);
      if (returnStmt.step()) {
        const row = returnStmt.getAsObject() as Record<string, unknown>;
        insertedRows.push(coerceRowFromSqlite(payload.table, row));
      }
      returnStmt.free();
    }
  }

  if (payload.single && insertedRows.length > 0) {
    return { data: insertedRows[0], error: null };
  }

  return {
    data: payload.columns ? insertedRows : null,
    error: null,
  };
}

function executeUpdate(db: Database, payload: QueryPayload): QueryResult {
  const rawBody = Array.isArray(payload.body) ? payload.body[0] : (payload.body || {});
  const data = coerceDataToSqlite(payload.table, rawBody);

  // Auto-update timestamp (only for tables that have the column)
  if (TABLES_WITH_UPDATED_AT.has(payload.table)) {
    data.updated_at = new Date().toISOString();
  }

  const setClauses = Object.keys(data).map(k => `"${k}" = ?`);
  const setValues = Object.values(data);

  const { clause, params } = buildWhere(payload.filters, payload.table);

  const sql = `UPDATE "${payload.table}" SET ${setClauses.join(', ')} ${clause}`;
  db.run(sql, [...setValues, ...params]);

  // Return updated rows if .select() was chained
  if (payload.columns) {
    const selectCols = payload.columns === '*' ? '*' : payload.columns;
    const selectSql = `SELECT ${selectCols} FROM "${payload.table}" ${clause}`;
    const stmt = db.prepare(selectSql);
    stmt.bind(params);

    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, unknown>;
      rows.push(coerceRowFromSqlite(payload.table, row));
    }
    stmt.free();

    if (payload.single) {
      return { data: rows[0] || null, error: null };
    }
    return { data: rows, error: null };
  }

  return { data: null, error: null };
}

function executeDelete(db: Database, payload: QueryPayload): QueryResult {
  const { clause, params } = buildWhere(payload.filters, payload.table);
  const sql = `DELETE FROM "${payload.table}" ${clause}`;
  db.run(sql, params);
  return { data: null, error: null };
}
