import { buildShareUrl, readSharedSchemaFromUrl, clearShareParamFromUrl } from './urlShare';
import { parseDbml } from '../parser/dbmlParser';

/** Minimal `window.location`/`history` stand-in — this module only ever
 *  reads `location.href`/`location.search` and calls `history.replaceState`. */
function mockWindowAt(href: string) {
  let current = new URL(href);
  Object.defineProperty(global, 'window', {
    value: {
      get location() {
        return { href: current.href, search: current.search };
      },
      history: {
        replaceState: (_state: unknown, _title: string, url: string) => {
          current = new URL(url, current.href);
        },
      },
    },
    configurable: true,
  });
  return () => current;
}

const QUALIFIED_DBML = `
Table public.users {
  id integer [pk]
  email varchar
}
Table auth.users {
  id integer [pk]
  email varchar
}
Table billing.invoices {
  id integer [pk]
  user_id integer
}
Ref: public.users.id < billing.invoices.user_id
`;

describe('URL sharing — schema-qualified DBML', () => {
  afterEach(() => jest.restoreAllMocks());

  it('survives compression/decompression with schema names, qualified tables and relationships intact', () => {
    mockWindowAt('https://example.com/tools/developer/dbml-diagram-builder');

    const { url } = buildShareUrl(QUALIFIED_DBML);
    mockWindowAt(url);

    const restored = readSharedSchemaFromUrl();
    expect(restored).toBe(QUALIFIED_DBML);
  });

  it('reconstructs the same canonical table identities — duplicate table names across schemas survive', () => {
    mockWindowAt('https://example.com/tools/developer/dbml-diagram-builder');
    const { url } = buildShareUrl(QUALIFIED_DBML);
    mockWindowAt(url);

    const restored = readSharedSchemaFromUrl();
    const schema = parseDbml(restored!);
    expect(schema.tables.map((t) => t.qualifiedName)).toEqual(['public.users', 'auth.users', 'billing.invoices']);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0]).toMatchObject({ sourceTable: 'billing.invoices', targetTable: 'public.users' });
    expect(schema.warnings).toEqual([]);
  });

  it('removes the share param from the URL after being read, without touching the rest of the URL', () => {
    mockWindowAt('https://example.com/tools/developer/dbml-diagram-builder');
    const { url } = buildShareUrl(QUALIFIED_DBML);
    const getCurrent = mockWindowAt(url);
    expect(getCurrent().searchParams.has('schema')).toBe(true);

    clearShareParamFromUrl();

    expect(getCurrent().searchParams.has('schema')).toBe(false);
    expect(getCurrent().pathname).toBe('/tools/developer/dbml-diagram-builder');
  });

  it('returns null when there is nothing shared in the URL', () => {
    mockWindowAt('https://example.com/tools/developer/dbml-diagram-builder');
    expect(readSharedSchemaFromUrl()).toBeNull();
  });
});
