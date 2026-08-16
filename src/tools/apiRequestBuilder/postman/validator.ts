export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

export interface PostmanDocument {
  raw: Record<string, unknown>;
  title: string;
  schemaVersion: '2.0' | '2.1';
  items: unknown[];
  /** Collection-level `variable` array — declared defaults, possibly including secret-shaped
   *  entries (handled defensively in variables.ts, never trusted as literal-safe here). */
  variables: unknown[];
  /** Collection-level `auth` — the root of the auth-inheritance chain (PART 22). */
  auth: unknown;
  /** Collection-level `event` — pre-request/test scripts declared at the root, never executed. */
  events: unknown[];
}

export interface PostmanValidationResult {
  ok: boolean;
  doc?: PostmanDocument;
  error?: string;
}

const UNSUPPORTED_SCHEMA_ERROR = 'Unsupported Postman Collection format. Import supports Collection schema v2.0 and v2.1.';

// Matches https://schema.getpostman.com/json/collection/v2.0.0/collection.json (and the v2.1.0
// counterpart), tolerating http(s) and trailing query/hash noise some exporters add.
const SCHEMA_PATTERN = /\/collection\/v2\.([01])\.\d+\/collection\.json/;

/** Validates just enough structure to safely interpret the document (PART 2/6): a recognized
 *  `info.schema` (v2.0 or v2.1) and an `item` array. Everything else (collection-level auth,
 *  variable, event) is optional and tolerated even when malformed — present-but-broken metadata
 *  never blocks an otherwise-valid collection from importing. */
export const validatePostmanDocument = (value: unknown): PostmanValidationResult => {
  if (!isObject(value)) {
    return { ok: false, error: 'Unrecognized file format — expected a Postman Collection (a JSON object).' };
  }

  const info = value.info;
  if (!isObject(info) || !isNonEmptyString(info.schema)) {
    return { ok: false, error: UNSUPPORTED_SCHEMA_ERROR };
  }
  const schemaMatch = SCHEMA_PATTERN.exec(info.schema);
  if (!schemaMatch) {
    return { ok: false, error: UNSUPPORTED_SCHEMA_ERROR };
  }
  const schemaVersion: '2.0' | '2.1' = schemaMatch[1] === '1' ? '2.1' : '2.0';

  if (!Array.isArray(value.item)) {
    return { ok: false, error: 'This Postman Collection has no requests to import.' };
  }

  const title = isNonEmptyString(info.name) ? info.name.trim() : 'Imported Postman Collection';

  return {
    ok: true,
    doc: {
      raw: value,
      title,
      schemaVersion,
      items: value.item,
      variables: Array.isArray(value.variable) ? value.variable : [],
      auth: value.auth,
      events: Array.isArray(value.event) ? value.event : [],
    },
  };
};
