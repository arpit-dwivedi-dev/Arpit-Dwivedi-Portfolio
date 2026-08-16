import { createBlankRequest, createRow, type ApiRequest } from './types';
import {
  MAX_SHARE_ENCODED_LENGTH,
  SHARE_QUERY_PARAM,
  buildShareUrl,
  decodeShareRequest,
  encodeShareRequest,
  readShareParam,
  sanitizeForShare,
} from './shareRequest';
import { compressToEncodedURIComponent } from 'lz-string';

const requestWithSecrets = (): ApiRequest => ({
  ...createBlankRequest(),
  method: 'POST',
  url: '{{baseUrl}}/anything',
  headers: [
    { ...createRow(), key: 'X-Api-Key', value: '{{apiKey}}' },
    { ...createRow(), key: 'Cookie', value: 'session=secret' },
  ],
  auth: { type: 'bearer', bearerToken: 'secret-token', basicUsername: '', basicPassword: '', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
  body: { mode: 'json', raw: '{"name":"Arpit"}', formFields: [] },
  timeoutMs: 60_000,
  credentials: 'include',
});

describe('encodeShareRequest / decodeShareRequest — round trip', () => {
  it('reconstructs method, url, headers, body, timeout, and credentials', () => {
    const original = requestWithSecrets();
    const encoded = encodeShareRequest(original);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;

    const decoded = decodeShareRequest(encoded.encoded);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;

    expect(decoded.request.method).toBe('POST');
    expect(decoded.request.url).toBe('{{baseUrl}}/anything');
    expect(decoded.request.body.raw).toBe('{"name":"Arpit"}');
    expect(decoded.request.timeoutMs).toBe(60_000);
    expect(decoded.request.credentials).toBe('include');
  });

  it('keeps {{variable}} templates unresolved rather than baking in real values', () => {
    const encoded = encodeShareRequest(requestWithSecrets());
    if (!encoded.ok) throw new Error('expected ok');
    const decoded = decodeShareRequest(encoded.encoded);
    if (!decoded.ok) throw new Error('expected ok');
    expect(decoded.request.url).toContain('{{baseUrl}}');
    const apiKeyHeader = decoded.request.headers.find((h) => h.key === 'X-Api-Key');
    expect(apiKeyHeader?.value).toBe('{{apiKey}}');
  });
});

describe('secret redaction before share', () => {
  it('sanitizeForShare clears the bearer token and sensitive headers', () => {
    const sanitized = sanitizeForShare(requestWithSecrets());
    expect(sanitized.auth.bearerToken).toBe('');
    expect(sanitized.headers.find((h) => h.key === 'Cookie')?.value).toBe('');
  });

  it('no plaintext secret survives into the encoded URL string', () => {
    const encoded = encodeShareRequest(requestWithSecrets());
    if (!encoded.ok) throw new Error('expected ok');
    expect(encoded.encoded).not.toContain('secret-token');
    expect(encoded.encoded).not.toContain('secret');
  });

  it('no plaintext secret survives into the decoded payload', () => {
    const encoded = encodeShareRequest(requestWithSecrets());
    if (!encoded.ok) throw new Error('expected ok');
    const decoded = decodeShareRequest(encoded.encoded);
    if (!decoded.ok) throw new Error('expected ok');
    expect(decoded.request.auth.bearerToken).toBe('');
    expect(decoded.request.headers.find((h) => h.key === 'Cookie')?.value).toBe('');
    expect(JSON.stringify(decoded.request)).not.toContain('secret-token');
  });

  it('redacts a basic auth password and an api-key value the same way', () => {
    const basic: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'basic', bearerToken: '', basicUsername: 'alice', basicPassword: 'hunter2', apiKeyName: '', apiKeyValue: '', apiKeyLocation: 'header' },
    };
    const apiKey: ApiRequest = {
      ...createBlankRequest(),
      auth: { type: 'api-key', bearerToken: '', basicUsername: '', basicPassword: '', apiKeyName: 'X-Api-Key', apiKeyValue: 'secret-456', apiKeyLocation: 'header' },
    };
    expect(sanitizeForShare(basic).auth.basicPassword).toBe('');
    expect(sanitizeForShare(apiKey).auth.apiKeyValue).toBe('');
  });
});

