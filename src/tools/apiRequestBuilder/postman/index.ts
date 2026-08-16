import { canCreateSubfolder, createCollection, createFolder, nameCollides, type Collection, type Folder } from '../collections';
import { createEnvironment, type Environment, type EnvironmentVariable } from '../environment';
import { nextId, type SavedRequest } from '../types';
import { resolveEffectiveAuth } from './auth';
import { convertItem, type ConvertedItem } from './itemConverter';
import { parsePostmanText } from './parser';
import { isNonEmptyString, isObject, validatePostmanDocument } from './validator';
import { mergePostmanVariables } from './variables';

export { MAX_POSTMAN_IMPORT_BYTES } from './parser';

export interface PostmanImportSummary {
  title: string;
  schemaVersion: '2.0' | '2.1';
  requestCount: number;
  folderCount: number;
  variableCount: number;
}

export interface PostmanImportPlan {
  collection: Collection;
  folders: Folder[];
  requests: SavedRequest[];
  /** null only when the collection declared no `variable` entries anywhere (PART 12: this is an
   *  opt-in convenience, never a required Postman-environment subsystem). */
  environment: Environment | null;
}

export interface PostmanImportOutcome {
  ok: boolean;
  error?: string;
  plan?: PostmanImportPlan;
  summary?: PostmanImportSummary;
  /** Concise, deduplicated notices — "3 requests use an unsupported authentication type", never
   *  one line per request (same convention as openapi/index.ts's aggregateWarnings). */
  warnings?: string[];
  skippedRequestCount?: number;
}

const IMPORTED_SUFFIX = ' (Imported)';

/** Same disambiguation convention as importFormat.ts and openapi/index.ts ("X (Imported)", then
 *  "X (Imported) 2", ...) — kept as a local copy rather than a shared export so this importer
 *  stays a self-contained module, matching the other two importers' precedent. */
const uniqueImportedName = (base: string, takenNames: string[]): string => {
  const withSuffix = `${base}${IMPORTED_SUFFIX}`;
  if (!nameCollides(takenNames, withSuffix)) return withSuffix;
  let n = 2;
  while (nameCollides(takenNames, `${withSuffix} ${n}`)) n += 1;
  return `${withSuffix} ${n}`;
};

