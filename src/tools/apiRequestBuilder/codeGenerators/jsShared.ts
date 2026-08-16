/** Prepends `spaces` spaces to every non-empty line of `text` — used to nest an already-formatted
 *  multi-line block (an object literal, a try body) inside another one, without every generator
 *  reimplementing its own indentation bookkeeping. Because it's flat (adds the same amount to every
 *  line regardless of that line's existing indentation), composing it is safe: a block's *relative*
 *  indentation survives being nested arbitrarily deep. */
export const indent = (text: string, spaces: number): string => {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
};

/** Renders a JS object literal for a header list, using JSON's quoting rules — valid JS syntax
 *  (double-quoted keys/strings) without needing a separate JS-literal serializer. */
export const jsHeadersLiteral = (headers: Array<[string, string]>): string => {
  if (headers.length === 0) return '{}';
  const inner = headers.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`).join('\n');
  return `{\n${inner}\n}`;
};

/** True when the request explicitly asks for a JSON response via an `Accept` header — the only
 *  pre-send signal available, since code generation happens before any response exists. Used to
 *  decide between `response.json()` and the safer `response.text()` default. */
export const wantsJsonResponse = (headers: Array<[string, string]>): boolean =>
  headers.some(([key, value]) => key.toLowerCase() === 'accept' && value.toLowerCase().includes('json'));
