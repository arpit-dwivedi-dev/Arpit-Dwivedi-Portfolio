import { createBlankRequest, normalizeRequest, DEFAULT_TIMEOUT_MS, DEFAULT_CREDENTIALS, type ApiRequest } from './types';

describe('createBlankRequest defaults', () => {
  it('defaults timeoutMs to 30000ms', () => {
    expect(createBlankRequest().timeoutMs).toBe(30_000);
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it('defaults credentials to same-origin', () => {
    expect(createBlankRequest().credentials).toBe('same-origin');
    expect(DEFAULT_CREDENTIALS).toBe('same-origin');
  });
});

describe('normalizeRequest — backwards compatibility with pre-existing saved/history records', () => {
  it('fills in the default timeout for a request saved before timeoutMs existed', () => {
    const legacy = { ...createBlankRequest() } as Partial<ApiRequest>;
    delete legacy.timeoutMs;
    expect(normalizeRequest(legacy as ApiRequest).timeoutMs).toBe(30_000);
  });

  it('fills in same-origin credentials for a request saved before credentials existed', () => {
    const legacy = { ...createBlankRequest() } as Partial<ApiRequest>;
    delete legacy.credentials;
    expect(normalizeRequest(legacy as ApiRequest).credentials).toBe('same-origin');
  });

  it('leaves a valid custom timeout and credentials value untouched', () => {
    const request: ApiRequest = { ...createBlankRequest(), timeoutMs: 5_000, credentials: 'include' };
    const result = normalizeRequest(request);
    expect(result.timeoutMs).toBe(5_000);
    expect(result.credentials).toBe('include');
  });

  it('falls back to the default when timeoutMs is invalid (zero, negative, or non-numeric)', () => {
    expect(normalizeRequest({ ...createBlankRequest(), timeoutMs: 0 }).timeoutMs).toBe(30_000);
    expect(normalizeRequest({ ...createBlankRequest(), timeoutMs: -5 }).timeoutMs).toBe(30_000);
    expect(normalizeRequest({ ...createBlankRequest(), timeoutMs: NaN }).timeoutMs).toBe(30_000);
  });

  it('falls back to the default when credentials is an unrecognized value', () => {
    const request = { ...createBlankRequest(), credentials: 'bogus' } as unknown as ApiRequest;
    expect(normalizeRequest(request).credentials).toBe('same-origin');
  });

  it('does not touch other fields', () => {
    const request: ApiRequest = { ...createBlankRequest(), url: 'https://example.com', method: 'POST' };
    const result = normalizeRequest(request);
    expect(result.url).toBe('https://example.com');
    expect(result.method).toBe('POST');
  });
});
