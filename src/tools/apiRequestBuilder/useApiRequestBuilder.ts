import { useCallback, useRef, useState } from 'react';
import {
  createBlankRequest,
  createRow,
  nextId,
  type ApiRequest,
  type ApiResponse,
  type Authentication,
  type BodyMode,
  type FormField,
  type HttpMethod,
  type RequestFailure,
  type RequestHeader,
  type RequestParameter,
} from './types';
import { executeRequest, RequestExecutionError } from './requestExecutor';
import { addHistoryEntry } from './storage';
import { buildProxiedUrl, eligiblePoolCandidates, proxyOrigin, resolveCustomProxy, type CorsProxySettings } from './corsProxy';

export type RequestTab = 'params' | 'headers' | 'body' | 'auth';

const toFailure = (err: unknown): RequestFailure =>
  err instanceof RequestExecutionError
    ? { kind: err.kind, message: err.message }
    : { kind: 'unknown', message: err instanceof Error ? err.message : 'Something went wrong.' };

export const useApiRequestBuilder = (initial?: ApiRequest) => {
  const [request, setRequest] = useState<ApiRequest>(initial ?? createBlankRequest());
  const [activeTab, setActiveTab] = useState<RequestTab>('params');
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  /** Origin of the proxy actually used for the last successful send, if any — surfaced in the UI so a
   *  fallback through a third party is never invisible, even though it happens automatically in 'auto' mode. */
  const [viaProxy, setViaProxy] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadRequest = useCallback((next: ApiRequest) => {
    setRequest(next);
    setResponse(null);
    setError(null);
    setElapsedMs(null);
    setViaProxy(null);
  }, []);

  const resetRequest = useCallback(() => {
    loadRequest(createBlankRequest());
  }, [loadRequest]);

  const setMethod = useCallback((method: HttpMethod) => setRequest((r) => ({ ...r, method })), []);
  const setUrl = useCallback((url: string) => setRequest((r) => ({ ...r, url })), []);

  const setParams = useCallback((params: RequestParameter[]) => setRequest((r) => ({ ...r, params })), []);
  const addParam = useCallback(() => setRequest((r) => ({ ...r, params: [...r.params, createRow()] })), []);
  const updateParam = useCallback(
    (id: string, patch: Partial<RequestParameter>) =>
      setRequest((r) => ({ ...r, params: r.params.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    [],
  );
  const removeParam = useCallback(
    (id: string) => setRequest((r) => ({ ...r, params: r.params.filter((p) => p.id !== id) })),
    [],
  );

  const setHeaders = useCallback((headers: RequestHeader[]) => setRequest((r) => ({ ...r, headers })), []);
  const addHeader = useCallback(() => setRequest((r) => ({ ...r, headers: [...r.headers, createRow()] })), []);
  const updateHeader = useCallback(
    (id: string, patch: Partial<RequestHeader>) =>
      setRequest((r) => ({ ...r, headers: r.headers.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
    [],
  );
  const removeHeader = useCallback(
    (id: string) => setRequest((r) => ({ ...r, headers: r.headers.filter((h) => h.id !== id) })),
    [],
  );

  const setBodyMode = useCallback(
    (mode: BodyMode) => setRequest((r) => ({ ...r, body: { ...r.body, mode } })),
    [],
  );
  const setBodyRaw = useCallback((raw: string) => setRequest((r) => ({ ...r, body: { ...r.body, raw } })), []);
  const setFormFields = useCallback(
    (formFields: FormField[]) => setRequest((r) => ({ ...r, body: { ...r.body, formFields } })),
    [],
  );
  const addFormField = useCallback(
    () => setRequest((r) => ({ ...r, body: { ...r.body, formFields: [...r.body.formFields, { ...createRow() }] } })),
    [],
  );
  const updateFormField = useCallback(
    (id: string, patch: Partial<FormField>) =>
      setRequest((r) => ({
        ...r,
        body: { ...r.body, formFields: r.body.formFields.map((f) => (f.id === id ? { ...f, ...patch } : f)) },
      })),
    [],
  );
  const removeFormField = useCallback(
    (id: string) =>
      setRequest((r) => ({ ...r, body: { ...r.body, formFields: r.body.formFields.filter((f) => f.id !== id) } })),
    [],
  );

  const setAuth = useCallback((auth: Authentication) => setRequest((r) => ({ ...r, auth })), []);

  const send = useCallback(async (proxySettings: CorsProxySettings) => {
    if (sending) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setSending(true);
    setError(null);
    setResponse(null);
    setViaProxy(null);
    const startedAt = Date.now();

    const recordSuccess = (result: ApiResponse, proxyOriginUsed: string | null) => {
      setResponse(result);
      setViaProxy(proxyOriginUsed);
      addHistoryEntry({
        id: nextId(),
        timestamp: startedAt,
        request,
        status: result.status,
        statusText: result.statusText,
        timeMs: result.timeMs,
      });
    };

    const recordFailure = (failure: RequestFailure) => {
      setError(failure);
      setElapsedMs(Date.now() - startedAt);
      if (failure.kind !== 'aborted') {
        addHistoryEntry({ id: nextId(), timestamp: startedAt, request, error: failure.message });
      }
    };

    try {
      const customProxy = resolveCustomProxy(proxySettings);
      if (customProxy) {
        // The user's own infrastructure — used up front for every request while
        // configured, unlike the pool fallback below which only kicks in on failure.
        const result = await executeRequest(request, {
          signal: controller.signal,
          rewriteUrl: (url) => buildProxiedUrl(customProxy.template, url),
        });
        recordSuccess(result, customProxy.origin);
        return;
      }

      if (proxySettings.mode !== 'auto') {
        // 'off', or 'custom' selected with no URL filled in yet — direct only, no fallback.
        const result = await executeRequest(request, { signal: controller.signal });
        recordSuccess(result, null);
        return;
      }

      // 'auto' — try direct first so a working API never gets routed through a third party.
      try {
        const result = await executeRequest(request, { signal: controller.signal });
        recordSuccess(result, null);
        return;
      } catch (directErr) {
        const directFailure = toFailure(directErr);
        if (directFailure.kind !== 'network-or-cors' || controller.signal.aborted) {
          recordFailure(directFailure);
          return;
        }

        const hasHeaders = request.headers.some((h) => h.enabled && h.key.trim() !== '');
        const hasAuth = request.auth.type !== 'none';
        const candidates = eligiblePoolCandidates(request.method, hasHeaders || hasAuth);

        if (candidates.length === 0) {
          recordFailure({
            kind: 'network-or-cors',
            message: `${directFailure.message} No available public proxy can safely forward this request (custom headers, auth, or a non-GET method) — configure your own private proxy in CORS Proxy settings for full control.`,
          });
          return;
        }

        for (const candidate of candidates) {
          try {
            const result = await executeRequest(request, {
              signal: controller.signal,
              timeoutMs: 12_000,
              rewriteUrl: (url) => buildProxiedUrl(candidate.template, url),
            });
            recordSuccess(result, proxyOrigin(candidate.template));
            return;
          } catch (proxyErr) {
            if (controller.signal.aborted) {
              recordFailure({ kind: 'aborted', message: 'Request cancelled.' });
              return;
            }
            void proxyErr; // try the next candidate
          }
        }

        recordFailure({
          kind: 'network-or-cors',
          message: `Direct request was blocked, and the public CORS proxy fallback (${candidates
            .map((c) => c.label)
            .join(', ')}) also failed or was unreachable. Try again in a moment, or configure your own private proxy in CORS Proxy settings.`,
        });
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [request, sending]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    request,
    activeTab,
    setActiveTab,
    sending,
    response,
    error,
    elapsedMs,
    viaProxy,
    loadRequest,
    resetRequest,
    setMethod,
    setUrl,
    setParams,
    addParam,
    updateParam,
    removeParam,
    setHeaders,
    addHeader,
    updateHeader,
    removeHeader,
    setBodyMode,
    setBodyRaw,
    setFormFields,
    addFormField,
    updateFormField,
    removeFormField,
    setAuth,
    send,
    cancel,
  };
};

export type ApiRequestBuilderState = ReturnType<typeof useApiRequestBuilder>;
