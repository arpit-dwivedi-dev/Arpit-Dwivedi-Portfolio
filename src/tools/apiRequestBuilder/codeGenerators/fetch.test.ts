import { createBlankRequest, createEmptyAuth, createRow, type ApiRequest } from '../types';
import { buildUrlWithParams } from '../urlUtils';
import { generateFetchCode } from './fetch';

const baseRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  ...createBlankRequest(),
  url: 'https://api.example.com/users',
  ...overrides,
});

describe('generateFetchCode', () => {
  it('generates a GET request with no body key', () => {
    const code = generateFetchCode(baseRequest({ method: 'GET' }));
    expect(code).toContain('fetch("https://api.example.com/users"');
    expect(code).toContain('method: "GET"');
    expect(code).not.toContain('body:');
  });

  it('generates a structurally formatted JSON.stringify body for a POST, not an escaped string', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{"name":"John"}', formFields: [] },
    });
    const code = generateFetchCode(request);
    expect(code).toContain('method: "POST"');
    expect(code).toContain('body: JSON.stringify({');
    expect(code).toContain('"name": "John"');
    expect(code).not.toContain('JSON.stringify("{');
    expect(code).toContain('"Content-Type": "application/json"');
  });

  it('includes custom headers', () => {
    const request = baseRequest({ headers: [{ ...createRow(), key: 'X-Custom', value: 'value1' }] });
    const code = generateFetchCode(request);
    expect(code).toContain('"X-Custom": "value1"');
  });

  it('reuses buildUrlWithParams for query params rather than re-encoding them', () => {
    const request = baseRequest({ params: [{ ...createRow(), key: 'q', value: 'hello world' }] });
    const code = generateFetchCode(request);
    const expectedUrl = buildUrlWithParams(request.url, request.params);
    expect(code).toContain(`fetch(${JSON.stringify(expectedUrl)}`);
  });

  it('adds an Authorization: Bearer header for bearer auth', () => {
    const request = baseRequest({ auth: { ...createEmptyAuth(), type: 'bearer', bearerToken: 'abc123' } });
    const code = generateFetchCode(request);
    expect(code).toContain('"Authorization": "Bearer abc123"');
  });

  it('preserves an API key configured for the query location rather than moving it to a header', () => {
    const request = baseRequest({
      auth: { ...createEmptyAuth(), type: 'api-key', apiKeyName: 'apiKey', apiKeyValue: 'secret', apiKeyLocation: 'query' },
    });
    const code = generateFetchCode(request);
    expect(code).toContain('apiKey=secret');
    expect(code).not.toContain('"apiKey": "secret"');
  });

  it('wraps the call in AbortController + setTimeout for a configured timeout, and cleans it up', () => {
    const request = baseRequest({ timeoutMs: 15_000 });
    const code = generateFetchCode(request);
    expect(code).toContain('new AbortController()');
    expect(code).toContain('setTimeout(() => controller.abort(), 15000)');
    expect(code).toContain('signal: controller.signal');
    expect(code).toContain('clearTimeout(timeoutId)');
  });

  it('omits the AbortController scaffolding when there is no finite timeout', () => {
    const request = baseRequest({ timeoutMs: 0 });
    const code = generateFetchCode(request);
    expect(code).not.toContain('AbortController');
    expect(code).not.toContain('signal:');
  });

  it.each(['same-origin', 'include', 'omit'] as const)('maps credentials=%s directly to fetch credentials', (mode) => {
    const code = generateFetchCode(baseRequest({ credentials: mode }));
    expect(code).toContain(`credentials: "${mode}"`);
  });

  it('omits a Cookie header from the headers object and explains why, without dropping it from the underlying request', () => {
    const request = baseRequest({ headers: [{ ...createRow(), key: 'Cookie', value: 'session=abc123' }] });
    const code = generateFetchCode(request);
    expect(code).not.toContain('"Cookie"');
    expect(code).toContain('// Cookie header omitted: browsers do not allow scripts to set it directly.');
    // The underlying request object itself must be untouched — omission is a generated-code-only concern.
    expect(request.headers[0].key).toBe('Cookie');
  });

  it('also omits other browser-forbidden headers (Host, Origin, User-Agent)', () => {
    const request = baseRequest({
      headers: [
        { ...createRow(), key: 'Host', value: 'example.com' },
        { ...createRow(), key: 'Origin', value: 'https://example.com' },
        { ...createRow(), key: 'User-Agent', value: 'custom-agent' },
      ],
    });
    const code = generateFetchCode(request);
    expect(code).not.toContain('"Host"');
    expect(code).not.toContain('"Origin"');
    expect(code).not.toContain('"User-Agent"');
  });

  it('uses URLSearchParams for a form-urlencoded body', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'form-urlencoded', raw: '', formFields: [{ ...createRow(), key: 'a', value: '1' }] },
    });
    const code = generateFetchCode(request);
    expect(code).toContain('new URLSearchParams()');
    expect(code).toContain('params.append("a", "1")');
    expect(code).toContain('body: params.toString()');
  });

  it('uses FormData for multipart and never hardcodes a Content-Type/boundary', () => {
    const request = baseRequest({
      method: 'POST',
      body: {
        mode: 'multipart',
        raw: '',
        formFields: [{ ...createRow(), key: 'name', value: 'John' }],
      },
    });
    const code = generateFetchCode(request);
    expect(code).toContain('new FormData()');
    expect(code).toContain('formData.append("name", "John")');
    expect(code).toContain('body: formData');
    expect(code).not.toContain('multipart/form-data');
  });

  it('comments out unrepresentable file fields instead of faking a browser file path', () => {
    const request = baseRequest({
      method: 'POST',
      body: {
        mode: 'multipart',
        raw: '',
        formFields: [{ ...createRow(), key: 'avatar', value: '', isFile: true, fileName: 'photo.png' }],
      },
    });
    const code = generateFetchCode(request);
    expect(code).toContain('File field "avatar"');
    expect(code).toContain('photo.png');
    expect(code).toContain('// formData.append("avatar"');
  });

  it('falls back to a raw string body when the JSON body is malformed, without throwing', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{not valid json', formFields: [] },
    });
    expect(() => generateFetchCode(request)).not.toThrow();
    const code = generateFetchCode(request);
    expect(code).toContain('not valid json');
    expect(code).toContain("isn't valid JSON");
  });
});
