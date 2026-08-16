import { createRefResolver, derefOnce, isLocalRef } from './refs';

describe('isLocalRef', () => {
  it('recognizes a local JSON Pointer ref', () => {
    expect(isLocalRef('#/components/schemas/User')).toBe(true);
  });

  it('rejects a remote URL ref', () => {
    expect(isLocalRef('https://example.com/schemas/user.json')).toBe(false);
  });

  it('rejects a relative file ref', () => {
    expect(isLocalRef('./user.yaml#/User')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isLocalRef(undefined)).toBe(false);
    expect(isLocalRef(42)).toBe(false);
  });
});

describe('createRefResolver', () => {
  const root = {
    components: {
      schemas: {
        User: { type: 'object', properties: { id: { type: 'string' } } },
      },
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  };

  it('resolves a local schema ref', () => {
    const resolve = createRefResolver(root);
    expect(resolve('#/components/schemas/User')).toEqual(root.components.schemas.User);
  });

  it('resolves a local security scheme ref', () => {
    const resolve = createRefResolver(root);
    expect(resolve('#/components/securitySchemes/bearerAuth')).toEqual(root.components.securitySchemes.bearerAuth);
  });

  it('returns undefined for a ref that does not exist', () => {
    const resolve = createRefResolver(root);
    expect(resolve('#/components/schemas/Missing')).toBeUndefined();
  });

  it('returns undefined for a remote ref rather than fetching it', () => {
    const resolve = createRefResolver(root);
    expect(resolve('https://example.com/schemas/user.json')).toBeUndefined();
  });

  it('decodes ~0/~1 JSON Pointer escapes', () => {
    const withEscapes = { components: { schemas: { 'a/b~c': { type: 'string' } } } };
    const resolve = createRefResolver(withEscapes);
    expect(resolve('#/components/schemas/a~1b~0c')).toEqual({ type: 'string' });
  });

  it('memoizes repeated lookups of the same ref', () => {
    const resolve = createRefResolver(root);
    const first = resolve('#/components/schemas/User');
    const second = resolve('#/components/schemas/User');
    expect(first).toBe(second);
  });
});

describe('derefOnce', () => {
  const root = { components: { schemas: { User: { type: 'object' } } } };

  it('follows a single $ref hop', () => {
    const resolve = createRefResolver(root);
    expect(derefOnce({ $ref: '#/components/schemas/User' }, resolve)).toEqual({ type: 'object' });
  });

  it('returns the value unchanged when it is not a $ref object', () => {
    const resolve = createRefResolver(root);
    expect(derefOnce({ type: 'string' }, resolve)).toEqual({ type: 'string' });
  });

  it('returns undefined for a remote $ref', () => {
    const resolve = createRefResolver(root);
    expect(derefOnce({ $ref: 'https://example.com/user.json' }, resolve)).toBeUndefined();
  });
});
