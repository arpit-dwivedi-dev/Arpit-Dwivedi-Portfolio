// requestExecutor.ts calls `window.setTimeout`/`window.clearTimeout`; under Jest's `node`
// testEnvironment (see jest.config.cjs) there is no `window`, so alias it to globalThis —
// mutating global.setTimeout below then transparently shows up through window.setTimeout too,
// since both names point at the same object.
(globalThis as { window?: unknown }).window = globalThis;

import { executeRequest, RequestExecutionError } from './requestExecutor';
import { createBlankRequest, type ApiRequest } from './types';

const baseRequest = (): ApiRequest => ({ ...createBlankRequest(), url: 'https://example.com/data' });

/** A fetch mock that never resolves on its own — only rejects if/when its AbortSignal fires,
 *  mirroring how a real hung connection behaves once cancelled or timed out. */
const hangingFetch = () =>
  jest.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
  );

const okResponse = (): Response =>
  ({
    status: 200,
    statusText: 'OK',
    headers: { forEach: () => {} },
    arrayBuffer: async () => new TextEncoder().encode('{}').buffer,
  }) as unknown as Response;

describe('executeRequest — configurable timeout', () => {
  const originalFetch = global.fetch;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;

  afterEach(() => {
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  it('schedules the default 30000ms timeout for a legacy request with no timeoutMs field', () => {
    const request = { ...baseRequest() } as Partial<ApiRequest>;
    delete request.timeoutMs;

    let scheduledMs: number | undefined;
    global.setTimeout = ((cb: (...args: unknown[]) => void, ms?: number) => {
      scheduledMs = ms;
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    global.clearTimeout = (() => {}) as typeof clearTimeout;
    global.fetch = hangingFetch() as unknown as typeof fetch;

    void executeRequest(request as ApiRequest).catch(() => {});
    expect(scheduledMs).toBe(30_000);
  });

  it('schedules the configured custom timeout instead of the default', () => {
    const request: ApiRequest = { ...baseRequest(), timeoutMs: 5_000 };

    let scheduledMs: number | undefined;
    global.setTimeout = ((cb: (...args: unknown[]) => void, ms?: number) => {
      scheduledMs = ms;
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    global.clearTimeout = (() => {}) as typeof clearTimeout;
    global.fetch = hangingFetch() as unknown as typeof fetch;

    void executeRequest(request).catch(() => {});
    expect(scheduledMs).toBe(5_000);
  });

  it('aborts the in-flight fetch and reports a timeout failure once the configured duration elapses', async () => {
    const request: ApiRequest = { ...baseRequest(), timeoutMs: 1_000 };

    let fireTimeout: (() => void) | undefined;
    global.setTimeout = ((cb: () => void) => {
      fireTimeout = cb;
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    global.clearTimeout = (() => {}) as typeof clearTimeout;

    let sawAbort = false;
    global.fetch = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            sawAbort = true;
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    ) as unknown as typeof fetch;

    const promise = executeRequest(request);
    fireTimeout?.();

    await expect(promise).rejects.toBeInstanceOf(RequestExecutionError);
    await expect(promise).rejects.toMatchObject({ kind: 'timeout' });
    expect(sawAbort).toBe(true);
  });

  it('distinguishes a user-initiated cancellation from a timeout', async () => {
    const request: ApiRequest = { ...baseRequest(), timeoutMs: 30_000 };

    // The timeout timer is armed but deliberately never fired in this test — cancellation
    // must win on its own, not because the timeout also happened to be reached.
    global.setTimeout = ((_cb: (...args: unknown[]) => void, _ms?: number) =>
      0 as unknown as ReturnType<typeof setTimeout>) as typeof setTimeout;
    global.clearTimeout = (() => {}) as typeof clearTimeout;
    global.fetch = hangingFetch() as unknown as typeof fetch;

    const controller = new AbortController();
    const promise = executeRequest(request, { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toMatchObject({ kind: 'aborted' });
  });
});

describe('executeRequest — credentials', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.each(['same-origin', 'include', 'omit'] as const)('passes credentials=%s through to fetch', async (mode) => {
    let capturedInit: RequestInit | undefined;
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(okResponse());
    }) as unknown as typeof fetch;

    const request: ApiRequest = { ...baseRequest(), credentials: mode };
    await executeRequest(request);
    expect(capturedInit?.credentials).toBe(mode);
  });

  it('defaults to same-origin for a legacy request with no credentials field', async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(okResponse());
    }) as unknown as typeof fetch;

    const request = { ...baseRequest() } as Partial<ApiRequest>;
    delete request.credentials;
    await executeRequest(request as ApiRequest);
    expect(capturedInit?.credentials).toBe('same-origin');
  });
});

/** A fetch mock returning a response with the given headers and raw bytes — `arrayBuffer()` is
 *  the only body-reading method a well-behaved response mock needs now that requestExecutor never
 *  calls `.text()`; a mock without `.text()` at all doubles as a check that the code path is unused. */
const responseWith = (headers: Record<string, string>, bytes: Uint8Array, init: { status?: number; statusText?: string } = {}): Response =>
  ({
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    headers: {
      forEach: (cb: (value: string, key: string) => void) => {
        for (const [key, value] of Object.entries(headers)) cb(value, key);
      },
    },
    arrayBuffer: async () => bytes.buffer,
  }) as unknown as Response;

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('executeRequest — response body classification', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('still parses a valid JSON body into the JSON tree path', async () => {
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'application/json' }, encode('{"a":1}'))) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('json');
    expect(result.isJson).toBe(true);
    expect(result.bodyText).toBe('{"a":1}');
    expect(result.bodyBytes).toBeUndefined();
  });

  it('falls back to text when Content-Type claims JSON but the body is not valid JSON', async () => {
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'application/json' }, encode('not json'))) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('text');
    expect(result.isJson).toBe(false);
    expect(result.bodyText).toBe('not json');
  });

  it('auto-detects JSON when Content-Type is absent, matching the pre-existing fallback', async () => {
    global.fetch = jest.fn(async () => responseWith({}, encode('[1,2,3]'))) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('json');
    expect(result.isJson).toBe(true);
  });

  it('keeps a plain text body as text, still decoded via bodyText', async () => {
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'text/plain' }, encode('hello world'))) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('text');
    expect(result.bodyText).toBe('hello world');
  });

  it('classifies XML content and preserves it as text for the formatter to parse', async () => {
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'application/xml' }, encode('<a><b/></a>'))) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('xml');
    expect(result.bodyText).toBe('<a><b/></a>');
  });

  it('never decodes an image body through text — bytes stay in bodyBytes, bodyText is empty', async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0x00, 0x80]);
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'image/png' }, pngBytes)) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('image');
    expect(result.bodyText).toBe('');
    expect(result.bodyBytes).toBeDefined();
    expect(new Uint8Array(result.bodyBytes as ArrayBuffer)).toEqual(pngBytes);
  });

  it('never decodes a generic binary body through text and preserves exact byte values', async () => {
    // Bytes deliberately include values that are invalid/lossy as UTF-8 (0xff, 0x00) — a
    // text round-trip would have corrupted these.
    const binaryBytes = new Uint8Array([0x00, 0xff, 0x10, 0x20, 0xfe, 0x7f]);
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'application/octet-stream' }, binaryBytes)) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.bodyKind).toBe('binary');
    expect(result.bodyText).toBe('');
    expect(new Uint8Array(result.bodyBytes as ArrayBuffer)).toEqual(binaryBytes);
  });

  it('reports the correct response size for a binary body', async () => {
    const binaryBytes = new Uint8Array(37).fill(0xaa);
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'application/pdf' }, binaryBytes)) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.sizeBytes).toBe(37);
  });

  it('uses a sanitized Content-Disposition filename when present', async () => {
    global.fetch = jest.fn(async () =>
      responseWith({ 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="report.pdf"' }, new Uint8Array([1, 2, 3])),
    ) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.filename).toBe('report.pdf');
  });

  it('falls back to a content-kind default filename with no Content-Disposition', async () => {
    global.fetch = jest.fn(async () => responseWith({ 'content-type': 'application/json' }, encode('{}'))) as unknown as typeof fetch;
    const result = await executeRequest(baseRequest());
    expect(result.filename).toBe('response.json');
  });
});
