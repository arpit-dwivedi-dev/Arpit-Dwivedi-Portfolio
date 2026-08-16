import type { ApiRequest } from '../types';
import { buildGeneratorInput } from './generatorInput';
import { toPythonLiteral } from './pythonLiteral';

const pyStr = (value: string): string => JSON.stringify(value);

const indent = (text: string, spaces: number): string => {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
};

const headersDict = (headers: Array<[string, string]>): string => {
  if (headers.length === 0) return '{}';
  const inner = headers.map(([key, value]) => `    ${pyStr(key)}: ${pyStr(value)},`).join('\n');
  return `{\n${inner}\n}`;
};

// TIMEOUT_OPTIONS_MS is always a clean multiple of 1000, but this stays defensive against any
// future non-round value rather than assuming that invariant here too.
const msToSeconds = (ms: number): string => {
  const seconds = ms / 1000;
  return Number.isInteger(seconds) ? String(seconds) : String(Math.round(seconds * 1000) / 1000);
};

/** Generates Python using the `requests` library. Basic auth prefers the idiomatic `auth=(user,
 *  pass)` tuple over a hand-encoded Authorization header (requests encodes it itself); bearer and
 *  API-key auth stay as headers, since `requests` has no built-in concept of either. */
export const generatePythonCode = (request: ApiRequest, variables: Record<string, string> = {}): string => {
  const input = buildGeneratorInput(request, variables);
  const notes: string[] = [];

  let headers = input.headers;
  let authKwarg: string | undefined;
  if (input.auth.type === 'basic' && (input.auth.basicUsername.trim() !== '' || input.auth.basicPassword.trim() !== '')) {
    headers = headers.filter(([key]) => key.toLowerCase() !== 'authorization');
    authKwarg = `(${pyStr(input.auth.basicUsername)}, ${pyStr(input.auth.basicPassword)})`;
  }

  const decl: string[] = [];
  const kwargs: string[] = [];

  switch (input.body.mode) {
    case 'none':
      break;
    case 'json': {
      if (input.body.raw.trim() === '') {
        kwargs.push('data="",');
      } else if (input.body.parsed.ok) {
        decl.push(`json_body = ${toPythonLiteral(input.body.parsed.value)}`);
        kwargs.push('json=json_body,');
      } else {
        notes.push("Body content isn't valid JSON — sent as a raw string instead.");
        kwargs.push(`data=${pyStr(input.body.raw)},`);
      }
      break;
    }
    case 'text':
      kwargs.push(`data=${pyStr(input.body.raw)},`);
      break;
    case 'form-urlencoded': {
      // A list of (key, value) tuples rather than a dict — `requests` accepts either, but only the
      // tuple form preserves a field appearing more than once, matching what the form editor allows.
      if (input.body.fields.length === 0) {
        kwargs.push('data=[],');
      } else {
        const inner = input.body.fields.map((f) => `    (${pyStr(f.key)}, ${pyStr(f.value)}),`).join('\n');
        decl.push(`form_data = [\n${inner}\n]`);
        kwargs.push('data=form_data,');
      }
      break;
    }
    case 'multipart': {
      const fileFields = input.body.fields.filter((f) => f.isFile);
      const plainFields = input.body.fields.filter((f) => !f.isFile);
      if (plainFields.length > 0) {
        const inner = plainFields.map((f) => `    ${pyStr(f.key)}: ${pyStr(f.value)},`).join('\n');
        decl.push(`form_data = {\n${inner}\n}`);
        kwargs.push('data=form_data,');
      }
      if (fileFields.length > 0) {
        const inner = fileFields
          .map((f) => `    ${pyStr(f.key)}: open(${pyStr(f.fileName ?? f.value ?? f.key)}, "rb"),  # replace with the actual file path`)
          .join('\n');
        decl.push(`files = {\n${inner}\n}`);
        kwargs.push('files=files,');
      }
      break;
    }
    default:
      break;
  }

  if (headers.length > 0) kwargs.push(`headers=${headersDict(headers)},`);
  if (authKwarg) kwargs.push(`auth=${authKwarg},`);

  const useTimeout = input.timeoutMs > 0 && Number.isFinite(input.timeoutMs);
  if (useTimeout) kwargs.push(`timeout=${msToSeconds(input.timeoutMs)},`);

  const parts: string[] = ['import requests', ''];
  if (notes.length > 0) parts.push(...notes.map((note) => `# ${note}`), '');
  if (decl.length > 0) parts.push(...decl, '');

  const methodFn = input.method.toLowerCase();
  if (kwargs.length === 0) {
    parts.push(`response = requests.${methodFn}(${pyStr(input.url)})`);
  } else {
    parts.push(`response = requests.${methodFn}(`);
    parts.push(indent(`${pyStr(input.url)},`, 4));
    parts.push(indent(kwargs.join('\n'), 4));
    parts.push(')');
  }

  parts.push('', 'print(response.status_code)', 'print(response.text)');

  return parts.join('\n');
};
