import { validatePostmanDocument } from './validator';

const v21 = (extra: Record<string, unknown> = {}) => ({
  info: { name: 'My API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  item: [],
  ...extra,
});

const v20 = (extra: Record<string, unknown> = {}) => ({
  info: { name: 'My API', schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json' },
  item: [],
  ...extra,
});

describe('validatePostmanDocument', () => {
  it('accepts a valid v2.1 document', () => {
    const result = validatePostmanDocument(v21());
    expect(result.ok).toBe(true);
    expect(result.doc?.schemaVersion).toBe('2.1');
    expect(result.doc?.title).toBe('My API');
  });

  it('accepts a valid v2.0 document', () => {
    const result = validatePostmanDocument(v20());
    expect(result.ok).toBe(true);
    expect(result.doc?.schemaVersion).toBe('2.0');
  });

  it('rejects an unrecognized/unsupported schema', () => {
    const result = validatePostmanDocument({ info: { name: 'x', schema: 'https://schema.getpostman.com/json/collection/v1.0.0/collection.json' }, item: [] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/v2\.0 and v2\.1/);
  });

  it('rejects a document missing info.schema entirely', () => {
    const result = validatePostmanDocument({ info: { name: 'x' }, item: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects a document that is not an object', () => {
    const result = validatePostmanDocument('just a string');
    expect(result.ok).toBe(false);
  });

  it('rejects a document with no item array', () => {
    const result = validatePostmanDocument({ info: { name: 'x', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no requests to import/i);
  });

  it('falls back to "Imported Postman Collection" when info.name is missing', () => {
    const result = validatePostmanDocument(v21({ info: { schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' } }));
    expect(result.doc?.title).toBe('Imported Postman Collection');
  });

  it('collects collection-level variable, auth, and event', () => {
    const doc = v21({
      variable: [{ key: 'baseUrl', value: 'https://api.example.com' }],
      auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] },
      event: [{ listen: 'prerequest', script: { exec: ['console.log(1)'] } }],
    });
    const result = validatePostmanDocument(doc);
    expect(result.doc?.variables).toHaveLength(1);
    expect(result.doc?.auth).toEqual({ type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] });
    expect(result.doc?.events).toHaveLength(1);
  });
});
