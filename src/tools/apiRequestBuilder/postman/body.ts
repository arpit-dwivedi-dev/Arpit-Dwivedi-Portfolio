import { createEmptyBody, createRow, nextId, type FormField, type RequestBody } from '../types';
import { isNonEmptyString, isObject } from './validator';

export interface PostmanBodyResult {
  body: RequestBody;
  warning: string | null;
}

const isValidJson = (raw: string): boolean => {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
};

const buildUrlencodedFields = (raw: unknown): RequestBody['formFields'] => {
  if (!Array.isArray(raw)) return [];
  const rows: RequestBody['formFields'] = [];
  for (const entry of raw) {
    if (!isObject(entry) || typeof entry.key !== 'string') continue;
    rows.push({ ...createRow(), key: entry.key, value: typeof entry.value === 'string' ? entry.value : '', enabled: entry.disabled !== true });
  }
  return rows;
};

/** Text fields map straight across; file fields can't carry real file bytes (the Postman JSON
 *  only ever has a filesystem path, `src`, which this browser-based app has no access to) so
 *  they're represented as a placeholder row the user re-attaches manually — never an invented
 *  path (PART 15). */
const buildFormdataFields = (raw: unknown): { fields: FormField[]; hasFileField: boolean } => {
  if (!Array.isArray(raw)) return { fields: [], hasFileField: false };
  const fields: FormField[] = [];
  let hasFileField = false;
  for (const entry of raw) {
    if (!isObject(entry) || typeof entry.key !== 'string') continue;
    const enabled = entry.disabled !== true;
    if (entry.type === 'file') {
      hasFileField = true;
      const src = typeof entry.src === 'string' ? entry.src : Array.isArray(entry.src) ? entry.src.find((s): s is string => typeof s === 'string') : undefined;
      fields.push({ id: nextId(), key: entry.key, value: '', enabled, isFile: true, fileName: src ?? '' });
    } else {
      fields.push({ id: nextId(), key: entry.key, value: typeof entry.value === 'string' ? entry.value : '', enabled });
    }
  }
  return { fields, hasFileField };
};

/** Converts a Postman `request.body` into this app's RequestBody (PART 15). `raw` mode becomes
 *  `json` only when `options.raw.language` says so *and* the text actually parses as JSON —
 *  otherwise it's imported as plain `text` rather than guessing. `urlencoded`/`formdata` map onto
 *  the app's existing form-field rows. `graphql` and `file` (binary) have no runtime equivalent
 *  here and are never faked: graphql is best-effort imported as raw text (its query is still
 *  useful to read), file bodies are skipped outright with a warning — never inventing content or
 *  a filesystem path for either. */
export const convertPostmanBody = (rawBody: unknown): PostmanBodyResult => {
  if (!isObject(rawBody) || typeof rawBody.mode !== 'string') return { body: createEmptyBody(), warning: null };

  switch (rawBody.mode) {
    case 'raw': {
      const raw = typeof rawBody.raw === 'string' ? rawBody.raw : '';
      const language = isObject(rawBody.options) && isObject(rawBody.options.raw) && typeof rawBody.options.raw.language === 'string' ? rawBody.options.raw.language : '';
      if (language === 'json' && isValidJson(raw)) {
        return { body: { mode: 'json', raw, formFields: [] }, warning: null };
      }
      return { body: { mode: 'text', raw, formFields: [] }, warning: null };
    }
    case 'urlencoded':
      return { body: { mode: 'form-urlencoded', raw: '', formFields: buildUrlencodedFields(rawBody.urlencoded) }, warning: null };
    case 'formdata': {
      const { fields, hasFileField } = buildFormdataFields(rawBody.formdata);
      return {
        body: { mode: 'multipart', raw: '', formFields: fields },
        warning: hasFileField ? 'Some Postman file fields require local file re-selection.' : null,
      };
    }
    case 'graphql': {
      const graphql = rawBody.graphql;
      if (isObject(graphql) && isNonEmptyString(graphql.query)) {
        const variables = typeof graphql.variables === 'string' && graphql.variables.trim() !== '' ? graphql.variables : '';
        const raw = variables ? `${graphql.query}\n\n# Variables\n${variables}` : graphql.query;
        return { body: { mode: 'text', raw, formFields: [] }, warning: "GraphQL body imported as raw text — this tool doesn't execute GraphQL." };
      }
      return { body: createEmptyBody(), warning: "A GraphQL body couldn't be represented safely and was skipped." };
    }
    case 'file':
      return { body: createEmptyBody(), warning: 'A binary file body was not imported — attach the file manually.' };
    default:
      return { body: createEmptyBody(), warning: null };
  }
};
