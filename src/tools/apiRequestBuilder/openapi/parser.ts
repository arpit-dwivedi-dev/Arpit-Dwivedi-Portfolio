import { parse as parseYaml } from 'yaml';

// A few MB is generous for even a large, multi-hundred-operation OpenAPI document while staying
// cheap to parse synchronously on the main thread — same ceiling reasoning as exportFormat.ts's
// MAX_IMPORT_TEXT_LENGTH, kept as its own constant since this importer is a separate entry point.
export const MAX_OPENAPI_IMPORT_BYTES = 5_000_000;

export interface OpenApiParseResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

const isJsonLike = (text: string): boolean => {
  const trimmed = text.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

/** Parses a file's text as either JSON or YAML without trusting the filename/extension — some
 *  `.yaml` files are valid JSON (a JSON object is valid YAML too, so that path also succeeds
 *  here), and some `.json` files are hand-edited into YAML-only syntax. JSON is tried first
 *  since it's stricter and cheaper; YAML is only attempted as a fallback, or immediately when
 *  the text doesn't even look JSON-shaped. Never throws — parse errors from either parser are
 *  caught and surfaced as a single, concise message rather than a stack trace. */
export const parseOpenApiText = (text: string): OpenApiParseResult => {
  if (text.length > MAX_OPENAPI_IMPORT_BYTES) {
    return { ok: false, error: `File is too large to import (limit ${Math.floor(MAX_OPENAPI_IMPORT_BYTES / 1_000_000)}MB).` };
  }
  if (!text.trim()) {
    return { ok: false, error: 'That file is empty.' };
  }

  if (isJsonLike(text)) {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      // Fall through to YAML — a `.json`-looking file that isn't valid JSON might still be
      // valid YAML (e.g. trailing commas fixed up, or genuinely YAML content misnamed).
    }
  }

  try {
    return { ok: true, value: parseYaml(text, { maxAliasCount: 200 }) };
  } catch {
    return { ok: false, error: "Couldn't parse that file as JSON or YAML." };
  }
};
