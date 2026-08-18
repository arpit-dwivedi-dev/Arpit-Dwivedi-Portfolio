import { tableKey, qualifiedDisplayName } from '../schema/tableIdentity';
import type { ColumnSchema, DatabaseSchema, TableSchema } from '../types';

export interface TableSearchResult {
  kind: 'table';
  /** Canonical node id — see `tableKey`. */
  key: string;
  table: TableSchema;
  score: number;
}

export interface ColumnSearchResult {
  kind: 'column';
  key: string;
  /** Parent table's canonical node id, for focusing it on the diagram. */
  tableKey: string;
  table: TableSchema;
  column: ColumnSchema;
  score: number;
}

export type SchemaSearchResult = TableSearchResult | ColumnSearchResult;

export interface SchemaSearchResults {
  tables: TableSearchResult[];
  columns: ColumnSearchResult[];
}

interface SearchableTable {
  key: string;
  table: TableSchema;
  bareName: string;
  qualifiedName: string;
}

interface SearchableColumn {
  key: string;
  tableKey: string;
  table: TableSchema;
  column: ColumnSchema;
  name: string;
}

export interface SchemaSearchIndex {
  tables: SearchableTable[];
  columns: SearchableColumn[];
}

/**
 * Built once per parsed schema (memoize on `schema` in the caller) so a
 * keystroke never re-derives lowercase keys from `schema.tables` — it only
 * re-filters this already-flattened, already-lowercased list.
 */
export function buildSchemaSearchIndex(schema: DatabaseSchema): SchemaSearchIndex {
  const tables: SearchableTable[] = schema.tables.map((table) => ({
    key: tableKey(table),
    table,
    bareName: table.name.toLowerCase(),
    qualifiedName: qualifiedDisplayName(table).toLowerCase(),
  }));

  const columns: SearchableColumn[] = [];
  schema.tables.forEach((table) => {
    const key = tableKey(table);
    table.columns.forEach((column) => {
      columns.push({ key: `${key}::${column.id}`, tableKey: key, table, column, name: column.name.toLowerCase() });
    });
  });

  return { tables, columns };
}

/** Lower is a stronger match: exact (0) < prefix (1) < substring elsewhere (2). No match is `null`. */
function matchScore(candidate: string, query: string): number | null {
  if (candidate === query) return 0;
  if (candidate.startsWith(query)) return 1;
  if (candidate.includes(query)) return 2;
  return null;
}

const MAX_RESULTS_PER_GROUP = 30;

function byScoreThenName<T extends { score: number }>(nameOf: (v: T) => string) {
  return (a: T, b: T) => a.score - b.score || nameOf(a).localeCompare(nameOf(b));
}

/**
 * Case-insensitive, schema-aware search over an index built by
 * `buildSchemaSearchIndex`. A table matches on either its bare name or its
 * `schema.name` display form (so `public.users` and `auth.users` both stay
 * findable and distinct); a column matches on its own name only. Results are
 * capped per group so a huge schema can't flood the UI with matches.
 */
export function searchSchema(index: SchemaSearchIndex, rawQuery: string): SchemaSearchResults {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return { tables: [], columns: [] };

  const tables: TableSearchResult[] = [];
  for (const entry of index.tables) {
    const bareScore = matchScore(entry.bareName, query);
    const qualifiedScore = matchScore(entry.qualifiedName, query);
    if (bareScore === null && qualifiedScore === null) continue;
    const score = Math.min(bareScore ?? Infinity, qualifiedScore ?? Infinity);
    tables.push({ kind: 'table', key: entry.key, table: entry.table, score });
  }

  const columns: ColumnSearchResult[] = [];
  for (const entry of index.columns) {
    const score = matchScore(entry.name, query);
    if (score === null) continue;
    columns.push({ kind: 'column', key: entry.key, tableKey: entry.tableKey, table: entry.table, column: entry.column, score });
  }

  tables.sort(byScoreThenName((t) => t.table.qualifiedName));
  columns.sort(byScoreThenName((c) => c.column.name));

  return {
    tables: tables.slice(0, MAX_RESULTS_PER_GROUP),
    columns: columns.slice(0, MAX_RESULTS_PER_GROUP),
  };
}

/** Flattens grouped results into one navigable list — tables before columns, matching the UI's grouping. */
export function flattenSearchResults(results: SchemaSearchResults): SchemaSearchResult[] {
  return [...results.tables, ...results.columns];
}

/** Clamped index move for arrow-key navigation over a results list of the given length. */
export function moveActiveIndex(current: number, direction: 1 | -1, length: number): number {
  if (length === 0) return 0;
  const next = current + direction;
  return Math.min(Math.max(0, next), length - 1);
}

export interface FocusTarget {
  tableKey: string;
  columnId?: string;
}

/** What selecting a result should focus on the diagram. */
export function resultToFocusTarget(result: SchemaSearchResult): FocusTarget {
  return result.kind === 'table' ? { tableKey: result.key } : { tableKey: result.tableKey, columnId: result.column.id };
}
