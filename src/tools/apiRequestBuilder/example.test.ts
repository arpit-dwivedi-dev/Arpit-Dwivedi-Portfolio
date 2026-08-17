import { TOOLS } from '../registry';
import { API_REQUEST_BUILDER_PATH, buildApiExampleUrl, createApiExample, summarizeApiExampleRequest } from './example';
import { MAX_SHARE_ENCODED_LENGTH, SHARE_QUERY_PARAM, decodeShareRequest, readShareParam } from './shareRequest';

describe('API_REQUEST_BUILDER_PATH', () => {
  it('matches the canonical tool route and carries no origin/host', () => {
    const tool = TOOLS.find((t) => t.id === 'api-request-builder')!;
    expect(API_REQUEST_BUILDER_PATH).toBe(`/tools/${tool.category}/${tool.path}`);
    expect(API_REQUEST_BUILDER_PATH).toBe('/tools/developer/api-request-builder');
    expect(API_REQUEST_BUILDER_PATH).not.toMatch(/^https?:\/\//);
    expect(API_REQUEST_BUILDER_PATH).not.toContain('localhost');
  });
});

describe('createApiExample', () => {
  it('defaults to a GET request with no body/auth/params/headers', () => {
    const example = createApiExample({ title: 'Get a post', url: 'https://httpbin.org/get' });
    expect(example.request.method).toBe('GET');
    expect(example.request.url).toBe('https://httpbin.org/get');
    expect(example.request.body.mode).toBe('none');
    expect(example.request.auth.type).toBe('none');
    expect(example.request.headers).toEqual([]);
    expect(example.request.params).toEqual([]);
  });

  it('builds headers/params with enabled defaulting to true', () => {
    const example = createApiExample({
      title: 'Headers',
      url: 'https://httpbin.org/get',
      headers: [{ key: 'X-Demo', value: 'yes' }],
      params: [{ key: 'source', value: 'guide', enabled: false }],
    });
    expect(example.request.headers[0]).toMatchObject({ key: 'X-Demo', value: 'yes', enabled: true });
    expect(example.request.params[0]).toMatchObject({ key: 'source', value: 'guide', enabled: false });
  });

  it('the `json` convenience stringifies the value into a JSON body', () => {
    const example = createApiExample({
      title: 'Create a post',
      method: 'POST',
      url: 'https://httpbin.org/anything',
      json: { title: 'Hello', userId: 1 },
    });
    expect(example.request.body.mode).toBe('json');
    expect(JSON.parse(example.request.body.raw)).toEqual({ title: 'Hello', userId: 1 });
  });

  it('an explicit `body` takes precedence over `json`', () => {
    const example = createApiExample({
      title: 'Form post',
      method: 'POST',
      url: 'https://httpbin.org/anything',
      json: { ignored: true },
      body: { mode: 'form-urlencoded', formFields: [{ key: 'a', value: '1' }] },
    });
    expect(example.request.body.mode).toBe('form-urlencoded');
    expect(example.request.body.formFields).toEqual([expect.objectContaining({ key: 'a', value: '1', enabled: true })]);
  });

  it('marks a multipart row as a file field without inventing a file or filename', () => {
    const example = createApiExample({
      title: 'Upload',
      method: 'POST',
      url: 'https://httpbin.org/anything',
      body: { mode: 'multipart', formFields: [{ key: 'name', value: 'profile' }, { key: 'file', value: '', isFile: true }] },
    });
    const [text, file] = example.request.body.formFields;
    // A text row stays byte-identical to what it was before file fields were expressible.
    expect(text.isFile).toBeUndefined();
    expect(file.isFile).toBe(true);
    expect(file.value).toBe('');
    expect(file.file).toBeUndefined();
    expect(file.fileName).toBeUndefined();
  });

  it('builds auth from a partial input', () => {
    const example = createApiExample({
      title: 'Bearer example',
      url: 'https://httpbin.org/anything',
      auth: { type: 'bearer', bearerToken: '{{token}}' },
    });
    expect(example.request.auth.type).toBe('bearer');
    expect(example.request.auth.bearerToken).toBe('{{token}}');
  });

  it('respects a custom timeout and credentials mode, defaulting otherwise', () => {
    const withOverrides = createApiExample({ title: 'x', url: 'https://httpbin.org/get', timeoutMs: 5_000, credentials: 'omit' });
    expect(withOverrides.request.timeoutMs).toBe(5_000);
    expect(withOverrides.request.credentials).toBe('omit');

    const defaults = createApiExample({ title: 'y', url: 'https://httpbin.org/get' });
    expect(defaults.request.timeoutMs).toBe(30_000);
    expect(defaults.request.credentials).toBe('same-origin');
  });
});

// Pulls the request back out of a generated CTA URL exactly the way the API Request
// Builder page itself does (readShareParam + decodeShareRequest) — the point of reusing
// shareRequest.ts is that this round trip is identical to the tool's own Share button.
const decodeGeneratedUrl = (url: string) => {
  const [path, query] = url.split('?');
  const param = readShareParam(`?${query}`);
  const decoded = decodeShareRequest(param!);
  if (!decoded.ok) throw new Error('expected ok');
  return { path, request: decoded.request };
};

describe('buildApiExampleUrl', () => {
  it('generates a valid URL for a GET example, pointing at the canonical tool route', () => {
    const example = createApiExample({ title: 'Get a post', url: 'https://httpbin.org/get' });
    const url = buildApiExampleUrl(example.request);
    expect(url.startsWith(`${API_REQUEST_BUILDER_PATH}?${SHARE_QUERY_PARAM}=`)).toBe(true);

    const { path, request } = decodeGeneratedUrl(url);
    expect(path).toBe(API_REQUEST_BUILDER_PATH);
    expect(request.method).toBe('GET');
    expect(request.url).toBe('https://httpbin.org/get');
  });

  it('generates a valid URL for a POST JSON example, preserving headers/body/timeout/credentials', () => {
    const example = createApiExample({
      title: 'Create a post',
      method: 'POST',
      url: 'https://httpbin.org/anything',
      headers: [{ key: 'X-Demo-Header', value: 'guide-example' }],
      json: { title: 'Hello world' },
      timeoutMs: 10_000,
      credentials: 'include',
    });
    const { request } = decodeGeneratedUrl(buildApiExampleUrl(example.request));
    expect(request.method).toBe('POST');
    expect(request.headers.find((h) => h.key === 'X-Demo-Header')?.value).toBe('guide-example');
    expect(JSON.parse(request.body.raw)).toEqual({ title: 'Hello world' });
    expect(request.timeoutMs).toBe(10_000);
    expect(request.credentials).toBe('include');
  });

  it('preserves {{variable}} templates in the URL and headers untouched', () => {
    const example = createApiExample({
      title: 'Templated request',
      url: '{{baseUrl}}/users/{{userId}}',
      headers: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
      auth: { type: 'bearer', bearerToken: '{{token}}' },
    });
    const { request } = decodeGeneratedUrl(buildApiExampleUrl(example.request));
    expect(request.url).toBe('{{baseUrl}}/users/{{userId}}');
    expect(request.headers.find((h) => h.key === 'Authorization')?.value).toBe('Bearer {{token}}');
    expect(request.auth.bearerToken).toBe('{{token}}');
  });

  it('strips a literal (non-templated) secret from the generated URL entirely', () => {
    const example = createApiExample({
      title: 'Accidentally real secret',
      url: 'https://httpbin.org/anything',
      auth: { type: 'bearer', bearerToken: 'sk_live_should_never_ship' },
      headers: [{ key: 'Cookie', value: 'session=super-secret' }],
    });
    const url = buildApiExampleUrl(example.request);
    expect(url).not.toContain('sk_live_should_never_ship');
    expect(url).not.toContain('super-secret');

    const { request } = decodeGeneratedUrl(url);
    expect(request.auth.bearerToken).toBe('');
    expect(request.headers.find((h) => h.key === 'Cookie')?.value).toBe('');
  });

  it('leaves a demo/fake credential value alone — it is a literal, but not a real secret concern for the reader', () => {
    // sanitizeForShare treats every non-templated credential-shaped value the same way
    // (redacted) regardless of whether it "looks fake" — PART 4 asks content authors to
    // prefer {{token}} templates precisely so a demo value doesn't get silently redacted
    // into an empty string.
    const example = createApiExample({
      title: 'Demo token',
      url: 'https://httpbin.org/anything',
      auth: { type: 'bearer', bearerToken: 'demo-token' },
    });
    const { request } = decodeGeneratedUrl(buildApiExampleUrl(example.request));
    expect(request.auth.bearerToken).toBe('');
  });

  it('stays within the 6,000-character MAX_SHARE_ENCODED_LENGTH for a normal example', () => {
    const example = createApiExample({ title: 'Get a post', url: 'https://httpbin.org/get' });
    const url = buildApiExampleUrl(example.request);
    const encoded = url.split(`${SHARE_QUERY_PARAM}=`)[1];
    expect(encoded.length).toBeLessThanOrEqual(MAX_SHARE_ENCODED_LENGTH);
  });

  // Same low-compressibility-string technique used in shareRequest.test.ts's large-payload
  // test — lz-string compresses repetitive text almost to nothing, so a realistic
  // over-the-limit payload needs pseudo-random content instead.
  const lowCompressibilityString = (length: number): string => {
    let seed = 7;
    let out = '';
    for (let i = 0; i < length; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      out += String.fromCharCode(33 + (seed % 94));
    }
    return out;
  };

  it('throws a clear, developer-facing error for an oversized example instead of returning a broken link', () => {
    const example = createApiExample({
      title: 'Way too big',
      method: 'POST',
      url: 'https://httpbin.org/anything',
      body: { mode: 'text', raw: lowCompressibilityString(50_000) },
    });
    expect(() => buildApiExampleUrl(example.request)).toThrow(/too large|Could not build/i);
  });
});

describe('summarizeApiExampleRequest', () => {
  it('renders a single method+URL line for a GET request with no body', () => {
    const example = createApiExample({ title: 'x', url: 'https://httpbin.org/get' });
    expect(summarizeApiExampleRequest(example.request)).toEqual(['GET https://httpbin.org/get']);
  });

  it('adds a Content-Type line for a JSON POST body', () => {
    const example = createApiExample({ title: 'x', method: 'POST', url: 'https://httpbin.org/anything', json: { a: 1 } });
    expect(summarizeApiExampleRequest(example.request)).toEqual([
      'POST https://httpbin.org/anything',
      'Content-Type: application/json',
    ]);
  });

  it('never dumps individual headers or body fields into the summary', () => {
    const example = createApiExample({
      title: 'x',
      method: 'POST',
      url: 'https://httpbin.org/anything',
      headers: [{ key: 'X-One', value: '1' }, { key: 'X-Two', value: '2' }],
      json: { a: 1, b: 2, c: 3 },
    });
    const lines = summarizeApiExampleRequest(example.request);
    expect(lines.length).toBe(2);
    expect(lines.join('\n')).not.toContain('X-One');
    expect(lines.join('\n')).not.toContain('"a"');
  });
});
