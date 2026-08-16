import {
  HTTP_METHODS,
  createBlankRequest,
  createRow,
  nextId,
  type ApiRequest,
  type FormField,
  type HttpMethod,
} from './types';

// A flat shape rather than a discriminated union — this project's tsconfig
// doesn't enable `strict`, and without strictNullChecks TS's control-flow
// narrowing on a boolean discriminant (`if (!result.ok)`) doesn't reliably
// eliminate union members, so callers would need unsafe casts either way.
export interface CurlParseResult {
  ok: boolean;
  request?: ApiRequest;
  warnings: string[];
  error?: string;
}

/** Shell-like tokenizer: honors single/double quotes and backslash escapes, and
 *  joins `\<newline>` line continuations first so multi-line pasted commands work. */
const tokenize = (input: string): string[] => {
  const joined = input.replace(/\\\r?\n/g, ' ');
  const tokens: string[] = [];
  let i = 0;
  const n = joined.length;

  while (i < n) {
    while (i < n && /\s/.test(joined[i])) i++;
    if (i >= n) break;

    let token = '';
    while (i < n && !/\s/.test(joined[i])) {
      const ch = joined[i];
      if (ch === "'") {
        i++;
        while (i < n && joined[i] !== "'") {
          token += joined[i];
          i++;
        }
        i++;
      } else if (ch === '"') {
        i++;
        while (i < n && joined[i] !== '"') {
          if (joined[i] === '\\' && i + 1 < n && '"\\$`'.includes(joined[i + 1])) {
            token += joined[i + 1];
            i += 2;
          } else {
            token += joined[i];
            i++;
          }
        }
        i++;
      } else if (ch === '\\' && i + 1 < n) {
        token += joined[i + 1];
        i += 2;
      } else {
        token += ch;
        i++;
      }
    }
    tokens.push(token);
  }
  return tokens;
};

// Flags curl accepts that take no following value — safe to skip outright.
const NO_ARG_FLAGS = new Set([
  '-s', '--silent', '-S', '--show-error', '-k', '--insecure', '-i', '--include',
  '-v', '--verbose', '-L', '--location', '--compressed', '-f', '--fail', '-#',
  '--progress-bar', '-4', '--ipv4', '-6', '--ipv6', '-N', '--no-buffer',
]);

// Flags that take a value we don't model — consume and discard the value so it
// isn't misread as the URL or another flag.
const IGNORED_VALUE_FLAGS = new Set([
  '-o', '--output', '-w', '--write-out', '--connect-timeout', '-m', '--max-time',
  '--limit-rate', '-x', '--proxy', '--cacert', '--cert', '--key', '-c', '--cookie-jar',
]);

const splitHeader = (raw: string): [string, string] | null => {
  const idx = raw.indexOf(':');
  if (idx === -1) return null;
  return [raw.slice(0, idx).trim(), raw.slice(idx + 1).trim()];
};

const looksLikeJson = (raw: string): boolean => {
  const trimmed = raw.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
};

const looksUrlEncoded = (raw: string): boolean => /^[^\s]+=[^\s&]*(&[^\s]+=[^\s&]*)*$/.test(raw.trim());

