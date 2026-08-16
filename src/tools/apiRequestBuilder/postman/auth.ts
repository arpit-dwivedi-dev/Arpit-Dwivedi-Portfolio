import { createEmptyAuth, type Authentication } from '../types';
import { isObject } from './validator';

export interface ConvertedPostmanAuth {
  /** null when the auth type has no representable equivalent in this app's model, or when there
   *  was simply nothing to convert (undefined `auth`) — the caller keeps the request's auth as
   *  `none` either way and surfaces `warning` when one is present. */
  auth: Authentication | null;
  warning?: string;
}

/** Postman auth fields are arrays of `{key, value, type}` rows rather than a plain object, e.g.
 *  `auth.bearer = [{ key: 'token', value: '{{token}}', type: 'string' }]`. */
const getField = (fields: unknown, key: string): string => {
  if (!Array.isArray(fields)) return '';
  const found = fields.find((f) => isObject(f) && f.key === key);
  if (!isObject(found)) return '';
  return typeof found.value === 'string' ? found.value : found.value != null ? String(found.value) : '';
};

/** Maps one Postman `auth` object to this app's Authentication shape (PART 16). Bearer/basic/
 *  apikey values are carried through as-is — whether a `{{variable}}` template or a literal
 *  credential — exactly like curlParser.ts does for `-u`/Authorization header values; a literal
 *  secret is never dropped here, it's redacted later at the storage.upsertSavedRequest boundary
 *  (PART 17/26/30), same as every other saved request. Types with no equivalent here (oauth2,
 *  awsv4, digest, hawk, ntlm, edgegrid, and anything future/unrecognized) return `auth: null`
 *  plus a short warning instead of faking support (PART 16). */
export const convertPostmanAuth = (auth: unknown): ConvertedPostmanAuth => {
  if (auth === undefined) return { auth: null };
  if (!isObject(auth) || typeof auth.type !== 'string') {
    return { auth: null, warning: 'A request had an unrecognized authentication shape — imported without auth.' };
  }

  switch (auth.type) {
    case 'noauth':
      return { auth: { ...createEmptyAuth(), type: 'none' } };
    case 'bearer':
      return { auth: { ...createEmptyAuth(), type: 'bearer', bearerToken: getField(auth.bearer, 'token') } };
    case 'basic':
      return {
        auth: {
          ...createEmptyAuth(),
          type: 'basic',
          basicUsername: getField(auth.basic, 'username'),
          basicPassword: getField(auth.basic, 'password'),
        },
      };
    case 'apikey':
      return {
        auth: {
          ...createEmptyAuth(),
          type: 'api-key',
          apiKeyName: getField(auth.apikey, 'key'),
          apiKeyValue: getField(auth.apikey, 'value'),
          apiKeyLocation: getField(auth.apikey, 'in') === 'query' ? 'query' : 'header',
        },
      };
    default:
      return { auth: null, warning: `Authentication type "${auth.type}" isn't supported — imported without auth; configure it manually.` };
  }
};

/** Resolves the effective raw Postman auth object for one item, honoring PART 22's inheritance
 *  rule: an item that declares its own `auth` key (including an explicit `{type:'noauth'}`,
 *  Postman's way of turning inheritance off) always wins over whatever an ancestor declared;
 *  only a request with no `auth` key at all inherits. `inheritedAuth` is whatever the nearest
 *  ancestor (folder, then collection) resolved to — already itself the result of this same rule,
 *  since folders can inherit from their own parent folder too. */
export const resolveEffectiveAuth = (ownAuth: unknown, inheritedAuth: unknown): unknown => (ownAuth !== undefined ? ownAuth : inheritedAuth);
