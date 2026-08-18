import {
  buildSchemaSearchIndex,
  flattenSearchResults,
  moveActiveIndex,
  resultToFocusTarget,
  searchSchema,
} from './schemaSearch';
import type { ColumnSchema, DatabaseSchema, TableSchema } from '../types';

function makeColumn(overrides: Partial<ColumnSchema> & { name: string }): ColumnSchema {
  return { id: overrides.id ?? overrides.name, type: overrides.type ?? 'text', ...overrides };
}

function makeTable(overrides: Partial<TableSchema> & { name: string; columns?: ColumnSchema[] }): TableSchema {
  return {
    id: overrides.id ?? overrides.name,
    columns: overrides.columns ?? [],
    qualifiedName: overrides.schema ? `${overrides.schema}.${overrides.name}` : overrides.name,
    ...overrides,
  };
}

function makeSchema(tables: TableSchema[]): DatabaseSchema {
  return { tables, relationships: [], records: [], enums: [], tableGroups: [], warnings: [] };
}

describe('searchSchema — table search', () => {
  it('matches a table by its bare name', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ name: 'users' }), makeTable({ name: 'posts' })]));
    const { tables } = searchSchema(index, 'users');
    expect(tables).toHaveLength(1);
    expect(tables[0].table.name).toBe('users');
  });

  it('supports partial (substring) matching', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ name: 'user_accounts' })]));
    const { tables } = searchSchema(index, 'accou');
    expect(tables).toHaveLength(1);
  });

  it('is case-insensitive', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ name: 'Users' })]));
    expect(searchSchema(index, 'USERS').tables).toHaveLength(1);
    expect(searchSchema(index, 'users').tables).toHaveLength(1);
  });

  it('returns no results for an unmatched query', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ name: 'users' })]));
    const results = searchSchema(index, 'ghost');
    expect(results.tables).toHaveLength(0);
    expect(results.columns).toHaveLength(0);
  });

  it('returns nothing for an empty/whitespace query', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ name: 'users' })]));
    expect(searchSchema(index, '').tables).toHaveLength(0);
    expect(searchSchema(index, '   ').tables).toHaveLength(0);
  });
});

describe('searchSchema — column search', () => {
  it('matches a column and reports its parent table', () => {
    const table = makeTable({ name: 'orders', columns: [makeColumn({ name: 'total' }), makeColumn({ name: 'id' })] });
    const index = buildSchemaSearchIndex(makeSchema([table]));
    const { columns } = searchSchema(index, 'total');
    expect(columns).toHaveLength(1);
    expect(columns[0].column.name).toBe('total');
    expect(columns[0].table.name).toBe('orders');
    expect(columns[0].tableKey).toBe('orders');
  });

  it('is case-insensitive and supports partial matches', () => {
    const table = makeTable({ name: 'orders', columns: [makeColumn({ name: 'CreatedAt' })] });
    const index = buildSchemaSearchIndex(makeSchema([table]));
    expect(searchSchema(index, 'created').columns).toHaveLength(1);
    expect(searchSchema(index, 'CREATEDAT').columns).toHaveLength(1);
  });
});

describe('searchSchema — schema-qualified search', () => {
  const schema = makeSchema([
    makeTable({ schema: 'public', name: 'users', columns: [makeColumn({ name: 'id' })] }),
    makeTable({ schema: 'auth', name: 'users', columns: [makeColumn({ name: 'id' })] }),
  ]);

  it('keeps public.users and auth.users distinct results', () => {
    const index = buildSchemaSearchIndex(schema);
    const { tables } = searchSchema(index, 'public.users');
    expect(tables).toHaveLength(1);
    expect(tables[0].table.qualifiedName).toBe('public.users');
  });

  it('resolving auth.users never returns public.users', () => {
    const index = buildSchemaSearchIndex(schema);
    const { tables } = searchSchema(index, 'auth.users');
    expect(tables).toHaveLength(1);
    expect(tables[0].table.qualifiedName).toBe('auth.users');
  });

  it('an unqualified query matches every schema sharing that table name (duplicate names across schemas)', () => {
    const index = buildSchemaSearchIndex(schema);
    const { tables } = searchSchema(index, 'users');
    expect(tables).toHaveLength(2);
    const keys = tables.map((t) => t.key).sort();
    expect(keys).toEqual(['auth.users', 'public.users']);
  });

  it('keeps column results scoped to the correct schema-qualified parent table', () => {
    const index = buildSchemaSearchIndex(schema);
    const { columns } = searchSchema(index, 'id');
    expect(columns).toHaveLength(2);
    const parents = columns.map((c) => c.tableKey).sort();
    expect(parents).toEqual(['auth.users', 'public.users']);
  });
});

describe('searchSchema — match priority', () => {
  it('ranks an exact match before a prefix match before a substring match', () => {
    const index = buildSchemaSearchIndex(
      makeSchema([makeTable({ name: 'user' }), makeTable({ name: 'users_archive' }), makeTable({ name: 'power_user' })]),
    );
    const { tables } = searchSchema(index, 'user');
    expect(tables.map((t) => t.table.name)).toEqual(['user', 'users_archive', 'power_user']);
  });

  it('ranks a prefix match before a weaker substring match for columns', () => {
    const table = makeTable({
      name: 'accounts',
      columns: [makeColumn({ name: 'last_email' }), makeColumn({ name: 'email' })],
    });
    const index = buildSchemaSearchIndex(makeSchema([table]));
    const { columns } = searchSchema(index, 'email');
    expect(columns.map((c) => c.column.name)).toEqual(['email', 'last_email']);
  });
});

