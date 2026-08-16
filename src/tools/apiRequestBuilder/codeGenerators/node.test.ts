import { createBlankRequest, createRow, type ApiRequest } from '../types';
import { generateNodeCode } from './node';

const baseRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  ...createBlankRequest(),
  url: 'https://api.example.com/users',
  ...overrides,
});

describe('generateNodeCode', () => {
  it('generates a GET request using native fetch(), no external package', () => {
    const code = generateNodeCode(baseRequest({ method: 'GET' }));
    expect(code).toContain('fetch("https://api.example.com/users"');
    expect(code).toContain('method: "GET"');
    expect(code).not.toContain('node-fetch');
    expect(code).not.toContain('require(');
  });

  it('generates a POST with a structurally formatted JSON.stringify body', () => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{"name":"John"}', formFields: [] },
    });
    const code = generateNodeCode(request);
    expect(code).toContain('method: "POST"');
    expect(code).toContain('body: JSON.stringify({');
    expect(code).toContain('"name": "John"');
  });

  it('uses AbortSignal.timeout() for a configured timeout', () => {
    const request = baseRequest({ timeoutMs: 15_000 });
    const code = generateNodeCode(request);
    expect(code).toContain('signal: AbortSignal.timeout(15000)');
  });

  it('omits the signal option when there is no finite timeout', () => {
    const request = baseRequest({ timeoutMs: 0 });
    const code = generateNodeCode(request);
    expect(code).not.toContain('AbortSignal');
    expect(code).not.toContain('signal:');
  });

  it('includes custom headers without browser-forbidden filtering', () => {
    const request = baseRequest({
      headers: [
        { ...createRow(), key: 'Cookie', value: 'session=abc123' },
        { ...createRow(), key: 'X-Custom', value: 'value1' },
      ],
    });
    const code = generateNodeCode(request);
    expect(code).toContain('"Cookie": "session=abc123"');
    expect(code).toContain('"X-Custom": "value1"');
  });
});
