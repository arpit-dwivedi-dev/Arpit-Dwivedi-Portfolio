import { convertItem } from './itemConverter';

const requestItem = (overrides: Record<string, unknown> = {}) => ({
  name: 'Get a user',
  request: { method: 'GET', url: '{{baseUrl}}/users/1', header: [], ...overrides },
});

describe('convertItem — methods', () => {
  it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])('converts a %s request', (method) => {
    const result = convertItem(requestItem({ method }), undefined);
    expect(result?.request.method).toBe(method);
  });

  it('is case-insensitive about method casing', () => {
    const result = convertItem(requestItem({ method: 'get' }), undefined);
    expect(result?.request.method).toBe('GET');
  });

  it('skips an unsupported/custom method rather than fabricating support', () => {
    const result = convertItem(requestItem({ method: 'LINK' }), undefined);
    expect(result).toBeNull();
  });
});

describe('convertItem — naming', () => {
  it('uses item.name when present', () => {
    const result = convertItem(requestItem({}), undefined);
    expect(result?.name).toBe('Get a user');
  });

  it('derives "METHOD path" when item.name is missing', () => {
    const item = { request: { method: 'POST', url: '{{baseUrl}}/users', header: [] } };
    const result = convertItem(item, undefined);
    expect(result?.name).toBe('POST {{baseUrl}}/users');
  });

  it('never produces an excessively long name', () => {
    const item = { request: { method: 'GET', url: `{{baseUrl}}/${'segment/'.repeat(30)}`, header: [] } };
    const result = convertItem(item, undefined);
    expect(result?.name.length).toBeLessThanOrEqual(80);
  });
});

describe('convertItem — headers', () => {
  it('maps normal headers and preserves disabled state', () => {
    const item = requestItem({
      header: [
        { key: 'Accept', value: 'application/json' },
        { key: 'X-Debug', value: '1', disabled: true },
      ],
    });
    const result = convertItem(item, undefined);
    expect(result?.request.headers).toEqual([
      expect.objectContaining({ key: 'Accept', value: 'application/json', enabled: true }),
      expect.objectContaining({ key: 'X-Debug', value: '1', enabled: false }),
    ]);
  });

  it('preserves a Cookie header rather than silently discarding it', () => {
    const item = requestItem({ header: [{ key: 'Cookie', value: 'session=abc' }] });
    const result = convertItem(item, undefined);
    expect(result?.request.headers).toEqual([expect.objectContaining({ key: 'Cookie', value: 'session=abc' })]);
  });
});

describe('convertItem — auth inheritance and dynamic variables', () => {
  it('uses the request its own auth when present', () => {
    const item = requestItem({ auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] } });
    const result = convertItem(item, { type: 'basic', basic: [] });
    expect(result?.request.auth.type).toBe('bearer');
  });

  it('falls back to inherited auth when the request has no auth key', () => {
    const item = requestItem({});
    const result = convertItem(item, { type: 'bearer', bearer: [{ key: 'token', value: '{{inheritedToken}}' }] });
    expect(result?.request.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: '{{inheritedToken}}' }));
  });

  it('reports dynamic Postman variables found anywhere in the request', () => {
    const item = requestItem({ url: '{{baseUrl}}/track/{{$randomUUID}}' });
    const result = convertItem(item, undefined);
    expect(result?.dynamicVariableNames).toContain('randomUUID');
  });
});
