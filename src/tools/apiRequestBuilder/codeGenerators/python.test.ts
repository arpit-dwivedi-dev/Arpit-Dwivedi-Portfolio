import { createBlankRequest, createEmptyAuth, createRow, type ApiRequest } from '../types';
import { generatePythonCode } from './python';

const baseRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  ...createBlankRequest(),
  url: 'https://api.example.com/users',
  ...overrides,
});

describe('generatePythonCode', () => {
  it('generates a GET request using requests.get', () => {
    const code = generatePythonCode(baseRequest({ method: 'GET' }));
    expect(code).toContain('import requests');
    expect(code).toContain('requests.get(');
    expect(code).toContain('"https://api.example.com/users"');
  });

  it('uses json= with a Python dict literal for a JSON body, not json.dumps', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{"name":"John","active":true,"tags":null}', formFields: [] },
    });
    const code = generatePythonCode(request);
    expect(code).toContain('requests.post(');
    expect(code).toContain('json=json_body,');
    expect(code).toContain('"name": "John"');
    expect(code).toContain('True');
    expect(code).toContain('None');
    expect(code).not.toContain('json.dumps');
  });

  it('merges enabled query params into the resolved URL', () => {
    const request = baseRequest({ params: [{ ...createRow(), key: 'page', value: '2' }] });
    const code = generatePythonCode(request);
    expect(code).toContain('page=2');
  });

  it('includes custom headers', () => {
    const request = baseRequest({ headers: [{ ...createRow(), key: 'X-Custom', value: 'value1' }] });
    const code = generatePythonCode(request);
    expect(code).toContain('"X-Custom": "value1"');
  });

  it('converts the configured timeout from milliseconds to seconds', () => {
    const request = baseRequest({ timeoutMs: 30_000 });
    const code = generatePythonCode(request);
    expect(code).toContain('timeout=30,');
  });

  it('omits timeout entirely when there is no finite configured timeout', () => {
    const request = baseRequest({ timeoutMs: 0 });
    const code = generatePythonCode(request);
    expect(code).not.toContain('timeout=');
  });

  it('uses the idiomatic auth=(user, pass) tuple for basic auth instead of a hand-encoded header', () => {
    const request = baseRequest({
      auth: { ...createEmptyAuth(), type: 'basic', basicUsername: 'alice', basicPassword: 'wonderland' },
    });
    const code = generatePythonCode(request);
    expect(code).toContain('auth=("alice", "wonderland"),');
    expect(code).not.toContain('Authorization');
    expect(code).not.toContain('Basic ');
  });

  it('keeps bearer auth as an explicit header, since requests has no bearer concept', () => {
    const request = baseRequest({ auth: { ...createEmptyAuth(), type: 'bearer', bearerToken: 'abc123' } });
    const code = generatePythonCode(request);
    expect(code).toContain('"Authorization": "Bearer abc123"');
  });

  it('falls back to a raw string body when the JSON body is malformed, without throwing', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{not valid json', formFields: [] },
    });
    expect(() => generatePythonCode(request)).not.toThrow();
    const code = generatePythonCode(request);
    expect(code).toContain('not valid json');
    expect(code).toContain("isn't valid JSON");
  });

  it('uses a list of (key, value) tuples for form-urlencoded to preserve repeated keys', () => {
    const request = baseRequest({
      method: 'POST',
      body: {
        mode: 'form-urlencoded',
        raw: '',
        formFields: [
          { ...createRow(), key: 'tag', value: 'a' },
          { ...createRow(), key: 'tag', value: 'b' },
        ],
      },
    });
    const code = generatePythonCode(request);
    expect(code).toContain('("tag", "a")');
    expect(code).toContain('("tag", "b")');
    expect(code).toContain('data=form_data,');
  });
});
