// Same ceiling reasoning as openapi/parser.ts's MAX_OPENAPI_IMPORT_BYTES — generous for even a
// large, multi-hundred-request collection while staying cheap to JSON.parse synchronously.
export const MAX_POSTMAN_IMPORT_BYTES = 5_000_000;

export interface PostmanParseResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

/** Parses a Postman Collection export as JSON — unlike OpenAPI, Postman collections are never
 *  YAML, so this is just a guarded JSON.parse. Never throws — a parse error is caught and
 *  surfaced as a single, concise message rather than a stack trace (PART 4: malformed files
 *  must not crash the app). */
export const parsePostmanText = (text: string): PostmanParseResult => {
  if (text.length > MAX_POSTMAN_IMPORT_BYTES) {
    return { ok: false, error: `File is too large to import (limit ${Math.floor(MAX_POSTMAN_IMPORT_BYTES / 1_000_000)}MB).` };
  }
  if (!text.trim()) {
    return { ok: false, error: 'That file is empty.' };
  }

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: "Couldn't parse that file as JSON." };
  }
};