describe('timeout and credentials preservation', () => {
  it('round-trips a non-default timeout and credentials mode', () => {
    const request: ApiRequest = { ...createBlankRequest(), timeoutMs: 5_000, credentials: 'omit' };
    const encoded = encodeShareRequest(request);
    if (!encoded.ok) throw new Error('expected ok');
    const decoded = decodeShareRequest(encoded.encoded);
    if (!decoded.ok) throw new Error('expected ok');
    expect(decoded.request.timeoutMs).toBe(5_000);
    expect(decoded.request.credentials).toBe('omit');
  });
});

describe('invalid share payloads', () => {
  it('rejects an empty string', () => {
    expect(decodeShareRequest('').ok).toBe(false);
  });

  it('rejects garbage that fails lz-string decompression', () => {
    expect(decodeShareRequest('not-a-valid-compressed-payload!!!').ok).toBe(false);
  });

  it('rejects a compressed payload whose JSON is malformed', () => {
    const encoded = compressToEncodedURIComponent('{not valid json');
    expect(decodeShareRequest(encoded).ok).toBe(false);
  });

  it('rejects a payload missing the request field entirely', () => {
    const encoded = compressToEncodedURIComponent(JSON.stringify({ v: 1 }));
    expect(decodeShareRequest(encoded).ok).toBe(false);
  });

  it('rejects a request payload with no url', () => {
    const encoded = compressToEncodedURIComponent(JSON.stringify({ v: 1, request: { method: 'GET' } }));
    expect(decodeShareRequest(encoded).ok).toBe(false);
  });

  it('falls back to GET for an unsupported method rather than rejecting the whole link', () => {
    const encoded = compressToEncodedURIComponent(JSON.stringify({ v: 1, request: { method: 'TRACE', url: 'https://example.com' } }));
    const decoded = decodeShareRequest(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.request.method).toBe('GET');
  });

  it('ignores unknown top-level and nested fields instead of failing', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({ v: 1, futureTopLevelField: 'x', request: { method: 'GET', url: 'https://example.com', fromTheFuture: true } }),
    );
    const decoded = decodeShareRequest(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.request.url).toBe('https://example.com');
  });
});

// lz-string compresses highly repetitive text (e.g. 'x'.repeat(n)) down to almost nothing,
// so a large-payload test needs low-entropy-resistant content — a pseudo-random printable
// string that compression can't meaningfully shrink.
const lowCompressibilityString = (length: number): string => {
  let seed = 42;
  let out = '';
  for (let i = 0; i < length; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    out += String.fromCharCode(33 + (seed % 94));
  }
  return out;
};

describe('large payload safeguard', () => {
  it('rejects a request whose compressed payload exceeds MAX_SHARE_ENCODED_LENGTH', () => {
    const huge: ApiRequest = { ...createBlankRequest(), body: { mode: 'text', raw: lowCompressibilityString(50_000), formFields: [] } };
    const encoded = encodeShareRequest(huge);
    expect(encoded.ok).toBe(false);
    if (!encoded.ok) expect(encoded.error).toMatch(/too large/i);
  });

  it('MAX_SHARE_ENCODED_LENGTH matches the documented 6,000-character ceiling', () => {
    expect(MAX_SHARE_ENCODED_LENGTH).toBe(6_000);
  });
});

describe('URL helpers', () => {
  it('buildShareUrl appends the encoded payload as a query param and drops existing query/hash', () => {
    const url = buildShareUrl('https://101techlabs.com/tools/developer/api-request-builder?old=1#frag', 'ABC123');
    expect(url).toBe(`https://101techlabs.com/tools/developer/api-request-builder?${SHARE_QUERY_PARAM}=ABC123`);
  });

  it('readShareParam reads the param back out of a location.search string', () => {
    expect(readShareParam(`?${SHARE_QUERY_PARAM}=ABC123&other=1`)).toBe('ABC123');
  });

  it('readShareParam returns null when absent', () => {
    expect(readShareParam('?other=1')).toBeNull();
  });
});
