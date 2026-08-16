import { createCollection, createFolder, nameCollides, type Collection, type Folder } from '../collections';
import { createEnvironment, type Environment, type EnvironmentVariable } from '../environment';
import { nextId, type SavedRequest } from '../types';
import { parseOpenApiText } from './parser';
import { createRefResolver, derefOnce } from './refs';
import { convertOperation, type ConvertedOperation } from './operationConverter';
import { validateOpenApiDocument, isObject, type OpenApiDocument, type OpenApiServer } from './validator';

export { MAX_OPENAPI_IMPORT_BYTES } from './parser';

export interface OpenApiImportSummary {
  title: string;
  version: string;
  operationCount: number;
  tagCount: number;
  serverCount: number;
  securitySchemeCount: number;
  folderCount: number;
}

export interface OpenApiImportPlan {
  collection: Collection;
  folders: Folder[];
  requests: SavedRequest[];
  /** null only when the document produced zero requests to save. */
  environment: Environment | null;
}

export interface OpenApiImportOutcome {
  ok: boolean;
  error?: string;
  plan?: OpenApiImportPlan;
  summary?: OpenApiImportSummary;
  /** Concise, deduplicated notices — "3 operations use unsupported authentication schemes",
   *  never one line per operation (see PART 24/25). */
  warnings?: string[];
  skippedOperationCount?: number;
}

const IMPORTED_SUFFIX = ' (Imported)';

/** Same disambiguation convention as importFormat.ts's collection-export import and the page's
 *  New Collection/New Folder flow ("X (Imported)", then "X (Imported 2)", ...) — kept as a local
 *  copy rather than a shared export so this importer stays a self-contained module (PART 28). */
const uniqueImportedName = (base: string, takenNames: string[]): string => {
  const withSuffix = `${base}${IMPORTED_SUFFIX}`;
  if (!nameCollides(takenNames, withSuffix)) return withSuffix;
  let n = 2;
  while (nameCollides(takenNames, `${withSuffix} ${n}`)) n += 1;
  return `${withSuffix} ${n}`;
};

const HTTP_METHOD_KEYS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/** Substitutes a server's `{variable}` placeholders with their declared defaults (PART 10) —
 *  the only server-variable handling this importer does; anything more (a variable editor,
 *  switching between multiple servers) is explicitly out of scope. */
const resolveServerUrl = (server: OpenApiServer): string => {
  let url = server.url;
  for (const [name, variable] of Object.entries(server.variables)) {
    url = url.split(`{${name}}`).join(variable.default);
  }
  return url;
};

const buildEnvironmentVariable = (key: string, value: string): EnvironmentVariable => ({ id: nextId(), key, value });

const convertAllOperations = (doc: OpenApiDocument): { operations: ConvertedOperation[]; skippedOperationCount: number } => {
  const resolve = createRefResolver(doc.raw);
  const ctx = { resolve, securitySchemes: doc.securitySchemes, globalSecurity: doc.globalSecurity };

  const operations: ConvertedOperation[] = [];
  let skippedOperationCount = 0;

  for (const [path, pathItemRaw] of Object.entries(doc.paths)) {
    const pathItem = derefOnce(pathItemRaw, resolve);
    if (!isObject(pathItem)) {
      skippedOperationCount++;
      continue;
    }
    for (const methodKey of HTTP_METHOD_KEYS) {
      if (!(methodKey in pathItem)) continue;
      let converted: ConvertedOperation | null;
      try {
        converted = convertOperation(path, methodKey, pathItem, pathItem[methodKey], ctx);
      } catch {
        // A single malformed operation/schema never fails the whole document (PART 26).
        converted = null;
      }
      if (converted) operations.push(converted);
      else skippedOperationCount++;
    }
  }

  return { operations, skippedOperationCount };
};

