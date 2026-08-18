import { renameTableInDbml, validateTableName } from './renameTable';
import { parseDbml } from '../parser/dbmlParser';

const SAMPLE = `// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table follows {
  following_user_id integer [not null]
  followed_user_id integer [not null]
  created_at timestamp
}

Table users {
  id integer [primary key]
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer [not null]
  status varchar
  created_at timestamp
}

Ref user_posts: posts.user_id > users.id // many-to-one

Ref: users.id < follows.following_user_id

Ref: users.id < follows.followed_user_id

Records users(id, username, role) {
  0, 'Alice', 'admin'
  1, 'Bob', 'moderator'
}
`;

const bare = (name: string) => ({ name });

describe('renameTableInDbml', () => {
  it('renames the declaration, every ref endpoint and the Records block', () => {
    const out = renameTableInDbml(SAMPLE, bare('users'), bare('accounts'));

    expect(out).toContain('Table accounts {');
    expect(out).toContain('Ref user_posts: posts.user_id > accounts.id');
    expect(out).toContain('Ref: accounts.id < follows.following_user_id');
    expect(out).toContain('Ref: accounts.id < follows.followed_user_id');
    expect(out).toContain('Records accounts(id, username, role)');
    expect(out).not.toMatch(/\busers\b/);
  });

  it('preserves comments, blank lines and inline notes verbatim', () => {
    const out = renameTableInDbml(SAMPLE, bare('users'), bare('accounts'));

    expect(out).toContain('// Use DBML to define your database structure');
    expect(out).toContain('// Docs: https://dbml.dbdiagram.io/docs');
    expect(out).toContain('> accounts.id // many-to-one');
    expect(out).toContain("body text [note: 'Content of the post']");
    // Only the table name changed, so the line count must be identical.
    expect(out.split('\n')).toHaveLength(SAMPLE.split('\n').length);
  });

  it('keeps the schema equivalent after renaming', () => {
    const before = parseDbml(SAMPLE);
    const after = parseDbml(renameTableInDbml(SAMPLE, bare('users'), bare('accounts')));

    expect(after.warnings).toEqual(before.warnings);
    expect(after.tables.map((t) => t.name)).toEqual(['follows', 'accounts', 'posts']);
    expect(after.relationships).toHaveLength(before.relationships.length);
    expect(after.relationships.every((r) => r.targetTable !== 'users')).toBe(true);
    expect(after.records[0].table).toBe('accounts');
  });

  it('does not touch columns that share the table name', () => {
    const dbml = `
Table status {
  id integer [primary key]
}
Table orders {
  status varchar
  status_id integer [ref: > status.id]
}
`;
    const out = renameTableInDbml(dbml, bare('status'), bare('order_status'));
    expect(out).toContain('Table order_status {');
    expect(out).toContain('  status varchar');
    expect(out).toContain('[ref: > order_status.id]');
  });

  it('rewrites TableGroup members', () => {
    const dbml = `
Table users { id integer }
TableGroup core {
  users
}
`;
    expect(renameTableInDbml(dbml, bare('users'), bare('accounts'))).toContain('  accounts\n');
  });

  it('quotes a name that is not a bare identifier', () => {
    const dbml = 'Table users { id integer }\nRef: users.id - users.id';
    const out = renameTableInDbml(dbml, bare('users'), bare('user accounts'));
    expect(out).toContain('Table "user accounts" {');
    expect(out).toContain('Ref: "user accounts".id - "user accounts".id');
  });

  it('is a no-op for an unknown or unchanged name', () => {
    expect(renameTableInDbml(SAMPLE, bare('ghost'), bare('x'))).toBe(SAMPLE);
    expect(renameTableInDbml(SAMPLE, bare('users'), bare('users'))).toBe(SAMPLE);
    expect(renameTableInDbml(SAMPLE, bare('users'), bare('   '))).toBe(SAMPLE);
  });

  it('renames only the schema-matching table, leaving a same-named table in another schema untouched', () => {
    const dbml = `
Table public.users {
  id integer [pk]
}
Table auth.users {
  id integer [pk]
}
Ref: public.users.id < auth.users.id
`;
    const out = renameTableInDbml(dbml, { schema: 'public', name: 'users' }, { schema: 'public', name: 'accounts' });
    expect(out).toContain('Table public.accounts {');
    expect(out).toContain('Table auth.users {');
    expect(out).toContain('Ref: public.accounts.id < auth.users.id');
  });

  it('does not rename an unqualified table when the target is schema-qualified, or vice versa', () => {
    const dbml = `
Table users { id integer [pk] }
Table public.users { id integer [pk] }
`;
    const qualifiedOnly = renameTableInDbml(dbml, { schema: 'public', name: 'users' }, { schema: 'public', name: 'accounts' });
    expect(qualifiedOnly).toContain('Table users {');
    expect(qualifiedOnly).toContain('Table public.accounts {');

    const bareOnly = renameTableInDbml(dbml, bare('users'), bare('accounts'));
    expect(bareOnly).toContain('Table accounts {');
    expect(bareOnly).toContain('Table public.users {');
  });
});

describe('validateTableName', () => {
  const refs = [bare('users'), bare('posts')];

  it('rejects empty names', () => {
    expect(validateTableName('  ', refs, bare('users')).ok).toBe(false);
  });

  it('rejects a collision with another table', () => {
    expect(validateTableName('posts', refs, bare('users'))).toEqual({
      ok: false,
      error: 'A table named "posts" already exists.',
    });
  });

  it('allows keeping the current name, including case changes', () => {
    expect(validateTableName('users', refs, bare('users')).ok).toBe(true);
    expect(validateTableName('Users', refs, bare('users')).ok).toBe(true);
  });

  it('does not flag a collision with a same-named table in a different schema', () => {
    const withSchemas = [{ schema: 'public', name: 'users' }, { schema: 'auth', name: 'users' }];
    expect(validateTableName('users', withSchemas, { schema: 'public', name: 'users' }).ok).toBe(true);
  });

  it('rejects a collision within the same schema', () => {
    const withSchemas = [{ schema: 'public', name: 'users' }, { schema: 'public', name: 'accounts' }];
    expect(validateTableName('accounts', withSchemas, { schema: 'public', name: 'users' }).ok).toBe(false);
  });
});
