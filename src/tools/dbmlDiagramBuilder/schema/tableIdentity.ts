import type { TableSchema } from '../types';

/**
 * A table reference as written in DBML: an optional schema/namespace prefix
 * plus the table's own name. `schema` is `undefined` — never `'public'` or
 * any other invented default — when the source left the table unqualified.
 */
export interface TableRef {
  schema?: string;
  name: string;
}

/**
 * Canonical, collision-safe, case-insensitive identity for a table:
 * `schema.name` lowercased when qualified, or just `name` lowercased when
 * not. This is the single key used everywhere a table needs to be looked up
 * or stored by identity — React Flow node ids, manual-position persistence,
 * relationship endpoints, rename/lookup — so `public.users` and `auth.users`
 * can never collide, while a plain `users` keeps exactly the key it always
 * had (case-insensitive match on the bare name).
 */
export function tableKey(ref: TableRef): string {
  const name = ref.name.toLowerCase();
  return ref.schema ? `${ref.schema.toLowerCase()}.${name}` : name;
}

/** `schema.name` for display when qualified, else just `name` — never lowercased. */
export function qualifiedDisplayName(ref: TableRef): string {
  return ref.schema ? `${ref.schema}.${ref.name}` : ref.name;
}

export function tableRefsEqual(a: TableRef, b: TableRef): boolean {
  return tableKey(a) === tableKey(b);
}

export type TableResolution =
  | { kind: 'found'; table: TableSchema }
  | { kind: 'ambiguous'; matches: TableSchema[] }
  | { kind: 'not-found' };

/**
 * Schema-aware lookup over a table list, built once per schema and reused
 * across every consumer that needs to resolve a `TableRef` (ref/records/group
 * resolution in the parser, node/edge/group building in the diagram layer).
 * Avoids re-scanning the table array on every lookup.
 */
export class TableIndex {
  private readonly byKey = new Map<string, TableSchema>();
  private readonly byBareName = new Map<string, TableSchema[]>();

  constructor(tables: TableSchema[]) {
    tables.forEach((table) => {
      this.byKey.set(tableKey(table), table);
      const bareKey = table.name.toLowerCase();
      const existing = this.byBareName.get(bareKey);
      if (existing) existing.push(table);
      else this.byBareName.set(bareKey, [table]);
    });
  }

  /**
   * A qualified ref resolves directly by canonical key. An unqualified ref
   * resolves only when exactly one table shares that bare name across every
   * schema — two or more is reported as ambiguous rather than guessed at.
   */
  resolve(ref: TableRef): TableResolution {
    if (ref.schema) {
      const table = this.byKey.get(tableKey(ref));
      return table ? { kind: 'found', table } : { kind: 'not-found' };
    }
    const matches = this.byBareName.get(ref.name.toLowerCase()) ?? [];
    if (matches.length === 0) return { kind: 'not-found' };
    if (matches.length === 1) return { kind: 'found', table: matches[0] };
    return { kind: 'ambiguous', matches };
  }
}
