import { parseDbml } from '../parser/dbmlParser';
import {
  detectCompletionContext,
  getColumnSuggestions,
  getDbmlCompletions,
  getTableSuggestions,
  TOP_LEVEL_KEYWORDS,
} from './completions';
import type { DatabaseSchema } from '../types';

const EMPTY_SCHEMA: DatabaseSchema = { tables: [], relationships: [], records: [], enums: [], tableGroups: [], warnings: [] };

/** `cursor("Ref: |")` splits on the `|` marker and returns the text (marker removed) plus its offset. */
function cursor(marked: string): { text: string; offset: number } {
  const offset = marked.indexOf('|');
  if (offset < 0) throw new Error(`missing cursor marker "|" in: ${marked}`);
  return { text: marked.slice(0, offset) + marked.slice(offset + 1), offset };
}

function labels(suggestions: { label: string }[]): string[] {
  return suggestions.map((s) => s.label);
}

const SCHEMA_DBML = `
Table public.users {
  id integer [primary key]
  email varchar [not null]
  auth_id integer
}

Table auth.users {
  id integer [primary key]
  password_hash varchar
}

Table posts {
  id integer [primary key]
  user_id integer
}
`;

const SCHEMA = parseDbml(SCHEMA_DBML);

describe('detectCompletionContext — top-level', () => {
  it('suggests top-level keywords at the start of a fresh statement', () => {
    const { text, offset } = cursor('|');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('top-level');
    expect(ctx.partial).toBe('');
  });

  it('captures the partial word already typed', () => {
    const { text, offset } = cursor('Tab|');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('top-level');
    expect(ctx.partial).toBe('Tab');
    expect(ctx.from).toBe(0);
  });

  it('does not suggest keywords once a keyword is already fully typed and awaiting its own name', () => {
    const { text, offset } = cursor('Table |');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('none');
  });

  it('returns to top-level after a table block closes', () => {
    const { text, offset } = cursor('Table users {\n  id integer\n}\n|');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('top-level');
  });
});

describe('getDbmlCompletions — top-level suggestions', () => {
  it('offers exactly the supported top-level keywords', () => {
    const { text, offset } = cursor('|');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions).sort()).toEqual([...TOP_LEVEL_KEYWORDS].sort());
  });

  it('filters by the partial prefix, case-insensitively', () => {
    const { text, offset } = cursor('tab|');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['Table', 'TableGroup'].sort());
  });
});

describe('table suggestions in Ref context', () => {
  it('suggests known tables right after "Ref: "', () => {
    const { text, offset } = cursor('Ref: |');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('table-ref');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['auth.users', 'posts', 'public.users'].sort());
  });

  it('suggests tables inside a braced Ref block', () => {
    const { text, offset } = cursor('Ref {\n  |\n}');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('table-ref');
  });

  it('suggests tables for the second endpoint after the operator', () => {
    const { text, offset } = cursor('Ref: posts.user_id > |');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('table-ref');
  });

  it('filters bare table candidates by the typed prefix', () => {
    const { text, offset } = cursor('Ref: po|');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions)).toEqual(['posts']);
  });
});

describe('schema-qualified table suggestions', () => {
  it('suggests schema-qualified names when a schema prefix is typed', () => {
    const { text, offset } = cursor('Ref: pub|');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions)).toEqual(['public.users']);
  });

  it('keeps public.users and auth.users distinct candidates', () => {
    const { text, offset } = cursor('Ref: |');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions)).toContain('public.users');
    expect(labels(suggestions)).toContain('auth.users');
  });

  it('replaces the whole partial chain, not just the trailing segment', () => {
    const { text, offset } = cursor('Ref: public.us|');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('table-ref');
    expect(ctx.partial).toBe('public.us');
    expect(ctx.from).toBe('Ref: '.length);
  });

  it('suggests schema-qualified tables for TableGroup members too', () => {
    const { text, offset } = cursor('TableGroup g {\n  pub|\n}');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions)).toEqual(['public.users']);
  });
});

describe('column suggestions after schema.table.', () => {
  it('suggests the correct columns for a schema-qualified table', () => {
    const { text, offset } = cursor('Ref: public.users.|');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('column-ref');
    expect(ctx.table?.qualifiedName).toBe('public.users');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['auth_id', 'email', 'id'].sort());
  });

  it('resolves the other schema distinctly', () => {
    const { text, offset } = cursor('Ref: auth.users.|');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['id', 'password_hash'].sort());
  });

  it('suggests columns for an unqualified, unambiguous table', () => {
    const { text, offset } = cursor('Ref: posts.|');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['id', 'user_id'].sort());
  });

  it('filters columns by partial prefix', () => {
    const { text, offset } = cursor('Ref: public.users.em|');
    const { suggestions } = getDbmlCompletions(text, offset, SCHEMA);
    expect(labels(suggestions)).toEqual(['email']);
  });

  it('gives up gracefully on an ambiguous unqualified table name', () => {
    // "users" alone matches both public.users and auth.users.
    const { text, offset } = cursor('Ref: users.|');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('table-ref');
  });
});

