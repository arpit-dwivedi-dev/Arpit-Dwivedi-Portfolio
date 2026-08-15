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

export type RequestTab = 'params' | 'headers' | 'body' | 'auth';

export const useApiRequestBuilder = (initial?: ApiRequest) => {
  const [request, setRequest] = useState<ApiRequest>(initial ?? createBlankRequest());
  const [activeTab, setActiveTab] = useState<RequestTab>('params');
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadRequest = useCallback((next: ApiRequest) => {
    setRequest(next);
    setResponse(null);
    setError(null);
    setElapsedMs(null);
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

  const send = useCallback(async () => {
    if (sending) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setSending(true);
    setError(null);
    setResponse(null);
    const startedAt = Date.now();

    try {
      const result = await executeRequest(request, { signal: controller.signal });
      setResponse(result);
      addHistoryEntry({
        id: nextId(),
        timestamp: startedAt,
        request,
        status: result.status,
        statusText: result.statusText,
        timeMs: result.timeMs,
      });
    } catch (err) {
      const failure: RequestFailure =
        err instanceof RequestExecutionError
          ? { kind: err.kind, message: err.message }
          : { kind: 'unknown', message: err instanceof Error ? err.message : 'Something went wrong.' };
      setError(failure);
      setElapsedMs(Date.now() - startedAt);
      if (failure.kind !== 'aborted') {
        addHistoryEntry({ id: nextId(), timestamp: startedAt, request, error: failure.message });
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