export const parseCurlCommand = (input: string): CurlParseResult => {
  const trimmedInput = input.trim();
  if (!trimmedInput) return { ok: false, warnings: [], error: 'Paste a curl command first.' };

  const tokens = tokenize(trimmedInput);
  if (tokens.length === 0 || tokens[0].toLowerCase() !== 'curl') {
    return { ok: false, warnings: [], error: "Doesn't look like a curl command — it should start with \"curl\"." };
  }

  const warnings: string[] = [];
  let explicitMethod: HttpMethod | undefined;
  let url: string | undefined;
  const headers: Array<[string, string]> = [];
  const dataParts: string[] = [];
  const formFields: FormField[] = [];
  const formFileFlags = new Set<string>();
  let basicAuthRaw: string | undefined;
  let forceGet = false;

  for (let idx = 1; idx < tokens.length; idx++) {
    const tok = tokens[idx];

    if (tok === '-X' || tok === '--request') {
      const value = tokens[++idx]?.toUpperCase();
      if (value && !(HTTP_METHODS as readonly string[]).includes(value)) {
        return {
          ok: false,
          warnings: [],
          error: `Unsupported HTTP method "${value}" — supported methods are ${HTTP_METHODS.join(', ')}.`,
        };
      }
      explicitMethod = value as HttpMethod | undefined;
      continue;
    }
    if (tok === '-H' || tok === '--header') {
      const parsed = splitHeader(tokens[++idx] ?? '');
      if (parsed) headers.push(parsed);
      continue;
    }
    if (tok === '-d' || tok === '--data' || tok === '--data-raw' || tok === '--data-binary' || tok === '--data-ascii') {
      dataParts.push(tokens[++idx] ?? '');
      continue;
    }
    if (tok === '--data-urlencode') {
      dataParts.push(tokens[++idx] ?? '');
      continue;
    }
    if (tok === '-F' || tok === '--form') {
      const raw = tokens[++idx] ?? '';
      const eq = raw.indexOf('=');
      if (eq > -1) {
        const key = raw.slice(0, eq);
        let value = raw.slice(eq + 1);
        const isFile = value.startsWith('@');
        if (isFile) {
          value = value.slice(1);
          formFileFlags.add(key);
        }
        formFields.push({ id: nextId(), key, value, enabled: true, isFile, fileName: isFile ? value : undefined });
      }
      continue;
    }
    if (tok === '-u' || tok === '--user') {
      basicAuthRaw = tokens[++idx];
      continue;
    }
    if (tok === '--url') {
      url = tokens[++idx];
      continue;
    }
    if (tok === '-G' || tok === '--get') {
      forceGet = true;
      continue;
    }
    if (tok === '-b' || tok === '--cookie') {
      const value = tokens[++idx];
      if (value) headers.push(['Cookie', value]);
      continue;
    }
    if (tok === '-A' || tok === '--user-agent') {
      const value = tokens[++idx];
      if (value) headers.push(['User-Agent', value]);
      continue;
    }
    if (tok === '-e' || tok === '--referer') {
      const value = tokens[++idx];
      if (value) headers.push(['Referer', value]);
      continue;
    }
    if (IGNORED_VALUE_FLAGS.has(tok)) {
      idx++;
      continue;
    }
    if (NO_ARG_FLAGS.has(tok)) {
      continue;
    }
    if (tok.startsWith('-')) {
      warnings.push(`Ignored unrecognized flag "${tok}".`);
      continue;
    }

    // Bare token — the URL, unless one already looked more URL-shaped.
    if (/^https?:\/\//i.test(tok)) {
      url = tok;
    } else if (!url) {
      url = tok;
    }
  }

  if (!url) return { ok: false, warnings: [], error: "Couldn't find a URL in that command." };

  if (formFileFlags.size > 0) {
    warnings.push('File fields from -F @... were detected but the actual file contents can\'t be read from a pasted command — re-attach the file(s) manually.');
  }

  if (forceGet && dataParts.length > 0) {
    const search = new URLSearchParams(dataParts.join('&'));
    const [base, existingQuery = ''] = url.split('?');
    const merged = new URLSearchParams(existingQuery);
    search.forEach((value, key) => merged.append(key, value));
    url = `${base}?${merged.toString()}`;
    dataParts.length = 0;
  }

  const method: HttpMethod = explicitMethod ?? (formFields.length > 0 || dataParts.length > 0 ? 'POST' : 'GET');

  const request: ApiRequest = {
    ...createBlankRequest(),
    method,
    url,
    headers: headers.map(([key, value]) => ({ ...createRow(), key, value })),
  };

  if (basicAuthRaw !== undefined) {
    const [username, ...rest] = basicAuthRaw.split(':');
    request.auth = { ...request.auth, type: 'basic', basicUsername: username ?? '', basicPassword: rest.join(':') };
  } else {
    const authHeaderIdx = request.headers.findIndex((h) => h.key.toLowerCase() === 'authorization');
    if (authHeaderIdx > -1 && /^bearer\s+/i.test(request.headers[authHeaderIdx].value)) {
      const token = request.headers[authHeaderIdx].value.replace(/^bearer\s+/i, '');
      request.auth = { ...request.auth, type: 'bearer', bearerToken: token };
      request.headers.splice(authHeaderIdx, 1);
    }
  }

  if (formFields.length > 0) {
    request.body = { mode: 'multipart', raw: '', formFields };
  } else if (dataParts.length > 0) {
    const raw = dataParts.join('&');
    const contentTypeHeader = request.headers.find((h) => h.key.toLowerCase() === 'content-type')?.value ?? '';

    if (/application\/json/i.test(contentTypeHeader) || (!contentTypeHeader && looksLikeJson(raw))) {
      request.body = { mode: 'json', raw, formFields: [] };
    } else if (/application\/x-www-form-urlencoded/i.test(contentTypeHeader) || (!contentTypeHeader && looksUrlEncoded(raw))) {
      const search = new URLSearchParams(raw);
      const rows: ReturnType<typeof createRow>[] = [];
      search.forEach((value, key) => rows.push({ ...createRow(), key, value }));
      request.body = { mode: 'form-urlencoded', raw: '', formFields: rows };
    } else {
      request.body = { mode: 'text', raw, formFields: [] };
    }
  }

  return { ok: true, request, warnings };
};