const pluralize = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`;

const aggregateWarnings = (operations: ConvertedOperation[]): string[] => {
  const warnings: string[] = [];

  const authIssues = operations.filter((o) => o.unsupportedAuthWarning !== null).length;
  if (authIssues > 0) warnings.push(`${pluralize(authIssues, 'operation')} use${authIssues === 1 ? 's' : ''} an unsupported authentication scheme — configure auth manually for those.`);

  const bodyIssues = operations.filter((o) => o.unsupportedBodyWarning !== null).length;
  if (bodyIssues > 0) warnings.push(`${pluralize(bodyIssues, 'operation')} ${bodyIssues === 1 ? 'has' : 'have'} an unsupported request body content type — imported without a body.`);

  const skippedHeaders = operations.reduce((sum, o) => sum + o.skippedHeaderCount, 0);
  if (skippedHeaders > 0) warnings.push(`${pluralize(skippedHeaders, 'header parameter')} can't be set by browser requests and ${skippedHeaders === 1 ? 'was' : 'were'} skipped.`);

  const skippedCookies = operations.reduce((sum, o) => sum + o.skippedCookieCount, 0);
  if (skippedCookies > 0) warnings.push(`${pluralize(skippedCookies, 'cookie parameter')} ${skippedCookies === 1 ? "isn't" : "aren't"} supported and ${skippedCookies === 1 ? 'was' : 'were'} skipped.`);

  return warnings;
};

/** Builds tag folders (PART 8): the first tag on an operation places it in that folder, an
 *  untagged operation falls back to "General", and a tag is never turned into more than one
 *  folder. Always one level deep, well within MAX_FOLDER_DEPTH. */
const buildFolders = (collectionId: string, operations: ConvertedOperation[]): { folders: Folder[]; folderIdByTag: Map<string, string> } => {
  const folderIdByTag = new Map<string, string>();
  const folders: Folder[] = [];
  for (const op of operations) {
    const tagName = op.tags[0] ?? 'General';
    if (folderIdByTag.has(tagName)) continue;
    const folder = createFolder(collectionId, null, tagName);
    folders.push(folder);
    folderIdByTag.set(tagName, folder.id);
  }
  return { folders, folderIdByTag };
};

/** Parses (JSON or YAML), validates, and converts an OpenAPI 3.0/3.1 document into a ready-to-
 *  persist collection/folders/requests/environment plan plus a preview summary — pure, with no
 *  storage access of its own (see PART 21/23/28). The caller shows the summary for confirmation
 *  and only then writes `plan` via the existing collection/folder/saved-request/environment
 *  storage APIs, exactly like a JSON collection import. */
export const buildOpenApiImportPlan = (
  text: string,
  existingCollectionNames: string[],
  existingEnvironmentNames: string[],
): OpenApiImportOutcome => {
  const parsed = parseOpenApiText(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const validated = validateOpenApiDocument(parsed.value);
  if (!validated.ok || !validated.doc) return { ok: false, error: validated.error };
  const doc = validated.doc;

  const { operations, skippedOperationCount } = convertAllOperations(doc);
  if (operations.length === 0) {
    return { ok: false, error: 'No importable operations were found in that document.' };
  }

  const collectionName = uniqueImportedName(doc.title, existingCollectionNames);
  const collection = createCollection(collectionName);
  const { folders, folderIdByTag } = buildFolders(collection.id, operations);

  const now = Date.now();
  const requests: SavedRequest[] = operations.map((op) => ({
    id: nextId(),
    collectionId: collection.id,
    folderId: folderIdByTag.get(op.tags[0] ?? 'General') ?? null,
    name: op.name,
    createdAt: now,
    updatedAt: now,
    request: op.request,
  }));

  const warnings = aggregateWarnings(operations);

  let environment: Environment | null = null;
  if (doc.servers.length > 0) {
    const environmentName = uniqueImportedName(doc.title, existingEnvironmentNames);
    environment = { ...createEnvironment(environmentName), variables: [buildEnvironmentVariable('baseUrl', resolveServerUrl(doc.servers[0]))] };
  } else {
    warnings.push('No server URL was found in the document — set a "baseUrl" variable manually before sending these requests.');
    const environmentName = uniqueImportedName(doc.title, existingEnvironmentNames);
    environment = { ...createEnvironment(environmentName), variables: [buildEnvironmentVariable('baseUrl', '')] };
  }

  const uniqueTagCount = new Set(operations.map((op) => op.tags[0] ?? 'General')).size;

  return {
    ok: true,
    plan: { collection, folders, requests, environment },
    summary: {
      title: doc.title,
      version: doc.version,
      operationCount: operations.length,
      tagCount: uniqueTagCount,
      serverCount: doc.servers.length,
      securitySchemeCount: Object.keys(doc.securitySchemes).length,
      folderCount: folders.length,
    },
    warnings,
    skippedOperationCount,
  };
};
