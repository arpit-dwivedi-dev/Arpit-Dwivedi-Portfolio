import { createEmptyAuth, type Authentication } from '../types';
import { isObject } from './validator';

export interface ConvertedSecurity {
  /** null when the scheme has no representable auth type in this app's model — the caller keeps
   *  the request's auth as `none` and surfaces `warning` instead. */
  auth: Authentication | null;
  warning?: string;
}

/** Maps one OpenAPI security scheme to this app's Authentication shape (PART 18). Every secret
 *  field is always left empty — this is untrusted document data, never a real credential, and
 *  even a literal example key in the spec is never carried over (PART 27). Schemes with no
 *  equivalent here (OAuth2, OpenID Connect, mutual TLS, cookie-based API keys) return `auth: null`
 *  plus a short warning so the user knows auth needs manual setup rather than silently importing
 *  as "No Auth". */
export const convertSecurityScheme = (scheme: unknown, schemeName: string): ConvertedSecurity => {
  if (!isObject(scheme) || typeof scheme.type !== 'string') {
    return { auth: null, warning: `Security scheme "${schemeName}" has an unrecognized shape — authentication needs manual setup.` };
  }

  if (scheme.type === 'http') {
    const httpScheme = typeof scheme.scheme === 'string' ? scheme.scheme.toLowerCase() : '';
    if (httpScheme === 'bearer') {
      return { auth: { ...createEmptyAuth(), type: 'bearer' } };
    }
    if (httpScheme === 'basic') {
      return { auth: { ...createEmptyAuth(), type: 'basic' } };
    }
    return {
      auth: null,
      warning: `Security scheme "${schemeName}" (HTTP ${httpScheme || 'unknown'} auth) isn't supported — configure authentication manually.`,
    };
  }

  if (scheme.type === 'apiKey') {
    if (scheme.in === 'cookie') {
      return { auth: null, warning: `Security scheme "${schemeName}" sends an API key via cookie, which isn't supported here — configure authentication manually.` };
    }
    const location = scheme.in === 'query' ? 'query' : 'header';
    return {
      auth: { ...createEmptyAuth(), type: 'api-key', apiKeyName: typeof scheme.name === 'string' ? scheme.name : '', apiKeyLocation: location },
    };
  }

  // oauth2, openIdConnect, mutualTLS, or anything future/unrecognized.
  return {
    auth: null,
    warning: `Security scheme "${schemeName}" (${scheme.type}) requires manual authentication setup — it wasn't imported.`,
  };
};

/** Picks which security requirement applies to an operation: the operation's own `security`
 *  (including an explicit `[]`, meaning "no auth" — distinct from omitting the field) if present,
 *  otherwise the document-level default. Only the first scheme of the first alternative is
 *  applied — OpenAPI's `security` is "any one of these alternatives, each possibly requiring
 *  multiple schemes together", which has no equivalent in this app's single-auth-slot model. */
export const resolveOperationSecurity = (
  operationSecurity: unknown,
  globalSecurity: unknown[],
): { schemeName: string | null; extraSchemesIgnored: boolean } => {
  const requirements = Array.isArray(operationSecurity) ? operationSecurity : globalSecurity;
  if (requirements.length === 0) return { schemeName: null, extraSchemesIgnored: false };

  const first = requirements[0];
  if (!isObject(first)) return { schemeName: null, extraSchemesIgnored: false };

  const schemeNames = Object.keys(first);
  if (schemeNames.length === 0) return { schemeName: null, extraSchemesIgnored: false };

  return { schemeName: schemeNames[0], extraSchemesIgnored: schemeNames.length > 1 || requirements.length > 1 };
};
