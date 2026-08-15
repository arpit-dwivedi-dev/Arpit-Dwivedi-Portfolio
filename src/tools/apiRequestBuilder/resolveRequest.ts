import type { ApiRequest, FormField } from './types';
import { buildUrlWithParams } from './urlUtils';

export interface ResolvedRequest {
  url: string;
  /** Ordered so later duplicates (e.g. an explicit user header) can be told apart from auto-added ones. */
  headers: Array<[string, string]>;
  bodyInit?: BodyInit;
  /** Human-readable body text, for cURL generation / previews — undefined for multipart (binary/opaque). */
  bodyText?: string;
  contentTypeAutoApplied?: string;
}

const hasHeaderNamed = (headers: Array<[string, string]>, name: string): boolean =>
  headers.some(([key]) => key.toLowerCase() === name.toLowerCase());

const enabledFormFields = (fields: FormField[]): FormField[] => fields.filter((f) => f.enabled && f.key.trim() !== '');

/** Applies enabled params + auth + body to a request draft, producing what would actually be sent.
 *  Used by both the fetch executor and the cURL generator so they can never drift apart. */
export const resolveRequest = (request: ApiRequest): ResolvedRequest => {
  const enabledHeaders: Array<[string, string]> = request.headers
    .filter((h) => h.enabled && h.key.trim() !== '')
    .map((h) => [h.key, h.value]);

  const enabledParams = request.params.filter((p) => p.enabled && p.key.trim() !== '');
  let url = buildUrlWithParams(request.url, enabledParams);

  const auth = request.auth;
  if (auth.type === 'bearer' && auth.bearerToken.trim()) {
    enabledHeaders.push(['Authorization', `Bearer ${auth.bearerToken.trim()}`]);
  } else if (auth.type === 'basic' && (auth.basicUsername || auth.basicPassword)) {
    const encoded = btoa(`${auth.basicUsername}:${auth.basicPassword}`);
    enabledHeaders.push(['Authorization', `Basic ${encoded}`]);
  } else if (auth.type === 'api-key' && auth.apiKeyName.trim()) {
    if (auth.apiKeyLocation === 'header') {
      enabledHeaders.push([auth.apiKeyName.trim(), auth.apiKeyValue]);
    } else {
      const [base, query = ''] = url.split('?');
      const search = new URLSearchParams(query);
      search.set(auth.apiKeyName.trim(), auth.apiKeyValue);
      url = `${base}?${search.toString()}`;
    }
  }

  const bodyAllowed = request.method !== 'GET' && request.method !== 'HEAD';
  if (!bodyAllowed || request.body.mode === 'none') {
    return { url, headers: enabledHeaders };
  }

  switch (request.body.mode) {
    case 'json': {
      let contentTypeAutoApplied: string | undefined;
      if (!hasHeaderNamed(enabledHeaders, 'Content-Type')) {
        enabledHeaders.push(['Content-Type', 'application/json']);
        contentTypeAutoApplied = 'application/json';
      }
      return { url, headers: enabledHeaders, bodyInit: request.body.raw, bodyText: request.body.raw, contentTypeAutoApplied };
    }
    case 'text': {
      let contentTypeAutoApplied: string | undefined;
      if (!hasHeaderNamed(enabledHeaders, 'Content-Type')) {
        enabledHeaders.push(['Content-Type', 'text/plain']);
        contentTypeAutoApplied = 'text/plain';
      }
      return { url, headers: enabledHeaders, bodyInit: request.body.raw, bodyText: request.body.raw, contentTypeAutoApplied };
    }
    case 'form-urlencoded': {
      const fields = enabledFormFields(request.body.formFields);
      const search = new URLSearchParams();
      for (const field of fields) search.append(field.key, field.value);
      const bodyText = search.toString();
      let contentTypeAutoApplied: string | undefined;
      if (!hasHeaderNamed(enabledHeaders, 'Content-Type')) {
        enabledHeaders.push(['Content-Type', 'application/x-www-form-urlencoded']);
        contentTypeAutoApplied = 'application/x-www-form-urlencoded';
      }
      return { url, headers: enabledHeaders, bodyInit: bodyText, bodyText, contentTypeAutoApplied };
    }
    case 'multipart': {
      const fields = enabledFormFields(request.body.formFields);
      const formData = new FormData();
      for (const field of fields) {
        if (field.isFile && field.file) {
          formData.append(field.key, field.file, field.fileName ?? field.file.name);
        } else {
          formData.append(field.key, field.value);
        }
      }
      // Deliberately no Content-Type here — the browser must set it (with the
      // multipart boundary) itself; a manual header without a boundary breaks the request.
      return { url, headers: enabledHeaders, bodyInit: formData };
    }
    default:
      return { url, headers: enabledHeaders };
  }
};
