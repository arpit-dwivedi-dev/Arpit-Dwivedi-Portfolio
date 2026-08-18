import { parseDbml } from './dbmlParser';

describe('parseDbml — tables and columns', () => {
  it('parses a single table with a primary key column', () => {
    const schema = parseDbml(`
      Table users {
        id integer [primary key]
      }
    `);
    expect(schema.tables).toHaveLength(1);
    const users = schema.tables[0];
    expect(users.name).toBe('users');
    expect(users.columns).toHaveLength(1);
    expect(users.columns[0]).toMatchObject({ name: 'id', type: 'integer', primaryKey: true });
  });

  it('parses common column attributes', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk, increment]
        email varchar [not null, unique]
        role varchar [default: 'member']
        created_at timestamp
      }
    `);
    const [id, email, role, createdAt] = schema.tables[0].columns;
    expect(id).toMatchObject({ primaryKey: true, increment: true });
    expect(email).toMatchObject({ notNull: true, unique: true });
    expect(role).toMatchObject({ defaultValue: 'member' });
    expect(createdAt).toMatchObject({ type: 'timestamp' });
  });

  it('parses column and table notes', () => {
    const schema = parseDbml(`
      Table posts {
        Note: 'Blog posts'
        id integer [primary key]
        body text [note: 'Content of the post']
      }
    `);
    expect(schema.tables[0].note).toBe('Blog posts');
    expect(schema.tables[0].columns[1].note).toBe('Content of the post');
  });

  it('parses types with arguments like decimal(10,2)', () => {
    const schema = parseDbml(`
      Table payments {
        amount decimal(10,2)
      }
    `);
    expect(schema.tables[0].columns[0].type).toBe('decimal(10, 2)');
  });

  it('flags duplicate table names with a warning but keeps both', () => {
    const schema = parseDbml(`
      Table users { id integer }
      Table users { id integer }
    `);
    expect(schema.tables).toHaveLength(2);
    expect(schema.warnings.some((w) => /duplicate table/i.test(w.message))).toBe(true);
  });

  it('flags duplicate columns within a table', () => {
    const schema = parseDbml(`
      Table users {
        id integer
        id varchar
      }
    `);
    expect(schema.tables[0].columns).toHaveLength(2);
    expect(schema.warnings.some((w) => /duplicate column/i.test(w.message))).toBe(true);
  });
});

describe('parseDbml — references', () => {
  it('parses a many-to-one reference with >', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { id integer [pk] user_id integer }
      Ref: posts.user_id > users.id
    `);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0]).toMatchObject({
      sourceTable: 'posts',
      sourceColumn: 'user_id',
      targetTable: 'users',
      targetColumn: 'id',
      relation: 'many-to-one',
    });
  });

  it('normalizes a reversed reference with < to the same shape as >', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table follows { following_user_id integer }
      Ref: users.id < follows.following_user_id
    `);
    expect(schema.relationships[0]).toMatchObject({
      sourceTable: 'follows',
      sourceColumn: 'following_user_id',
      targetTable: 'users',
      targetColumn: 'id',
      relation: 'many-to-one',
    });
  });

  it('parses a one-to-one reference with -', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table profiles { user_id integer }
      Ref: profiles.user_id - users.id
    `);
    expect(schema.relationships[0].relation).toBe('one-to-one');
  });

  it('parses a named reference', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { user_id integer }
      Ref user_posts: posts.user_id > users.id
    `);
    expect(schema.relationships[0].name).toBe('user_posts');
  });

  it('parses multiple references to the same pair of tables', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table follows {
        following_user_id integer
        followed_user_id integer
      }
      Ref: users.id < follows.following_user_id
      Ref: users.id < follows.followed_user_id
    `);
    expect(schema.relationships).toHaveLength(2);
  });

  it('parses an inline column ref shorthand', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts {
        user_id integer [ref: > users.id]
      }
    `);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0]).toMatchObject({ sourceTable: 'posts', targetTable: 'users' });
  });

  it('warns and skips a reference to a missing table without dropping valid tables', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Ref: posts.user_id > users.id
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.relationships).toHaveLength(0);
    expect(schema.warnings.some((w) => /unknown table "posts"/i.test(w.message))).toBe(true);
  });
});

describe('parseDbml — resilience', () => {
  it('does not throw on malformed DBML and still parses what it can', () => {
    expect(() =>
      parseDbml(`
        Table users {
          id integer [primary key
        }
        this is not valid dbml at all ###
        Table posts { id integer }
      `),
    ).not.toThrow();
  });

  it('recovers a valid table after a malformed one', () => {
    const schema = parseDbml(`
      %%% garbage line %%%
      Table posts { id integer [pk] }
    `);
    expect(schema.tables.some((t) => t.name === 'posts')).toBe(true);
  });

  it('does not crash on a Records block and produces no table for it', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        username varchar
      }
      Records users {
        1, 'Alice'
        2, 'Bob'
      }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('users');
  });

  it('skips unknown top-level blocks with a warning instead of failing', () => {
    const schema = parseDbml(`
      TotallyUnknownBlock foo {
        bar: baz
      }
      Table users { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.warnings.some((w) => /unknown block/i.test(w.message))).toBe(true);
  });

  it('parses Enum blocks without crashing or warning', () => {
    const schema = parseDbml(`
      Enum status {
        active
        inactive
      }
      Table users { id integer [pk] status varchar }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.enums).toHaveLength(1);
    expect(schema.warnings).toEqual([]);
  });

  it('parses the full sample schema from the spec without warnings about known constructs', () => {
    const schema = parseDbml(`
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

      Ref user_posts: posts.user_id > users.id

      Ref: users.id < follows.following_user_id

      Ref: users.id < follows.followed_user_id
    `);
    expect(schema.tables.map((t) => t.name).sort()).toEqual(['follows', 'posts', 'users']);
    expect(schema.relationships).toHaveLength(3);
  });

  describe('Records blocks', () => {
    const withRecords = `
      Table users {
        id integer [primary key]
        username varchar
        role varchar
      }

      Records users(id, username, role) {
        0, 'Alice', 'admin'
        1, 'Bob', 'moderator'
        2, 'Candice', null
      }
    `;

    it('parses columns and rows without emitting warnings', () => {
      const schema = parseDbml(withRecords);
      expect(schema.warnings).toEqual([]);
      expect(schema.records).toHaveLength(1);
      expect(schema.records[0].table).toBe('users');
      expect(schema.records[0].columns).toEqual(['id', 'username', 'role']);
      expect(schema.records[0].rows).toEqual([
        ['0', 'Alice', 'admin'],
        ['1', 'Bob', 'moderator'],
        ['2', 'Candice', null],
      ]);
    });

    it('keeps a timestamp-style row intact', () => {
      const schema = parseDbml(`
        Table follows {
          following_user_id integer
          followed_user_id integer
          created_at timestamp
        }
        Records follows(following_user_id, followed_user_id, created_at) {
          1, 0, '2026-01-01'
          3, 2, '2026-02-28'
        }
      `);
      expect(schema.warnings).toEqual([]);
      expect(schema.records[0].rows).toEqual([
        ['1', '0', '2026-01-01'],
        ['3', '2', '2026-02-28'],
      ]);
    });

    it('flags an unknown table', () => {
      const schema = parseDbml(`Records ghosts(id) { 1 }`);
      expect(schema.records).toHaveLength(1);
      expect(schema.warnings[0].message).toContain('unknown table "ghosts"');
    });

    it('flags an unknown column and a row with the wrong arity', () => {
      const schema = parseDbml(`
        Table users { id integer }
        Records users(id, nope) {
          1, 'x'
          2
        }
      `);
      const messages = schema.warnings.map((w) => w.message).join('\n');
      expect(messages).toContain('has no column "nope"');
      expect(messages).toContain('expected 2 value(s) but found 1');
    });
  });

  it('notes when diagnostics are truncated instead of silently dropping the rest', () => {
    // 80 tables each with a duplicate column trips one warning per table —
    // comfortably past the internal MAX_WARNINGS cap of 60.
    const dbml = Array.from(
      { length: 80 },
      (_, i) => `Table t${i} { id integer\n  id integer }`,
    ).join('\n');
    const schema = parseDbml(dbml);
    expect(schema.warnings.length).toBeLessThan(80);
    expect(schema.warnings.some((w) => /issues found/i.test(w.message) && /only the first/i.test(w.message))).toBe(true);
    // The notice is appended exactly once, not once per suppressed diagnostic.
    expect(schema.warnings.filter((w) => /issues found/i.test(w.message))).toHaveLength(1);
  });
});

describe('parseDbml — indexes', () => {
  it('parses a single-column index', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        email varchar
        indexes {
          email
        }
      }
    `);
    expect(schema.tables[0].indexes).toEqual([
      expect.objectContaining({ columns: ['email'], unique: false }),
    ]);
  });

  it('parses a composite index', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        first_name varchar
        last_name varchar
        indexes {
          (first_name, last_name)
        }
      }
    `);
    expect(schema.tables[0].indexes).toEqual([
      expect.objectContaining({ columns: ['first_name', 'last_name'] }),
    ]);
  });

  it('parses a composite primary key index', () => {
    const schema = parseDbml(`
      Table order_items {
        order_id integer
        product_id integer
        indexes {
          (order_id, product_id) [pk]
        }
      }
    `);
    expect(schema.tables[0].indexes?.[0]).toMatchObject({
      columns: ['order_id', 'product_id'],
      pk: true,
    });
  });

  it('parses a unique index', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        email varchar
        indexes {
          email [unique]
        }
      }
    `);
    expect(schema.tables[0].indexes?.[0]).toMatchObject({ columns: ['email'], unique: true });
  });

  it('parses a named index', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        email varchar
        indexes {
          email [name: 'idx_email']
        }
      }
    `);
    expect(schema.tables[0].indexes?.[0]).toMatchObject({ columns: ['email'], name: 'idx_email' });
  });

  it('parses multiple indexes, including the example from the DBML docs', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        email varchar
        first_name varchar
        last_name varchar

        indexes {
          email [unique]
          (first_name, last_name)
        }
      }
    `);
    const indexes = schema.tables[0].indexes;
    expect(indexes).toHaveLength(2);
    expect(indexes?.[0]).toMatchObject({ columns: ['email'], unique: true });
    expect(indexes?.[1]).toMatchObject({ columns: ['first_name', 'last_name'], unique: false });
    expect(schema.warnings).toEqual([]);
  });

  it('handles an empty index block without error', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        indexes {
        }
      }
    `);
    expect(schema.tables[0].indexes ?? []).toEqual([]);
    expect(schema.warnings).toEqual([]);
  });

  it('flags an index referencing a nonexistent column but keeps parsing', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        indexes {
          ghost_column
        }
      }
      Table posts {
        id integer [pk]
      }
    `);
    expect(schema.tables).toHaveLength(2);
    expect(schema.tables[0].indexes).toEqual([
      expect.objectContaining({ columns: ['ghost_column'] }),
    ]);
    expect(schema.warnings.some((w) => /references unknown column "ghost_column"/i.test(w.message))).toBe(
      true,
    );
  });

  it('does not crash on a malformed index entry', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        indexes {
          ,
          email
        }
      }
      Table posts { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(2);
    expect(schema.tables[0].indexes?.some((idx) => idx.columns.includes('email'))).toBe(true);
  });
});

