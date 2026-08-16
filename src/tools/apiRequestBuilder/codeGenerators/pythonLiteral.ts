const PY_INDENT = '    ';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Renders a JSON-parsed value as a Python literal — the one axis where Python's syntax actually
 *  diverges from JSON (True/False/None instead of true/false/null); strings/numbers/nesting reuse
 *  JSON.stringify's quoting, which is valid Python too. Used for the `json=` kwarg so generated
 *  code reads like a hand-written Python dict rather than an embedded JSON string. */
export const toPythonLiteral = (value: unknown, depth = 0): string => {
  if (value === null) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = value
      .map((item) => `${PY_INDENT.repeat(depth + 1)}${toPythonLiteral(item, depth + 1)}`)
      .join(',\n');
    return `[\n${inner},\n${PY_INDENT.repeat(depth)}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const inner = keys
      .map((key) => `${PY_INDENT.repeat(depth + 1)}${JSON.stringify(key)}: ${toPythonLiteral(value[key], depth + 1)}`)
      .join(',\n');
    return `{\n${inner},\n${PY_INDENT.repeat(depth)}}`;
  }

  return 'None';
};
