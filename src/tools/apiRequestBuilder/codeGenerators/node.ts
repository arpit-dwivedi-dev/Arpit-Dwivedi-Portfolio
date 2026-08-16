import type { ApiRequest } from '../types';
import { buildGeneratorInput } from './generatorInput';
import { buildJsBody } from './jsBody';
import { indent, jsHeadersLiteral, wantsJsonResponse } from './jsShared';

/** Generates modern Node.js code using Node's built-in fetch() (Node 18+) — no node-fetch or other
 *  dependency. Unlike the browser Fetch generator, headers aren't filtered: Node's fetch has none
 *  of the browser's forbidden-header restrictions, and there's no `credentials` mode to map since
 *  that's a browser cookie-jar concept with no Node equivalent. */
export const generateNodeCode = (request: ApiRequest, variables: Record<string, string> = {}): string => {
  const input = buildGeneratorInput(request, variables);

  const bodyResult = buildJsBody(input.body, false);
  const notes = [...bodyResult.notes];

  const useTimeout = input.timeoutMs > 0 && Number.isFinite(input.timeoutMs);

  const optionsLines = [
    `method: ${JSON.stringify(input.method)},`,
    `headers: ${jsHeadersLiteral(input.headers)},`,
    ...(bodyResult.expr !== undefined ? [`body: ${bodyResult.expr},`] : []),
    // AbortSignal.timeout() over a manual AbortController+setTimeout pair — Node 18+ (the same
    // baseline required for global fetch()) supports it, and it needs no cleanup.
    ...(useTimeout ? [`signal: AbortSignal.timeout(${input.timeoutMs}),`] : []),
  ].join('\n');

  const responseLine = wantsJsonResponse(input.headers)
    ? 'const data = await response.json();'
    : 'const data = await response.text();';

  const parts: string[] = [];
  if (notes.length > 0) parts.push(notes.map((note) => `// ${note}`).join('\n'), '');

  parts.push(...bodyResult.decl);
  if (bodyResult.decl.length > 0) parts.push('');

  parts.push(`const response = await fetch(${JSON.stringify(input.url)}, {`);
  parts.push(indent(optionsLines, 2));
  parts.push('});', '');
  parts.push(responseLine);
  parts.push('console.log(data);');

  return parts.join('\n');
};