describe('searchSchema — filtering and deduplication', () => {
  it('never returns the same table twice even when it matches on both bare and qualified name', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ schema: 'public', name: 'users' })]));
    const { tables } = searchSchema(index, 'users');
    expect(tables).toHaveLength(1);
  });

  it('filters out tables/columns that do not match the query', () => {
    const index = buildSchemaSearchIndex(
      makeSchema([
        makeTable({ name: 'users', columns: [makeColumn({ name: 'id' }), makeColumn({ name: 'name' })] }),
        makeTable({ name: 'orders', columns: [makeColumn({ name: 'total' })] }),
      ]),
    );
    const results = searchSchema(index, 'orders');
    expect(results.tables.map((t) => t.table.name)).toEqual(['orders']);
    expect(results.columns).toHaveLength(0);
  });
});

describe('flattenSearchResults', () => {
  it('lists tables before columns, matching the grouped UI order', () => {
    const table = makeTable({ name: 'user_log', columns: [makeColumn({ name: 'user_id' })] });
    const index = buildSchemaSearchIndex(makeSchema([table]));
    const results = searchSchema(index, 'user');
    const flat = flattenSearchResults(results);
    expect(flat.map((r) => r.kind)).toEqual(['table', 'column']);
  });
});

describe('moveActiveIndex', () => {
  it('moves down and up within bounds', () => {
    expect(moveActiveIndex(0, 1, 5)).toBe(1);
    expect(moveActiveIndex(2, -1, 5)).toBe(1);
  });

  it('clamps at the first and last result instead of wrapping', () => {
    expect(moveActiveIndex(0, -1, 5)).toBe(0);
    expect(moveActiveIndex(4, 1, 5)).toBe(4);
  });

  it('stays at 0 when there are no results', () => {
    expect(moveActiveIndex(0, 1, 0)).toBe(0);
  });
});

describe('resultToFocusTarget', () => {
  it('targets just the table for a table result', () => {
    const index = buildSchemaSearchIndex(makeSchema([makeTable({ schema: 'public', name: 'users' })]));
    const [result] = searchSchema(index, 'users').tables;
    expect(resultToFocusTarget(result)).toEqual({ tableKey: 'public.users', columnId: undefined });
  });

  it('targets the parent table and the column id for a column result', () => {
    const table = makeTable({ schema: 'public', name: 'users', columns: [makeColumn({ name: 'email', id: 'col-1' })] });
    const index = buildSchemaSearchIndex(makeSchema([table]));
    const [result] = searchSchema(index, 'email').columns;
    expect(resultToFocusTarget(result)).toEqual({ tableKey: 'public.users', columnId: 'col-1' });
  });
});

describe('large-schema result generation', () => {
  function buildLargeSchema(tableCount: number, columnsPerTable: number): DatabaseSchema {
    const tables: TableSchema[] = [];
    for (let t = 0; t < tableCount; t += 1) {
      const schemaName = t % 2 === 0 ? 'public' : 'analytics';
      const columns: ColumnSchema[] = [];
      for (let c = 0; c < columnsPerTable; c += 1) {
        columns.push(makeColumn({ id: `t${t}-c${c}`, name: c === 0 ? 'id' : `field_${c}` }));
      }
      tables.push(makeTable({ id: `t${t}`, schema: schemaName, name: `table_${t}`, columns }));
    }
    return makeSchema(tables);
  }

  it('builds an index and searches responsively over 60 tables / 600+ columns', () => {
    const schema = buildLargeSchema(60, 10);
    expect(schema.tables.length).toBeGreaterThanOrEqual(50);
    expect(schema.tables.reduce((n, t) => n + t.columns.length, 0)).toBeGreaterThanOrEqual(500);

    const index = buildSchemaSearchIndex(schema);
    const start = Date.now();
    const byTable = searchSchema(index, 'table_1');
    const byColumn = searchSchema(index, 'field_3');
    const elapsed = Date.now() - start;

    // A generous ceiling — this is a smoke check against accidental O(n^2)
    // rescans, not a strict perf budget.
    expect(elapsed).toBeLessThan(200);

    // table_1, table_10..table_19, table_11? etc. all substring/prefix-match "table_1".
    expect(byTable.tables.length).toBeGreaterThan(0);
    expect(byTable.tables[0].table.name).toBe('table_1');

    // Every table has a `field_3` column, capped at the per-group limit.
    expect(byColumn.columns.length).toBeGreaterThan(0);
    expect(byColumn.columns.every((c) => c.column.name === 'field_3')).toBe(true);
  });

  it('caps results per group so a huge schema cannot flood the UI', () => {
    const schema = buildLargeSchema(80, 8);
    const index = buildSchemaSearchIndex(schema);
    // "table_" substring-matches all 80 tables and "id" matches every table's id column.
    const results = searchSchema(index, 'table_');
    const idResults = searchSchema(index, 'id');
    expect(results.tables.length).toBeLessThanOrEqual(30);
    expect(idResults.columns.length).toBeLessThanOrEqual(30);
  });
});