describe('parseDbml — enums', () => {
  it('parses a basic enum', () => {
    const schema = parseDbml(`
      Enum user_status {
        active
        inactive
        suspended
      }
    `);
    expect(schema.enums).toHaveLength(1);
    expect(schema.enums[0]).toMatchObject({ name: 'user_status' });
    expect(schema.warnings).toEqual([]);
  });

  it('preserves enum value order', () => {
    const schema = parseDbml(`
      Enum user_status {
        active
        inactive
        suspended
      }
    `);
    expect(schema.enums[0].values.map((v) => v.name)).toEqual(['active', 'inactive', 'suspended']);
  });

  it('parses multiple enums', () => {
    const schema = parseDbml(`
      Enum user_status {
        active
        inactive
      }
      Enum post_status {
        draft
        published
        archived
      }
    `);
    expect(schema.enums).toHaveLength(2);
    expect(schema.enums.map((e) => e.name)).toEqual(['user_status', 'post_status']);
    expect(schema.enums[1].values.map((v) => v.name)).toEqual(['draft', 'published', 'archived']);
  });

  it('supports quoted enum values', () => {
    const schema = parseDbml(`
      Enum grade {
        'A+'
        'A'
        'B'
      }
    `);
    expect(schema.enums[0].values.map((v) => v.name)).toEqual(['A+', 'A', 'B']);
  });

  it('handles an empty enum block without error', () => {
    const schema = parseDbml(`
      Enum empty_enum {
      }
    `);
    expect(schema.enums).toHaveLength(1);
    expect(schema.enums[0].values).toEqual([]);
    expect(schema.warnings).toEqual([]);
  });

  it('does not crash on a malformed enum declaration missing a name', () => {
    const schema = parseDbml(`
      Enum {
        active
      }
      Table users { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.warnings.some((w) => /missing enum name/i.test(w.message))).toBe(true);
  });

  it('does not crash on an enum missing its opening brace', () => {
    const schema = parseDbml(`
      Enum broken
      Table users { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.warnings.some((w) => /expected "\{"/i.test(w.message))).toBe(true);
  });

  it('flags duplicate enum names but keeps both', () => {
    const schema = parseDbml(`
      Enum user_status {
        active
      }
      Enum user_status {
        inactive
      }
    `);
    expect(schema.enums).toHaveLength(2);
    expect(schema.warnings.some((w) => /duplicate enum name/i.test(w.message))).toBe(true);
  });

  it('associates a table column with its enum type in the diagram data', () => {
    const schema = parseDbml(`
      Enum user_status {
        active
        inactive
        suspended
      }

      Table users {
        id integer [pk]
        status user_status
      }
    `);
    expect(schema.tables[0].columns.find((c) => c.name === 'status')?.type).toBe('user_status');
    expect(schema.enums[0].name).toBe('user_status');
  });
});

describe('parseDbml — table groups', () => {
  it('parses a table group and preserves member order', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table orders { id integer [pk] }

      TableGroup commerce {
        users
        orders
      }
    `);
    expect(schema.tableGroups).toHaveLength(1);
    expect(schema.tableGroups[0]).toMatchObject({ name: 'commerce', tables: ['users', 'orders'] });
    expect(schema.warnings).toEqual([]);
  });

  it('supports an unquoted multi-word group name', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table orders { id integer [pk] }

      TableGroup User Management {
        users
        orders
      }
    `);
    expect(schema.tableGroups[0].name).toBe('User Management');
    expect(schema.tableGroups[0].tables).toEqual(['users', 'orders']);
  });

  it('supports the table_group alias and a quoted name', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }

      table_group "Core" {
        users
      }
    `);
    expect(schema.tableGroups[0].name).toBe('Core');
  });

  it('parses a group-level color setting', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }

      TableGroup commerce [color: #808080] {
        users
      }
    `);
    expect(schema.tableGroups[0].color).toBe('#808080');
  });

  it('parses a group note written as Note: "..."', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }

      TableGroup commerce {
        users
        Note: 'Core commerce tables'
      }
    `);
    expect(schema.tableGroups[0].note).toBe('Core commerce tables');
  });

  it('preserves a schema qualifier on a member name', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }

      TableGroup commerce {
        public.users
      }
    `);
    expect(schema.tableGroups[0].tables).toEqual(['public.users']);
    expect(schema.tableGroups[0].tableRefs).toEqual([{ schema: 'public', name: 'users' }]);
    expect(schema.warnings).toEqual([]);
  });

  it('ignores per-member settings without breaking subsequent members', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table orders { id integer [pk] }

      TableGroup commerce {
        users [color: #cabbca]
        orders
      }
    `);
    expect(schema.tableGroups[0].tables).toEqual(['users', 'orders']);
  });

  it('parses multiple table groups', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { id integer [pk] }

      TableGroup people {
        users
      }
      TableGroup content {
        posts
      }
    `);
    expect(schema.tableGroups.map((g) => g.name)).toEqual(['people', 'content']);
  });

  it('warns but keeps the group when a member references an unknown table', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }

      TableGroup commerce {
        users
        ghost_table
      }
    `);
    expect(schema.tableGroups[0].tables).toEqual(['users', 'ghost_table']);
    expect(schema.warnings.some((w) => /unknown table "ghost_table"/i.test(w.message))).toBe(true);
  });

  it('does not crash on a table group missing its opening brace', () => {
    const schema = parseDbml(`
      TableGroup broken
      Table users { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.warnings.some((w) => /expected "\{"/i.test(w.message))).toBe(true);
  });

  it('does not crash on an unclosed table group block', () => {
    const schema = parseDbml(`
      TableGroup commerce {
        users
    `);
    expect(schema.warnings.some((w) => /missing a closing/i.test(w.message))).toBe(true);
  });
});

