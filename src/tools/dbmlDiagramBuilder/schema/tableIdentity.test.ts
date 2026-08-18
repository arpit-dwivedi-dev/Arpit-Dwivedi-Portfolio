import { tableKey, qualifiedDisplayName, tableRefsEqual, TableIndex } from './tableIdentity';
import type { TableSchema } from '../types';

function makeTable(overrides: Partial<TableSchema> & { name: string }): TableSchema {
  return {
    id: overrides.id ?? overrides.name,
    columns: [],
    qualifiedName: overrides.schema ? `${overrides.schema}.${overrides.name}` : overrides.name,
    ...overrides,
  };
}

describe('tableKey', () => {
  it('is just the lowercased name for an unqualified table', () => {
    expect(tableKey({ name: 'users' })).toBe('users');
    expect(tableKey({ name: 'Users' })).toBe('users');
  });

  it('is schema.name lowercased for a qualified table', () => {
    expect(tableKey({ schema: 'public', name: 'users' })).toBe('public.users');
    expect(tableKey({ schema: 'Public', name: 'Users' })).toBe('public.users');
  });

  it('never collides two different schemas with the same table name', () => {
    expect(tableKey({ schema: 'public', name: 'users' })).not.toBe(tableKey({ schema: 'auth', name: 'users' }));
  });

  it('keeps an unqualified table distinct from a qualified table of the same name', () => {
    expect(tableKey({ name: 'users' })).not.toBe(tableKey({ schema: 'public', name: 'users' }));
  });
});

describe('qualifiedDisplayName', () => {
  it('renders schema.name when qualified', () => {
    expect(qualifiedDisplayName({ schema: 'public', name: 'users' })).toBe('public.users');
  });

  it('renders just the name when unqualified', () => {
    expect(qualifiedDisplayName({ name: 'users' })).toBe('users');
  });

  it('preserves original casing for display, unlike the canonical key', () => {
    expect(qualifiedDisplayName({ schema: 'Public', name: 'Users' })).toBe('Public.Users');
  });
});

describe('tableRefsEqual', () => {
  it('is case-insensitive', () => {
    expect(tableRefsEqual({ schema: 'Public', name: 'Users' }, { schema: 'public', name: 'users' })).toBe(true);
  });

  it('treats a missing schema as distinct from any schema', () => {
    expect(tableRefsEqual({ name: 'users' }, { schema: 'public', name: 'users' })).toBe(false);
  });
});

describe('TableIndex', () => {
  it('resolves a qualified ref directly by canonical key', () => {
    const index = new TableIndex([makeTable({ schema: 'public', name: 'users' }), makeTable({ schema: 'auth', name: 'users' })]);
    const resolution = index.resolve({ schema: 'auth', name: 'users' });
    expect(resolution.kind).toBe('found');
    expect(resolution.kind === 'found' && resolution.table.qualifiedName).toBe('auth.users');
  });

  it('resolves an unqualified ref when exactly one table matches the bare name', () => {
    const index = new TableIndex([makeTable({ schema: 'public', name: 'users' }), makeTable({ name: 'posts' })]);
    const resolution = index.resolve({ name: 'posts' });
    expect(resolution.kind).toBe('found');
  });

  it('reports ambiguity instead of guessing when an unqualified ref matches multiple schemas', () => {
    const index = new TableIndex([makeTable({ schema: 'public', name: 'users' }), makeTable({ schema: 'auth', name: 'users' })]);
    const resolution = index.resolve({ name: 'users' });
    expect(resolution.kind).toBe('ambiguous');
    expect(resolution.kind === 'ambiguous' && resolution.matches).toHaveLength(2);
  });

  it('reports not-found for a qualified ref whose schema.table does not exist', () => {
    const index = new TableIndex([makeTable({ schema: 'public', name: 'users' })]);
    expect(index.resolve({ schema: 'billing', name: 'invoices' }).kind).toBe('not-found');
  });

  it('reports not-found for a bare name that matches nothing', () => {
    const index = new TableIndex([makeTable({ name: 'users' })]);
    expect(index.resolve({ name: 'ghost' }).kind).toBe('not-found');
  });

  it('never confuses a qualified lookup with an unqualified table of the same name', () => {
    const index = new TableIndex([makeTable({ name: 'users' })]);
    expect(index.resolve({ schema: 'public', name: 'users' }).kind).toBe('not-found');
  });
});
