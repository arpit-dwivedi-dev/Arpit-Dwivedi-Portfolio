import { createBlankRequest, createEmptyAuth, createRow, type ApiRequest } from '../types';
import { generateAxiosCode } from './axios';

const baseRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  ...createBlankRequest(),
  url: 'https://api.example.com/users',
  ...overrides,
});

describe('generateAxiosCode', () => {
  it('generates an Axios-native GET call, not a Fetch call in disguise', () => {
    const code = generateAxiosCode(baseRequest({ method: 'GET' }));
    expect(code).toContain("import axios from 'axios';");
    expect(code).toContain('axios({');
    expect(code).toContain('method: "GET"');
    expect(code).toContain('url: "https://api.example.com/users"');
    expect(code).not.toContain('fetch(');
  });

  it('passes a JSON body as a plain object under data, not a stringified string', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{"name":"John"}', formFields: [] },
    });
    const code = generateAxiosCode(request);
    expect(code).toContain('data: {');
    expect(code).toContain('"name": "John"');
    expect(code).not.toContain('JSON.stringify');
  });

  it('includes custom headers', () => {
    const request = baseRequest({ headers: [{ ...createRow(), key: 'X-Custom', value: 'value1' }] });
    const code = generateAxiosCode(request);
    expect(code).toContain('"X-Custom": "value1"');
  });

  it('maps the configured timeout to Axios timeout (already in ms, no conversion)', () => {
    const request = baseRequest({ timeoutMs: 15_000 });
    const code = generateAxiosCode(request);
    expect(code).toContain('timeout: 15000,');
  });

  it('omits the timeout key when there is no finite timeout', () => {
    const request = baseRequest({ timeoutMs: 0 });
    const code = generateAxiosCode(request);
    expect(code).not.toContain('timeout:');
  });

  it('adds an Authorization: Bearer header for bearer auth', () => {
    const request = baseRequest({ auth: { ...createEmptyAuth(), type: 'bearer', bearerToken: 'abc123' } });
    const code = generateAxiosCode(request);
    expect(code).toContain('"Authorization": "Bearer abc123"');
  });

  it('sets withCredentials only for credentials=include, not same-origin/omit', () => {
    expect(generateAxiosCode(baseRequest({ credentials: 'include' }))).toContain('withCredentials: true');
    expect(generateAxiosCode(baseRequest({ credentials: 'omit' }))).not.toContain('withCredentials');
    const sameOriginCode = generateAxiosCode(baseRequest({ credentials: 'same-origin' }));
    expect(sameOriginCode).not.toContain('withCredentials');
    expect(sameOriginCode).toContain('same-origin');
  });

  it('does not include Cookie-style browser header filtering — Axios is not restricted to browser-legal headers', () => {
    const request = baseRequest({ headers: [{ ...createRow(), key: 'Cookie', value: 'session=abc123' }] });
    const code = generateAxiosCode(request);
    expect(code).toContain('"Cookie": "session=abc123"');
  });
});
