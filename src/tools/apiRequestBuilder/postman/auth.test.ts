import { convertPostmanAuth, resolveEffectiveAuth } from './auth';

describe('convertPostmanAuth', () => {
  it('maps bearer auth, preserving a {{variable}} template', () => {
    const result = convertPostmanAuth({ type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] });
    expect(result.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: '{{token}}' }));
    expect(result.warning).toBeUndefined();
  });

  it('maps bearer auth, carrying a literal token through for storage to redact later', () => {
    const result = convertPostmanAuth({ type: 'bearer', bearer: [{ key: 'token', value: 'super-secret-token', type: 'string' }] });
    expect(result.auth?.bearerToken).toBe('super-secret-token');
  });

  it('maps basic auth username/password', () => {
    const result = convertPostmanAuth({
      type: 'basic',
      basic: [
        { key: 'username', value: 'alice', type: 'string' },
        { key: 'password', value: 'hunter2', type: 'string' },
      ],
    });
    expect(result.auth).toEqual(expect.objectContaining({ type: 'basic', basicUsername: 'alice', basicPassword: 'hunter2' }));
  });

  it('maps apikey auth located in the header', () => {
    const result = convertPostmanAuth({
      type: 'apikey',
      apikey: [
        { key: 'key', value: 'X-Api-Key', type: 'string' },
        { key: 'value', value: '{{apiKey}}', type: 'string' },
        { key: 'in', value: 'header', type: 'string' },
      ],
    });
    expect(result.auth).toEqual(
      expect.objectContaining({ type: 'api-key', apiKeyName: 'X-Api-Key', apiKeyValue: '{{apiKey}}', apiKeyLocation: 'header' }),
    );
  });

  it('maps apikey auth located in the query string', () => {
    const result = convertPostmanAuth({
      type: 'apikey',
      apikey: [
        { key: 'key', value: 'apiKey', type: 'string' },
        { key: 'value', value: 'abc123', type: 'string' },
        { key: 'in', value: 'query', type: 'string' },
      ],
    });
    expect(result.auth?.apiKeyLocation).toBe('query');
  });

  it('maps noauth to type "none"', () => {
    const result = convertPostmanAuth({ type: 'noauth' });
    expect(result.auth).toEqual(expect.objectContaining({ type: 'none' }));
  });

  it('returns null with undefined auth (no auth field at all)', () => {
    const result = convertPostmanAuth(undefined);
    expect(result.auth).toBeNull();
    expect(result.warning).toBeUndefined();
  });

  it('never fakes support for oauth2 — returns null auth plus a warning', () => {
    const result = convertPostmanAuth({ type: 'oauth2', oauth2: [{ key: 'accessToken', value: 'abc' }] });
    expect(result.auth).toBeNull();
    expect(result.warning).toMatch(/oauth2/i);
  });

  it('never fakes support for awsv4/digest/hawk/ntlm', () => {
    for (const type of ['awsv4', 'digest', 'hawk', 'ntlm']) {
      const result = convertPostmanAuth({ type });
      expect(result.auth).toBeNull();
      expect(result.warning).toBeTruthy();
    }
  });
});

describe('resolveEffectiveAuth', () => {
  it('lets an explicit request-level auth win over an inherited one', () => {
    const inherited = { type: 'bearer' };
    const own = { type: 'noauth' };
    expect(resolveEffectiveAuth(own, inherited)).toEqual(own);
  });

  it('inherits when the request declares no auth key at all', () => {
    const inherited = { type: 'bearer' };
    expect(resolveEffectiveAuth(undefined, inherited)).toEqual(inherited);
  });
});
