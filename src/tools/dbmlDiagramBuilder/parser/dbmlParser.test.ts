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

  it('skips Enum blocks without crashing and warns', () => {
    const schema = parseDbml(`
      Enum status {
        active
        inactive
      }
      Table users { id integer [pk] status varchar }
    `);
    expect(schema.tables).toHaveLength(1);
    expect(schema.warnings.some((w) => /enum/i.test(w.message))).toBe(true);
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
});