const pluralize = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`;

interface WalkState {
  folders: Folder[];
  requestItems: { item: ConvertedItem; folderId: string | null }[];
  skippedRequestCount: number;
  preRequestScriptCount: number;
  testScriptCount: number;
  flattenedFolderCount: number;
  dynamicVariableNames: Set<string>;
  /** Raw `variable` arrays declared on folders / request URLs, collected in traversal order so
   *  the final merge can apply "folder overrides collection, request overrides folder" (PART 23)
   *  without introducing a real per-scope variable system. */
  folderVariableScopes: unknown[][];
  requestVariableScopes: unknown[][];
}

const hasNonEmptyExec = (event: unknown): boolean => {
  if (!isObject(event) || !isObject(event.script)) return false;
  const exec = event.script.exec;
  const lines = Array.isArray(exec) ? exec : typeof exec === 'string' ? [exec] : [];
  return lines.some((line) => typeof line === 'string' && line.trim() !== '');
};

/** Counts pre-request/test scripts without ever reading their content beyond checking it's
 *  non-empty — scripts are never parsed as code, only tallied for the warning (PART 19/20/29). */
const countScripts = (events: unknown, state: WalkState): void => {
  if (!Array.isArray(events)) return;
  for (const event of events) {
    if (!isObject(event) || !hasNonEmptyExec(event)) continue;
    if (event.listen === 'prerequest') state.preRequestScriptCount++;
    else if (event.listen === 'test') state.testScriptCount++;
  }
};

/** Recursively walks Postman's nested `item` tree, turning folders into Folder records and
 *  requests into ConvertedItem entries (PART 6/7). A folder deeper than MAX_FOLDER_DEPTH is never
 *  allowed to fail the import — canCreateSubfolder (the same check the manual "New subfolder"
 *  button uses) decides whether to create it; once the limit is hit, its contents are flattened
 *  into the last folder that could be created, and recursion continues from there so arbitrarily
 *  deep source structures still land somewhere reasonable instead of being dropped. */
const walkItems = (items: unknown[], collectionId: string, parentFolderId: string | null, inheritedAuth: unknown, state: WalkState): void => {
  for (const raw of items) {
    if (!isObject(raw)) continue;
    countScripts(raw.event, state);

    if (Array.isArray(raw.item)) {
      const ownAuth = 'auth' in raw ? raw.auth : undefined;
      const nextInheritedAuth = resolveEffectiveAuth(ownAuth, inheritedAuth);
      if (Array.isArray(raw.variable)) state.folderVariableScopes.push(raw.variable);
      const name = isNonEmptyString(raw.name) ? raw.name.trim() : 'Untitled Folder';

      if (canCreateSubfolder(state.folders, parentFolderId)) {
        const folder = createFolder(collectionId, parentFolderId, name);
        state.folders.push(folder);
        walkItems(raw.item, collectionId, folder.id, nextInheritedAuth, state);
      } else {
        state.flattenedFolderCount++;
        walkItems(raw.item, collectionId, parentFolderId, nextInheritedAuth, state);
      }
      continue;
    }

    if (isObject(raw.request)) {
      if (isObject(raw.request.url) && Array.isArray(raw.request.url.variable)) {
        state.requestVariableScopes.push(raw.request.url.variable);
      }
      const converted = convertItem(raw, inheritedAuth);
      if (converted) {
        state.requestItems.push({ item: converted, folderId: parentFolderId });
        for (const name of converted.dynamicVariableNames) state.dynamicVariableNames.add(name);
      } else {
        state.skippedRequestCount++;
      }
      continue;
    }

    // Neither a folder nor a request — an informational/unrecognized item, ignored safely
    // rather than assumed to be a request (PART 7).
  }
};

const buildWarnings = (items: ConvertedItem[], state: WalkState): string[] => {
  const warnings: string[] = [];

  const authIssues = items.filter((i) => i.unsupportedAuthWarning !== null).length;
  if (authIssues > 0) {
    warnings.push(`${pluralize(authIssues, 'request')} use${authIssues === 1 ? 's' : ''} an unsupported authentication type — imported without auth.`);
  }

  const bodyMessageCounts = new Map<string, number>();
  for (const item of items) {
    if (!item.unsupportedBodyWarning) continue;
    bodyMessageCounts.set(item.unsupportedBodyWarning, (bodyMessageCounts.get(item.unsupportedBodyWarning) ?? 0) + 1);
  }
  for (const [message, count] of bodyMessageCounts) {
    warnings.push(count === 1 ? message : `${message} (${count} requests)`);
  }

  if (state.flattenedFolderCount > 0) {
    warnings.push(
      `${pluralize(state.flattenedFolderCount, 'folder')} exceeded the maximum folder depth and ${state.flattenedFolderCount === 1 ? 'was' : 'were'} flattened into its parent.`,
    );
  }

  if (state.preRequestScriptCount > 0) warnings.push(`${pluralize(state.preRequestScriptCount, 'pre-request script')} not imported.`);
  if (state.testScriptCount > 0) warnings.push(`${pluralize(state.testScriptCount, 'test script')} ignored.`);

  if (state.dynamicVariableNames.size > 0) {
    const names = [...state.dynamicVariableNames].sort().map((n) => `{{$${n}}}`).join(', ');
    warnings.push(
      `${pluralize(state.dynamicVariableNames.size, 'dynamic Postman variable')} (${names}) unsupported — preserved as literal text.`,
    );
  }

  return warnings;
};

/** Parses, validates, and converts a Postman Collection v2.0/v2.1 export into a ready-to-persist
 *  collection/folders/requests/environment plan plus a preview summary — pure, with no storage
 *  access of its own, same contract as openapi/index.ts's buildOpenApiImportPlan. The caller
 *  shows the summary for confirmation and only then writes `plan` via the existing collection/
 *  folder/saved-request/environment storage APIs (PART 25/26/27/31). */
export const buildPostmanImportPlan = (text: string, existingCollectionNames: string[], existingEnvironmentNames: string[]): PostmanImportOutcome => {
  const parsed = parsePostmanText(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const validated = validatePostmanDocument(parsed.value);
  if (!validated.ok || !validated.doc) return { ok: false, error: validated.error };
  const doc = validated.doc;

  const state: WalkState = {
    folders: [],
    requestItems: [],
    skippedRequestCount: 0,
    preRequestScriptCount: 0,
    testScriptCount: 0,
    flattenedFolderCount: 0,
    dynamicVariableNames: new Set(),
    folderVariableScopes: [],
    requestVariableScopes: [],
  };

  const collectionName = uniqueImportedName(doc.title, existingCollectionNames);
  const collection = createCollection(collectionName);

  countScripts(doc.events, state);
  walkItems(doc.items, collection.id, null, doc.auth, state);

  if (state.requestItems.length === 0) {
    return { ok: false, error: 'No importable requests were found in that collection.' };
  }

  const now = Date.now();
  const requests: SavedRequest[] = state.requestItems.map(({ item, folderId }) => ({
    id: nextId(),
    collectionId: collection.id,
    folderId,
    name: item.name,
    createdAt: now,
    updatedAt: now,
    request: item.request,
  }));

  const convertedItems = state.requestItems.map((r) => r.item);
  const warnings = buildWarnings(convertedItems, state);

  // Collection variables first (lowest priority), then folder-level, then request-level (url path
  // variables) — later entries win on key collision, matching PART 23's inheritance order without
  // introducing a real per-scope variable system: this is a single, flat, best-effort merge.
  const mergedVariables = mergePostmanVariables(doc.variables, ...state.folderVariableScopes, ...state.requestVariableScopes);

  let environment: Environment | null = null;
  if (mergedVariables.length > 0) {
    const redactedCount = mergedVariables.filter((v) => v.redacted).length;
    if (redactedCount > 0) {
      warnings.push(`${pluralize(redactedCount, 'collection variable')} looked like a literal secret and ${redactedCount === 1 ? 'was' : 'were'} left blank — set ${redactedCount === 1 ? 'it' : 'them'} in your environment.`);
    }
    const environmentName = uniqueImportedName(doc.title, existingEnvironmentNames);
    environment = {
      ...createEnvironment(environmentName),
      variables: mergedVariables.map((v): EnvironmentVariable => ({ id: nextId(), key: v.key, value: v.value })),
    };
  }

  return {
    ok: true,
    plan: { collection, folders: state.folders, requests, environment },
    summary: {
      title: doc.title,
      schemaVersion: doc.schemaVersion,
      requestCount: requests.length,
      folderCount: state.folders.length,
      variableCount: mergedVariables.length,
    },
    warnings,
    skippedRequestCount: state.skippedRequestCount,
  };
};
