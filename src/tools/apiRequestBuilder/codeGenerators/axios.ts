import type { ApiRequest } from '../types';
import { buildGeneratorInput } from './generatorInput';
import { buildJsBody } from './jsBody';
import { indent, jsHeadersLiteral } from './jsShared';

/** Generates Axios-native code (not a Fetch call wrapped in a compatibility shim) — a JSON body is
 *  a plain object under `data` (Axios serializes it itself), and `timeout`/`withCredentials` are
 *  Axios's own config keys rather than fetch()'s AbortController/`credentials` concepts. */
export const generateAxiosCode = (request: ApiRequest, variables: Record<string, string> = {}): string => {
  const input = buildGeneratorInput(request, variables);

  const bodyResult = buildJsBody(input.body, true);
  const notes = [...bodyResult.notes];

  const useTimeout = input.timeoutMs > 0 && Number.isFinite(input.timeoutMs);

  // Axios has no concept matching fetch()'s "same-origin" (send cookies only when the request
  // happens to share the page's origin) — only `withCredentials: true`/`false`, which is closer to
  // fetch's "include"/"omit". Mapping "same-origin" to either would misrepresent it, so it's called
  // out instead of guessed at.
  if (input.credentials === 'same-origin') {
    notes.push('Axios has no equivalent to fetch\'s "same-origin" credentials mode — cookie behavior here follows Axios/XHR defaults, not this setting.');
  }

  const optionsLines = [
    `method: ${JSON.stringify(input.method)},`,
    `url: ${JSON.stringify(input.url)},`,
    `headers: ${jsHeadersLiteral(input.headers)},`,
    ...(bodyResult.expr !== undefined ? [`data: ${bodyResult.expr},`] : []),
    ...(useTimeout ? [`timeout: ${input.timeoutMs},`] : []),
    ...(input.credentials === 'include' ? ['withCredentials: true,'] : []),
  ].join('\n');

  const parts: string[] = ["import axios from 'axios';", ''];
  if (notes.length > 0) parts.push(notes.map((note) => `// ${note}`).join('\n'), '');

  parts.push(...bodyResult.decl);
  if (bodyResult.decl.length > 0) parts.push('');

  parts.push('const response = await axios({');
  parts.push(indent(optionsLines, 2));
  parts.push('});', '');
  parts.push('console.log(response.data);');

  return parts.join('\n');
};
