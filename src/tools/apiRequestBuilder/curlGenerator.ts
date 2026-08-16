import type { ApiRequest } from './types';
import { resolveRequest } from './resolveRequest';
import { resolveRequestVariables } from './environment';

// Wraps in single quotes, escaping any embedded single quote as '\'' — the
// standard POSIX-shell-safe technique, so generated commands never break on
// values containing spaces, quotes, or shell metacharacters.
const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

// `variables` defaults to empty, which makes resolveRequestVariables a no-op — a request with
// no active environment (or one containing no `{{name}}` syntax) generates byte-identical curl
// output to before this feature existed. When an environment is active, the copied command is
// meant to be pasted straight into a terminal and actually work, so — like Postman/Insomnia's
// code-export — it resolves variables into their real values rather than keeping `{{token}}`
// literal. That's an explicit, one-shot user action (Copy as cURL), not something persisted to
// disk or logged.
export const generateCurlCommand = (request: ApiRequest, variables: Record<string, string> = {}): string => {
  const resolved = resolveRequest(resolveRequestVariables(request, variables));
  const lines: string[] = [`curl -X ${request.method} ${shellQuote(resolved.url)}`];

  // --max-time is curl's closest equivalent to our timeout — both cap the whole operation.
  // Note there's no faithful curl equivalent for the browser `credentials` setting (same-origin
  // vs include vs omit is a browser cookie-jar concept curl doesn't have), so it's intentionally
  // left out rather than emitting a flag that would misrepresent what actually happens.
  if (request.timeoutMs > 0) {
    lines.push(`  --max-time ${request.timeoutMs / 1000}`);
  }

  for (const [key, value] of resolved.headers) {
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
  }

  if (request.body.mode === 'multipart') {
    for (const field of request.body.formFields) {
      if (!field.enabled || !field.key.trim()) continue;
      const value = field.isFile ? `@${field.fileName ?? field.value}` : field.value;
      lines.push(`  -F ${shellQuote(`${field.key}=${value}`)}`);
    }
  } else if (resolved.bodyText !== undefined && resolved.bodyText !== '') {
    lines.push(`  -d ${shellQuote(resolved.bodyText)}`);
  }

  return lines.join(' \\\n');
};
