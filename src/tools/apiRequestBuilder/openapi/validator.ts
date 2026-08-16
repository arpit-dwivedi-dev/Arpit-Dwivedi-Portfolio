export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

export interface OpenApiServerVariable {
  default: string;
}

export interface OpenApiServer {
  url: string;
  variables: Record<string, OpenApiServerVariable>;
}

export interface OpenApiDocument {
  raw: Record<string, unknown>;
  version: string;
  title: string;
  servers: OpenApiServer[];
  paths: Record<string, unknown>;
  securitySchemes: Record<string, unknown>;
  /** Document-level `security` — the fallback every operation inherits unless it declares its own. */
  globalSecurity: unknown[];
}

export interface OpenApiValidationResult {
  ok: boolean;
  doc?: OpenApiDocument;
  error?: string;
}

const UNSUPPORTED_VERSION_ERROR = 'Unsupported OpenAPI version. Import supports OpenAPI 3.0 and 3.1.';

// 3.0.x and 3.1.x only — see PART 5. A bare major/minor without a patch (rare, but technically
// invalid OpenAPI) is rejected the same as anything else that doesn't match.
const SUPPORTED_VERSION = /^3\.[01]\.\d+$/;

const parseServer = (raw: unknown): OpenApiServer | null => {
  if (!isObject(raw) || !isNonEmptyString(raw.url)) return null;
  const variables: Record<string, OpenApiServerVariable> = {};
  if (isObject(raw.variables)) {
    for (const [name, v] of Object.entries(raw.variables)) {
      if (isObject(v) && isNonEmptyString(v.default)) variables[name] = { default: v.default };
    }
  }
  return { url: raw.url, variables };
};

/** Validates just enough structure to safely interpret the document (PART 6): a supported
 *  `openapi` version string and a `paths` object. Everything else (info, servers, components,
 *  tags, securitySchemes) is optional — present-but-malformed metadata is tolerated rather than
 *  rejecting the whole import, since a spec with valid `paths` should still import. */
export const validateOpenApiDocument = (value: unknown): OpenApiValidationResult => {
  if (!isObject(value)) {
    return { ok: false, error: 'Unrecognized file format — expected an OpenAPI document (a JSON or YAML object).' };
  }

  if (typeof value.swagger === 'string' || !isNonEmptyString(value.openapi)) {
    return { ok: false, error: UNSUPPORTED_VERSION_ERROR };
  }
  if (!SUPPORTED_VERSION.test(value.openapi)) {
    return { ok: false, error: UNSUPPORTED_VERSION_ERROR };
  }

  if (!isObject(value.paths)) {
    return { ok: false, error: 'This OpenAPI document has no `paths` to import.' };
  }

  const info = isObject(value.info) ? value.info : {};
  const title = isNonEmptyString(info.title) ? info.title.trim() : 'Imported OpenAPI';

  const servers = Array.isArray(value.servers) ? value.servers.map(parseServer).filter((s): s is OpenApiServer => s !== null) : [];

  const components = isObject(value.components) ? value.components : {};
  const securitySchemes = isObject(components.securitySchemes) ? components.securitySchemes : {};

  const globalSecurity = Array.isArray(value.security) ? value.security : [];

  return {
    ok: true,
    doc: {
      raw: value,
      version: value.openapi,
      title,
      servers,
      paths: value.paths,
      securitySchemes,
      globalSecurity,
    },
  };
};