describe('parseDbml — fatal errors', () => {
  const fatal = (schema: ReturnType<typeof parseDbml>) => schema.warnings.filter((w) => w.severity === 'error');

  it('reports a malformed table declaration as a fatal error with a valid line', () => {
    const schema = parseDbml(`
      Table {
        id integer
      }
    `);
    const errors = fatal(schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].line).toBe(2);
  });

  it('reports an unclosed table block as a fatal error, pointing at the closest valid location', () => {
    const schema = parseDbml(`Table users {
  id integer [pk]
  username varchar`);
    const errors = fatal(schema);
    expect(errors.some((w) => /missing a closing/i.test(w.message))).toBe(true);
    // The brace never closes, so the "closest valid location" is the last
    // line the tokenizer actually reached (end of source), not an omitted
    // or negative line.
    const err = errors.find((w) => /missing a closing/i.test(w.message))!;
    expect(err.line).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(err.line)).toBe(true);
  });

  it('reports a malformed Ref statement as a fatal error', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { id integer [pk] }
      Ref: posts.user_id users.id
    `);
    const errors = fatal(schema);
    expect(errors.some((w) => /malformed reference/i.test(w.message))).toBe(true);
    expect(errors[0].line).toBe(4);
  });

  it('reports a malformed indexes entry inside a nested block as a fatal error', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
        indexes {
          [unique]
        }
      }
    `);
    const errors = fatal(schema);
    expect(errors.some((w) => /malformed index entry/i.test(w.message))).toBe(true);
    expect(errors[0].line).toBe(5);
  });

  it('reports an unexpected token in the middle of the file as a fatal error on its own line', () => {
    const schema = parseDbml(`
      Table users {
        id integer [pk]
      }

      @@@ unexpected garbage @@@

      Table posts {
        id integer [pk]
      }
    `);
    const errors = fatal(schema);
    expect(errors.some((w) => /unexpected token/i.test(w.message))).toBe(true);
    // Recovery keeps working around the fatal token — both valid tables
    // are still parsed even though a fatal error was recorded.
    expect(schema.tables.map((t) => t.name)).toEqual(['users', 'posts']);
  });

  it('reports a fatal error on the first line when the file opens with malformed input', () => {
    const schema = parseDbml('Table { id integer }');
    const errors = fatal(schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].line).toBe(1);
  });

  it('reports a fatal error correctly after several valid lines', () => {
    const schema = parseDbml(`Table users {
  id integer [pk]
  username varchar
  email varchar
}
Table {
  id integer
}`);
    const errors = fatal(schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].line).toBe(6);
    expect(schema.tables.some((t) => t.name === 'users')).toBe(true);
  });

  it('reports a malformed multi-line Ref block as a fatal error and keeps its own valid entries', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { id integer [pk] user_id integer }
      Ref {
        posts.user_id > users.id
        posts.user_id users.id
      }
    `);
    const errors = fatal(schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(schema.relationships).toHaveLength(1);
  });

  it('never produces an invalid or negative line number, even for degenerate input', () => {
    const schema = parseDbml('###');
    for (const w of schema.warnings) {
      expect(w.line).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(w.line)).toBe(true);
    }
  });

  it('falls back to the closest valid source location when no closing brace is ever found', () => {
    // A table opened on line 2 that never closes before EOF: there is no
    // "exact" location for the missing brace, so the fatal error should
    // still land on a real, in-range line rather than being dropped.
    const source = `
      Table users {
        id integer [pk]
        username varchar
        email varchar`;
    const schema = parseDbml(source);
    const lineCount = source.split('\n').length;
    const errors = fatal(schema);
    const err = errors.find((w) => /missing a closing/i.test(w.message));
    expect(err).toBeDefined();
    expect(err!.line).toBeGreaterThanOrEqual(1);
    expect(err!.line).toBeLessThanOrEqual(lineCount);
  });

  it('does not downgrade a non-structural warning (e.g. duplicate table name) into a fatal error', () => {
    const schema = parseDbml(`
      Table users { id integer }
      Table users { id integer }
    `);
    expect(fatal(schema)).toHaveLength(0);
    expect(schema.warnings.some((w) => /duplicate table/i.test(w.message) && w.severity === 'warning')).toBe(true);
  });
});

describe('parseDbml — schema-qualified tables', () => {
  it('parses a schema-qualified table, keeping schema, name and qualifiedName separate', () => {
    const schema = parseDbml(`
      Table public.users {
        id integer [pk]
      }
    `);
    expect(schema.tables[0]).toMatchObject({
      schema: 'public',
      name: 'users',
      qualifiedName: 'public.users',
    });
    expect(schema.warnings).toEqual([]);
  });

  it('leaves an unqualified table with no schema — never inventing one', () => {
    const schema = parseDbml(`Table users { id integer [pk] }`);
    expect(schema.tables[0].schema).toBeUndefined();
    expect(schema.tables[0].qualifiedName).toBe('users');
  });

  it('supports quoted schema and quoted table identifiers', () => {
    const schema = parseDbml(`
      Table "my schema"."my table" {
        id integer [pk]
      }
    `);
    expect(schema.tables[0]).toMatchObject({
      schema: 'my schema',
      name: 'my table',
      qualifiedName: 'my schema.my table',
    });
    expect(schema.warnings).toEqual([]);
  });

  it('keeps same-named tables in different schemas distinct, without a duplicate warning', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table auth.users { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(2);
    expect(schema.tables.map((t) => t.qualifiedName)).toEqual(['public.users', 'auth.users']);
    expect(schema.warnings.some((w) => /duplicate table/i.test(w.message))).toBe(false);
  });

  it('parses several distinct schemas in one document', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table billing.invoices { id integer [pk] }
      Table auth.sessions { id integer [pk] }
    `);
    expect(schema.tables.map((t) => t.qualifiedName)).toEqual(['public.users', 'billing.invoices', 'auth.sessions']);
  });

  it('flags a duplicate fully-qualified table identity but keeps both copies', () => {
    const schema = parseDbml(`
      Table public.users { id integer }
      Table public.users { id integer }
    `);
    expect(schema.tables).toHaveLength(2);
    expect(schema.warnings.some((w) => /duplicate table "public\.users"/i.test(w.message))).toBe(true);
  });

  it('does not confuse an unqualified table with a schema-qualified table of the same bare name', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table public.users { id integer [pk] }
    `);
    expect(schema.tables).toHaveLength(2);
    expect(schema.warnings.some((w) => /duplicate table/i.test(w.message))).toBe(false);
  });

  it('flags a malformed qualified name missing the table part, recovering the schema as the table name', () => {
    const schema = parseDbml(`
      Table public. {
        id integer [pk]
      }
    `);
    expect(schema.warnings.some((w) => /malformed qualified table name/i.test(w.message) && w.severity === 'error')).toBe(true);
    expect(schema.tables[0].name).toBe('public');
  });

  it('flags a malformed qualified name with too many parts', () => {
    const schema = parseDbml(`
      Table a.b.c {
        id integer [pk]
      }
    `);
    expect(
      schema.warnings.some((w) => /malformed qualified table name/i.test(w.message) && /too many parts/i.test(w.message)),
    ).toBe(true);
  });
});

describe('parseDbml — schema-aware references', () => {
  it('resolves an explicit schema-qualified reference', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table billing.invoices { id integer [pk] user_id integer }
      Ref: public.users.id < billing.invoices.user_id
    `);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0]).toMatchObject({
      sourceTable: 'billing.invoices',
      sourceColumn: 'user_id',
      targetTable: 'public.users',
      targetColumn: 'id',
    });
    expect(schema.warnings).toEqual([]);
  });

  it('resolves a same-schema reference', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table public.orders { id integer [pk] user_id integer }
      Ref: public.users.id < public.orders.user_id
    `);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.warnings).toEqual([]);
  });

  it('resolves a cross-schema reference', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table billing.invoices { user_id integer }
      Ref: billing.invoices.user_id > public.users.id
    `);
    expect(schema.relationships[0]).toMatchObject({ sourceTable: 'billing.invoices', targetTable: 'public.users' });
    expect(schema.warnings).toEqual([]);
  });

  it('resolves an unqualified reference when it uniquely identifies one table', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table posts { user_id integer }
      Ref: posts.user_id > users.id
    `);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0].targetTable).toBe('public.users');
    expect(schema.warnings).toEqual([]);
  });

  it('emits an ambiguity diagnostic — never a guess — for an unqualified reference matching multiple schemas', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table auth.users { id integer [pk] }
      Table posts { user_id integer }
      Ref: posts.user_id > users.id
    `);
    expect(schema.relationships).toHaveLength(0);
    expect(schema.warnings.some((w) => /ambiguous table "users"/i.test(w.message))).toBe(true);
  });

  it('emits an unresolved-reference diagnostic for a qualified table that does not exist, without crashing', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Ref: public.users.id < billing.invoices.user_id
    `);
    expect(schema.relationships).toHaveLength(0);
    expect(schema.warnings.some((w) => /unknown table "billing\.invoices"/i.test(w.message))).toBe(true);
  });

  it('emits an unresolved-column diagnostic when the qualified table exists but the column does not', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table billing.invoices { id integer [pk] }
      Ref: public.users.id < billing.invoices.ghost_column
    `);
    expect(schema.warnings.some((w) => /"billing\.invoices" has no column "ghost_column"/i.test(w.message))).toBe(true);
  });

  it('flags a malformed qualified Ref with too many parts without crashing', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Ref: a.b.c.d > public.users.id
    `);
    expect(() => schema).not.toThrow();
    expect(schema.warnings.some((w) => /too many parts/i.test(w.message) && w.severity === 'error')).toBe(true);
  });

  it('does not crash on a qualified Ref with a dangling dot', () => {
    expect(() =>
      parseDbml(`
        Table public.users { id integer [pk] }
        Ref: public.users.id < billing.
      `),
    ).not.toThrow();
  });
});
