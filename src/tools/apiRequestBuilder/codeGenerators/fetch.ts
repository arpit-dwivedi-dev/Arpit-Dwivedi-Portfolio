import type { ApiRequest } from '../types';
import { buildGeneratorInput } from './generatorInput';
import { buildJsBody } from './jsBody';
import { indent, jsHeadersLiteral, wantsJsonResponse } from './jsShared';

// Headers a browser silently refuses to let script code set on a fetch() request (the Fetch
// spec's "forbidden request-header name" list, trimmed to the ones a hand-written request is
// realistically likely to contain) — kept here rather than fabricating a fetch() call that would
// throw or just silently drop the header at runtime.
const FORBIDDEN_BROWSER_HEADERS = new Set([
  'cookie',
  'cookie2',
  'host',
  'origin',
  'referer',
  'user-agent',
  'content-length',
  'connection',
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'date',
  'dnt',
  'expect',
  'keep-alive',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via',
]);

const isForbiddenBrowserHeader = (name: string): boolean => {
  const lower = name.toLowerCase();
  return FORBIDDEN_BROWSER_HEADERS.has(lower) || lower.startsWith('proxy-') || lower.startsWith('sec-');
};

/** Generates browser-runnable JavaScript using native fetch(). Headers/body/auth/query params all
 *  come from buildGeneratorInput — the same resolved-request shape the cURL generator uses — so
 *  this never re-derives what the request "actually" contains. */
export const generateFetchCode = (request: ApiRequest, variables: Record<string, string> = {}): string => {
  const input = buildGeneratorInput(request, variables);

  const browserHeaders = input.headers.filter(([key]) => !isForbiddenBrowserHeader(key));
  const omittedHeaders = input.headers.filter(([key]) => isForbiddenBrowserHeader(key));

  const notes = omittedHeaders.map(
    ([key]) => `${key} header omitted: browsers do not allow scripts to set it directly.`,
  );

  const bodyResult = buildJsBody(input.body, false);
  notes.push(...bodyResult.notes);

  const useTimeout = input.timeoutMs > 0 && Number.isFinite(input.timeoutMs);

  const optionsLines = [
    `method: ${JSON.stringify(input.method)},`,
    `headers: ${jsHeadersLiteral(browserHeaders)},`,
    ...(bodyResult.expr !== undefined ? [`body: ${bodyResult.expr},`] : []),
    `credentials: ${JSON.stringify(input.credentials)},`,
    ...(useTimeout ? ['signal: controller.signal,'] : []),
  ].join('\n');

  const responseLine = wantsJsonResponse(browserHeaders)
    ? 'const data = await response.json();'
    : 'const data = await response.text();';

  const coreBlock = [
    ...bodyResult.decl,
    ...(bodyResult.decl.length > 0 ? [''] : []),
    `const response = await fetch(${JSON.stringify(input.url)}, {`,
    indent(optionsLines, 2),
    '});',
    '',
    responseLine,
    'console.log(data);',
  ].join('\n');

  const parts: string[] = [];
  if (notes.length > 0) parts.push(notes.map((note) => `// ${note}`).join('\n'), '');

  if (useTimeout) {
    parts.push('const controller = new AbortController();');
    parts.push(`const timeoutId = setTimeout(() => controller.abort(), ${input.timeoutMs});`, '');
    parts.push('try {');
    parts.push(indent(coreBlock, 2));
    parts.push('} finally {');
    parts.push('  clearTimeout(timeoutId);');
    parts.push('}');
  } else {
    parts.push(coreBlock);
  }

  return parts.join('\n');
};
