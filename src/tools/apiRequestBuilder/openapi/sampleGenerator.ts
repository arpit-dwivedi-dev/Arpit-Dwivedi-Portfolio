import { isLocalRef, type RefResolver } from './refs';
import { isObject } from './validator';

// Recursion guard for pathologically deep (but non-circular) schemas — separate from the
// visited-ref check below, which guards true cycles (A -> B -> A).
const MAX_DEPTH = 8;
// A schema-generated object sample is meant to be immediately readable, not an exhaustive
// fixture — cap how many properties get expanded so a schema with hundreds of fields doesn't
// produce an unreadable wall of JSON.
const MAX_OBJECT_PROPERTIES = 40;

const STRING_FORMAT_SAMPLES: Record<string, string> = {
  email: 'user@example.com',
  'idn-email': 'user@example.com',
  date: '2024-01-01',
  'date-time': '2024-01-01T00:00:00Z',
  time: '00:00:00Z',
  uuid: '00000000-0000-0000-0000-000000000000',
  uri: 'https://example.com',
  'uri-reference': '/example',
  url: 'https://example.com',
  hostname: 'example.com',
  ipv4: '192.0.2.1',
  ipv6: '::1',
  byte: 'ZXhhbXBsZQ==',
  password: '',
};

const sampleForString = (schema: Record<string, unknown>): string => {
  if (typeof schema.format === 'string' && schema.format in STRING_FORMAT_SAMPLES) return STRING_FORMAT_SAMPLES[schema.format];
  return '';
};

/** Merges the `properties` (and `required`) of every subschema in an `allOf` list into one
 *  synthetic object schema — the common case is composing a base schema with an extension, and
 *  treating them as one flat object produces a far more useful sample than only expanding the
 *  first branch. Subschemas that aren't plain objects (e.g. an unresolved remote $ref) are
 *  skipped rather than failing the whole merge. */
const mergeAllOf = (subschemas: unknown[], resolve: RefResolver): Record<string, unknown> => {
  const merged: Record<string, unknown> = { type: 'object', properties: {}, required: [] };
  const properties = merged.properties as Record<string, unknown>;
  const required = merged.required as unknown[];
  for (const sub of subschemas) {
    const resolved = isLocalRef((sub as Record<string, unknown> | null)?.$ref) ? resolve((sub as Record<string, unknown>).$ref as string) : sub;
    if (!isObject(resolved)) continue;
    if (isObject(resolved.properties)) Object.assign(properties, resolved.properties);
    if (Array.isArray(resolved.required)) required.push(...resolved.required);
    if (typeof resolved.type === 'string' && merged.type === 'object') merged.type = resolved.type;
  }
  return merged;
};

/** Pure JSON-Schema/OpenAPI-schema → example-value generator (PART 15). Deterministic — never
 *  random — and safe against both deep nesting and genuine circular `$ref` cycles (e.g.
 *  `User.children[] -> User`), which it stops expanding via `visited` rather than recursing
 *  forever (PART 20). `example`/`default`/`enum` on any (sub)schema always win over a generated
 *  value, per the priority in PART 16. */
export const generateSchemaSample = (
  schema: unknown,
  resolve: RefResolver,
  visited: Set<string> = new Set(),
  depth = 0,
): unknown => {
  if (depth > MAX_DEPTH || !isObject(schema)) return null;

  if (typeof schema.$ref === 'string') {
    if (!isLocalRef(schema.$ref) || visited.has(schema.$ref)) return null;
    const resolved = resolve(schema.$ref);
    if (!isObject(resolved)) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(schema.$ref);
    return generateSchemaSample(resolved, resolve, nextVisited, depth + 1);
  }

  if ('example' in schema) return schema.example;
  // JSON Schema 2020-12 (used by OpenAPI 3.1) puts an array of sample values directly on the
  // schema — distinct from the Parameter/MediaType-level `examples` map handled in operationConverter.
  if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
  if ('default' in schema) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return generateSchemaSample(mergeAllOf(schema.allOf, resolve), resolve, visited, depth + 1);
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return generateSchemaSample(schema.oneOf[0], resolve, visited, depth + 1);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return generateSchemaSample(schema.anyOf[0], resolve, visited, depth + 1);
  }

  // OpenAPI 3.1 allows `type` to be an array (e.g. `["string", "null"]`, JSON Schema style,
  // covering the same case 3.0's `nullable: true` covers). Either way, a real typed sample is
  // more useful to edit than a literal `null` — see PART 15's "immediately understandable/editable".
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type;

  switch (type) {
    case 'object': {
      if (!isObject(schema.properties)) return {};
      const result: Record<string, unknown> = {};
      const entries = Object.entries(schema.properties).slice(0, MAX_OBJECT_PROPERTIES);
      for (const [key, propSchema] of entries) {
        result[key] = generateSchemaSample(propSchema, resolve, visited, depth + 1);
      }
      return result;
    }
    case 'array': {
      if (!('items' in schema)) return [];
      return [generateSchemaSample(schema.items, resolve, visited, depth + 1)];
    }
    case 'string':
      return sampleForString(schema);
    case 'integer':
      return typeof schema.minimum === 'number' ? schema.minimum : 0;
    case 'number':
      return typeof schema.minimum === 'number' ? schema.minimum : 0;
    case 'boolean':
      return true;
    default:
      // No declared/resolvable type — infer from shape so an untyped-but-structured schema
      // (common in hand-written specs) still produces something useful rather than `null`.
      if (isObject(schema.properties)) return generateSchemaSample({ ...schema, type: 'object' }, resolve, visited, depth);
      if ('items' in schema) return generateSchemaSample({ ...schema, type: 'array' }, resolve, visited, depth);
      return null;
  }
};
