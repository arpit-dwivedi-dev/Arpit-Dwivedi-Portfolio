import { convertSecurityScheme, resolveOperationSecurity } from './security';

describe('convertSecurityScheme', () => {
  it('maps HTTP bearer to bearer auth with an empty token', () => {
    const result = convertSecurityScheme({ type: 'http', scheme: 'bearer' }, 'bearerAuth');
    expect(result.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: '' }));
    expect(result.warning).toBeUndefined();
  });

  it('maps HTTP basic to basic auth with empty credentials', () => {
    const result = convertSecurityScheme({ type: 'http', scheme: 'basic' }, 'basicAuth');
    expect(result.auth).toEqual(expect.objectContaining({ type: 'basic', basicUsername: '', basicPassword: '' }));
  });

  it('maps an API key in a header to api-key/header with an empty value', () => {
    const result = convertSecurityScheme({ type: 'apiKey', in: 'header', name: 'X-API-Key' }, 'apiKeyAuth');
    expect(result.auth).toEqual(expect.objectContaining({ type: 'api-key', apiKeyLocation: 'header', apiKeyName: 'X-API-Key', apiKeyValue: '' }));
  });

  it('maps an API key in a query param to api-key/query with an empty value', () => {
    const result = convertSecurityScheme({ type: 'apiKey', in: 'query', name: 'api_key' }, 'apiKeyAuth');
    expect(result.auth).toEqual(expect.objectContaining({ type: 'api-key', apiKeyLocation: 'query', apiKeyName: 'api_key', apiKeyValue: '' }));
  });

  it('does not carry over a literal example key value from the document', () => {
    // Even if a hostile/careless spec puts a real-looking secret in the scheme itself, nothing
    // on the apiKey scheme object represents a credential value — only `name` (the header/query
    // key's name) is read, never anything resembling a stored secret.
    const result = convertSecurityScheme({ type: 'apiKey', in: 'header', name: 'X-API-Key', 'x-example': 'sk_live_abc123' }, 'apiKeyAuth');
    expect(result.auth?.apiKeyValue).toBe('');
    expect(JSON.stringify(result.auth)).not.toContain('sk_live_abc123');
  });

  it('flags an unsupported HTTP scheme (e.g. digest) with a warning and no auth', () => {
    const result = convertSecurityScheme({ type: 'http', scheme: 'digest' }, 'digestAuth');
    expect(result.auth).toBeNull();
    expect(result.warning).toMatch(/digestAuth/);
  });

  it('flags an API key in a cookie with a warning and no auth', () => {
    const result = convertSecurityScheme({ type: 'apiKey', in: 'cookie', name: 'session' }, 'cookieAuth');
    expect(result.auth).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it('flags OAuth2 as unsupported', () => {
    const result = convertSecurityScheme({ type: 'oauth2', flows: {} }, 'oauth2Auth');
    expect(result.auth).toBeNull();
    expect(result.warning).toMatch(/oauth2Auth/);
  });

  it('flags OpenID Connect as unsupported', () => {
    const result = convertSecurityScheme({ type: 'openIdConnect', openIdConnectUrl: 'https://example.com' }, 'oidcAuth');
    expect(result.auth).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it('flags mutual TLS as unsupported', () => {
    const result = convertSecurityScheme({ type: 'mutualTLS' }, 'mtlsAuth');
    expect(result.auth).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it('handles a malformed/missing scheme without crashing', () => {
    expect(convertSecurityScheme(null, 'x').auth).toBeNull();
    expect(convertSecurityScheme({}, 'x').auth).toBeNull();
    expect(convertSecurityScheme('not-an-object', 'x').auth).toBeNull();
  });
});

describe('resolveOperationSecurity', () => {
  it('uses the operation-level security when present', () => {
    const result = resolveOperationSecurity([{ apiKeyAuth: [] }], [{ bearerAuth: [] }]);
    expect(result.schemeName).toBe('apiKeyAuth');
  });

  it('falls back to document-level security when the operation omits the field', () => {
    const result = resolveOperationSecurity(undefined, [{ bearerAuth: [] }]);
    expect(result.schemeName).toBe('bearerAuth');
  });

  it('treats an explicit empty array as "no auth", distinct from omitting the field', () => {
    const result = resolveOperationSecurity([], [{ bearerAuth: [] }]);
    expect(result.schemeName).toBeNull();
  });

  it('returns null when there is no security anywhere', () => {
    expect(resolveOperationSecurity(undefined, []).schemeName).toBeNull();
  });

  it('flags when multiple schemes/alternatives exist beyond the first applied one', () => {
    const single = resolveOperationSecurity([{ bearerAuth: [] }], []);
    expect(single.extraSchemesIgnored).toBe(false);

    const combined = resolveOperationSecurity([{ bearerAuth: [], apiKeyAuth: [] }], []);
    expect(combined.extraSchemesIgnored).toBe(true);

    const alternatives = resolveOperationSecurity([{ bearerAuth: [] }, { apiKeyAuth: [] }], []);
    expect(alternatives.extraSchemesIgnored).toBe(true);
  });
});
