import { createRefResolver } from './refs';
import { generateSchemaSample } from './sampleGenerator';

const resolver = (root: Record<string, unknown> = {}) => createRefResolver(root);

describe('generateSchemaSample', () => {
  it('generates a sample object from properties', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } } };
    expect(generateSchemaSample(schema, resolver())).toEqual({ name: '', age: 0 });
  });

  it('generates a sample array using the first item schema', () => {
    const schema = { type: 'array', items: { type: 'string' } };
    expect(generateSchemaSample(schema, resolver())).toEqual(['']);
  });

  it('generates an empty-string sample for a plain string', () => {
    expect(generateSchemaSample({ type: 'string' }, resolver())).toBe('');
  });

  it('generates 0 for integer and number', () => {
    expect(generateSchemaSample({ type: 'integer' }, resolver())).toBe(0);
    expect(generateSchemaSample({ type: 'number' }, resolver())).toBe(0);
  });

  it('generates true for boolean', () => {
    expect(generateSchemaSample({ type: 'boolean' }, resolver())).toBe(true);
  });

  it('picks the first enum value deterministically', () => {
    const schema = { type: 'string', enum: ['b', 'a', 'c'] };
    expect(generateSchemaSample(schema, resolver())).toBe('b');
    expect(generateSchemaSample(schema, resolver())).toBe('b');
  });

  it('produces recognizable samples for known string formats', () => {
    expect(generateSchemaSample({ type: 'string', format: 'email' }, resolver())).toBe('user@example.com');
    expect(generateSchemaSample({ type: 'string', format: 'date' }, resolver())).toBe('2024-01-01');
    expect(generateSchemaSample({ type: 'string', format: 'date-time' }, resolver())).toBe('2024-01-01T00:00:00Z');
    expect(generateSchemaSample({ type: 'string', format: 'uuid' }, resolver())).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('prefers an explicit example over generating one', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } }, example: { name: 'Ada' } };
    expect(generateSchemaSample(schema, resolver())).toEqual({ name: 'Ada' });
  });

  it('prefers default over a generated sample when there is no example', () => {
    expect(generateSchemaSample({ type: 'integer', default: 42 }, resolver())).toBe(42);
  });

  it('tolerates `nullable: true` without producing null or crashing', () => {
    const schema = { type: 'string', nullable: true };
    expect(generateSchemaSample(schema, resolver())).toBe('');
  });

  it('handles OpenAPI 3.1-style nullable via a type array', () => {
    const schema = { type: ['string', 'null'] };
    expect(generateSchemaSample(schema, resolver())).toBe('');
  });

  it('resolves a local $ref inside a schema', () => {
    const root = { components: { schemas: { User: { type: 'object', properties: { id: { type: 'string' } } } } } };
    const schema = { $ref: '#/components/schemas/User' };
    expect(generateSchemaSample(schema, resolver(root))).toEqual({ id: '' });
  });

  it('never hangs or crashes on a directly circular schema (A.self -> A)', () => {
    const root: Record<string, unknown> = { components: { schemas: {} } };
    (root.components as Record<string, unknown>).schemas = {
      Node: { type: 'object', properties: { value: { type: 'string' }, self: { $ref: '#/components/schemas/Node' } } },
    };
    const schema = { $ref: '#/components/schemas/Node' };
    const result = generateSchemaSample(schema, resolver(root)) as Record<string, unknown>;
    expect(result.value).toBe('');
    // The circular branch stops expanding rather than recursing forever.
    expect(result.self).toBeNull();
  });

  it('never hangs or crashes on a mutually circular schema (User.children[] -> User)', () => {
    const root: Record<string, unknown> = { components: { schemas: {} } };
    (root.components as Record<string, unknown>).schemas = {
      User: {
        type: 'object',
        properties: { name: { type: 'string' }, children: { type: 'array', items: { $ref: '#/components/schemas/User' } } },
      },
    };
    const schema = { $ref: '#/components/schemas/User' };
    expect(() => generateSchemaSample(schema, resolver(root))).not.toThrow();
    const result = generateSchemaSample(schema, resolver(root)) as Record<string, unknown>;
    expect(result.name).toBe('');
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('returns null for an unresolved remote $ref rather than crashing', () => {
    const schema = { $ref: 'https://example.com/schemas/user.json' };
    expect(generateSchemaSample(schema, resolver())).toBeNull();
  });

  it('returns null for a non-schema value', () => {
    expect(generateSchemaSample(null, resolver())).toBeNull();
    expect(generateSchemaSample('not a schema', resolver())).toBeNull();
  });

  it('merges allOf branches into one object sample', () => {
    const schema = {
      allOf: [{ type: 'object', properties: { id: { type: 'string' } } }, { type: 'object', properties: { age: { type: 'integer' } } }],
    };
    expect(generateSchemaSample(schema, resolver())).toEqual({ id: '', age: 0 });
  });
});