describe('type suggestions', () => {
  it('suggests column types right after a column name', () => {
    const { text, offset } = cursor('Table users {\n  id |\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('column-type');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions)).toContain('integer');
    expect(labels(suggestions)).toContain('varchar');
  });

  it('filters types while they are still being typed', () => {
    const { text, offset } = cursor('Table users {\n  id var|\n}');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions)).toEqual(['varchar']);
  });

  it('does not suggest a type before any column name has been typed', () => {
    const { text, offset } = cursor('Table users {\n  |\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('none');
  });
});

describe('attribute suggestions inside [ ... ]', () => {
  it('suggests only parser-supported column attributes', () => {
    const { text, offset } = cursor('Table users {\n  id integer [|]\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('column-attribute');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions).sort()).toEqual(
      ['pk', 'primary key', 'not null', 'null', 'unique', 'increment', 'default', 'note', 'ref'].sort(),
    );
  });

  it('filters column attributes by prefix', () => {
    const { text, offset } = cursor('Table users {\n  id integer [n|]\n}');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['not null', 'null', 'note'].sort());
  });

  it('suggests table-level attributes in the table header bracket', () => {
    const { text, offset } = cursor('Table users [|] {\n  id integer\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('table-attribute');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['note', 'headercolor'].sort());
  });

  it('suggests index-level attributes inside an indexes entry bracket', () => {
    const { text, offset } = cursor('Table users {\n  id integer\n  indexes {\n    (id) [|]\n  }\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('index-attribute');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions).sort()).toEqual(['pk', 'unique', 'name'].sort());
  });
});

describe('context detection across block kinds', () => {
  it('suggests nothing inside an Enum body', () => {
    const { text, offset } = cursor('Enum status {\n  |\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('none');
  });

  it('suggests nothing inside an indexes body before any bracket', () => {
    const { text, offset } = cursor('Table users {\n  id integer\n  indexes {\n    |\n  }\n}');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('none');
  });

  it('recognizes a braceless Ref statement on the current line', () => {
    const { text, offset } = cursor('Ref: users.id > po|');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('table-ref');
  });

  it('does not leak a braceless Ref context onto the next line', () => {
    const { text, offset } = cursor('Ref: users.id > posts.user_id\n|');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('top-level');
  });
});

describe('duplicate table names across schemas', () => {
  it('keeps schema-qualified duplicates as distinct suggestions', () => {
    const suggestions = getTableSuggestions(SCHEMA);
    const names = labels(suggestions);
    expect(names.filter((n) => n === 'public.users')).toHaveLength(1);
    expect(names.filter((n) => n === 'auth.users')).toHaveLength(1);
  });

  it('dedupes a genuinely duplicated declaration to a single suggestion', () => {
    const dupSchema = parseDbml(`
Table users { id integer }
Table users { id integer }
`);
    expect(dupSchema.warnings.some((w) => w.message.includes('Duplicate table'))).toBe(true);
    const suggestions = getTableSuggestions(dupSchema);
    expect(labels(suggestions)).toEqual(['users']);
  });
});

describe('incomplete / malformed DBML', () => {
  it('still detects table-body context with an unclosed table brace', () => {
    const { text, offset } = cursor('Table users {\n  id |');
    const ctx = detectCompletionContext(text, offset, EMPTY_SCHEMA);
    expect(ctx.kind).toBe('column-type');
  });

  it('recovers gracefully from a dangling qualified-name dot', () => {
    const { text, offset } = cursor('Ref: public.|');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    // "public" isn't itself a standalone table, so this is still a table-ref position.
    expect(ctx.kind).toBe('table-ref');
  });

  it('falls back to no suggestions for a malformed 3-part chain that resolves to nothing', () => {
    const { text, offset } = cursor('Ref: nope.nowhere.|');
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('none');
  });

  it('keeps working using the last valid schema even while the current text is broken elsewhere', () => {
    // The Table block above is malformed (missing "{"), but the Ref line below
    // is a normal, independently-parseable position — context detection must
    // not throw or get confused by the earlier garbage.
    const { text, offset } = cursor('Table oops\nRef: public.users.|');
    expect(() => detectCompletionContext(text, offset, SCHEMA)).not.toThrow();
    const ctx = detectCompletionContext(text, offset, SCHEMA);
    expect(ctx.kind).toBe('column-ref');
  });

  it('never throws on an empty document', () => {
    expect(() => detectCompletionContext('', 0, EMPTY_SCHEMA)).not.toThrow();
    expect(detectCompletionContext('', 0, EMPTY_SCHEMA).kind).toBe('top-level');
  });
});

describe('filtering / deduplication', () => {
  it('is case-insensitive', () => {
    const { text, offset } = cursor('REC|');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(labels(suggestions)).toEqual(['Records']);
  });

  it('excludes candidates that do not match the typed prefix', () => {
    const { text, offset } = cursor('zzz|');
    const { suggestions } = getDbmlCompletions(text, offset, EMPTY_SCHEMA);
    expect(suggestions).toEqual([]);
  });

  it('never returns two suggestions with the same label and kind', () => {
    const suggestions = getColumnSuggestions(SCHEMA.tables[0]);
    const keys = suggestions.map((s) => `${s.kind}:${s.label.toLowerCase()}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
