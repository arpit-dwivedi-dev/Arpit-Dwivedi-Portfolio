import type { ApiRequest } from './types';
import { resolveRequest } from './resolveRequest';

// Wraps in single quotes, escaping any embedded single quote as '\'' — the
// standard POSIX-shell-safe technique, so generated commands never break on
// values containing spaces, quotes, or shell metacharacters.
const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

export const generateCurlCommand = (request: ApiRequest): string => {
  const resolved = resolveRequest(request);
  const lines: string[] = [`curl -X ${request.method} ${shellQuote(resolved.url)}`];

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
