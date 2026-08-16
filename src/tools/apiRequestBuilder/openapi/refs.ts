import { isObject } from './validator';

/** Only `#/...` JSON Pointer refs are resolved — anything else (a URL, a relative file path) is
 *  a remote reference, which this importer deliberately never fetches (see PART 19/27: no network
 *  dependency, no SSRF surface). */
export const isLocalRef = (ref: unknown): ref is string => typeof ref === 'string' && ref.startsWith('#/');

const decodeRefSegment = (segment: string): string => segment.replace(/~1/g, '/').replace(/~0/g, '~');

const resolveLocalRef = (root: Record<string, unknown>, ref: string): unknown => {
  const segments = ref
    .slice(2)
    .split('/')
    .filter((s) => s !== '')
    .map(decodeRefSegment);
  let current: unknown = root;
  for (const segment of segments) {
    if (!isObject(current)) return undefined;
    current = current[segment];
  }
  return current;
};

/** A memoized local-`$ref` resolver scoped to one document — repeated lookups of the same ref
 *  (common when many operations reuse the same request/response schema) do one JSON-Pointer walk
 *  instead of re-traversing the document every time (see PART 31). */
export const createRefResolver = (root: Record<string, unknown>) => {
  const cache = new Map<string, unknown>();
  return (ref: string): unknown => {
    if (!isLocalRef(ref)) return undefined;
    if (cache.has(ref)) return cache.get(ref);
    const resolved = resolveLocalRef(root, ref);
    cache.set(ref, resolved);
    return resolved;
  };
};

export type RefResolver = ReturnType<typeof createRefResolver>;

/** Follows a single `$ref` hop if `value` is a ref object, otherwise returns `value` unchanged.
 *  Used for the many places OpenAPI allows "this parameter/requestBody/securityScheme, OR a
 *  $ref to one" — never follows a remote ref (returns undefined instead, since there is nothing
 *  local to resolve it to). Does not loop — callers needing multi-hop/cyclic-safe resolution
 *  (schemas) track their own `visited` set, since only schemas can legitimately be recursive. */
export const derefOnce = (value: unknown, resolve: RefResolver): unknown => {
  if (isObject(value) && typeof value.$ref === 'string') {
    if (!isLocalRef(value.$ref)) return undefined;
    return resolve(value.$ref);
  }
  return value;
};
