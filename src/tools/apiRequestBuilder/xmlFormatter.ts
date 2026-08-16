/** Small hand-rolled XML parser + pretty-printer — no DOM dependency (DOMParser isn't available
 *  under the Jest `node` test environment, and pulling in jsdom or a real XML library is more
 *  weight than this feature needs). Mirrors the tokenizer/parser style already used by the DBML
 *  diagram builder tool elsewhere in this codebase. Validates structure (matching tags, single
 *  root, well-formed attributes) well enough to tell real XML from malformed input. */

type XmlNode = XmlElementNode | XmlTextNode | XmlCommentNode;

interface XmlElementNode {
  type: 'element';
  tag: string;
  attrs: Array<[string, string]>;
  children: XmlNode[];
}

interface XmlTextNode {
  type: 'text';
  value: string;
}

interface XmlCommentNode {
  type: 'comment';
  value: string;
}

// A flat shape rather than a `{ok:true;root}|{ok:false;error}` discriminated union: this project's
// tsconfig doesn't enable strictNullChecks, under which TS can't narrow a negated `!x.ok` check
// down to the right union member (verified against this exact tsconfig — see git history for the
// repro). Every caller here already guards on `.ok` before touching `.root`/`.error` anyway.
interface XmlParseResult {
  ok: boolean;
  root?: XmlElementNode;
  error?: string;
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === '#') {
      const codePoint = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[entity] ?? match;
  });

const encodeText = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const encodeAttrValue = (text: string): string => encodeText(text).replace(/"/g, '&quot;');

const TAG_PATTERN = /^<\s*([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)\s*>$/;
const ATTR_PATTERN = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
const CLOSE_TAG_PATTERN = /^<\/\s*([^\s>]+)\s*>$/;

const parseAttrs = (attrsRaw: string): Array<[string, string]> => {
  const attrs: Array<[string, string]> = [];
  let match: RegExpExecArray | null;
  ATTR_PATTERN.lastIndex = 0;
  while ((match = ATTR_PATTERN.exec(attrsRaw))) {
    const value = match[3] !== undefined ? match[3] : (match[4] ?? '');
    attrs.push([match[1], decodeEntities(value)]);
  }
  return attrs;
};

/** Parses `raw` into a single-root element tree, or reports why it isn't well-formed.
 *  Known limitation: CDATA sections aren't specially handled — `<` / `>` inside a CDATA block
 *  will be mis-tokenized like any other text, same as most lightweight (non-DOM) XML tokenizers. */
export const parseXml = (raw: string): XmlParseResult => {
  const withoutBom = raw.replace(/^\uFEFF/, '');
  if (withoutBom.trim() === '') return { ok: false, error: 'Empty XML document.' };

  const tokens = withoutBom.match(/<[^>]*>|[^<]+/g);
  if (!tokens) return { ok: false, error: 'No XML content found.' };

  const stack: XmlElementNode[] = [];
  let root: XmlElementNode | null = null;

  for (const token of tokens) {
    if (token.startsWith('<?')) continue; // XML declaration / processing instruction
    if (token.startsWith('<!--')) {
      if (!token.endsWith('-->')) return { ok: false, error: 'Unterminated comment.' };
      // Comments outside the root element are legal XML but have nowhere to attach — drop them.
      if (stack.length > 0) stack[stack.length - 1].children.push({ type: 'comment', value: token.slice(4, -3) });
      continue;
    }
    if (token.startsWith('<!')) continue; // DOCTYPE etc. — not meaningful for display purposes

    if (token.startsWith('</')) {
      const match = token.match(CLOSE_TAG_PATTERN);
      if (!match) return { ok: false, error: `Malformed closing tag: ${token}` };
      const tagName = match[1];
      const top = stack.pop();
      if (!top) return { ok: false, error: `Closing tag </${tagName}> has no matching open element.` };
      if (top.tag !== tagName) return { ok: false, error: `Mismatched closing tag — expected </${top.tag}> but found </${tagName}>.` };
      if (stack.length === 0) {
        if (root) return { ok: false, error: 'XML document has more than one root element.' };
        root = top;
      }
      continue;
    }

    if (token.startsWith('<')) {
      const match = token.match(TAG_PATTERN);
      if (!match) return { ok: false, error: `Malformed tag: ${token}` };
      const [, tagName, attrsRaw, selfClosingMark] = match;
      const node: XmlElementNode = { type: 'element', tag: tagName, attrs: parseAttrs(attrsRaw), children: [] };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else if (root) {
        // A prior top-level element already closed out into `root` — this one is a second root.
        return { ok: false, error: 'XML document has more than one root element.' };
      }

      if (selfClosingMark === '/') {
        if (stack.length === 0) root = node;
      } else {
        stack.push(node);
      }
      continue;
    }

    // Text token. Whitespace between/around top-level tags is normal formatting and ignored;
    // any other top-level text means this document has no single well-formed root.
    if (stack.length > 0) {
      stack[stack.length - 1].children.push({ type: 'text', value: decodeEntities(token) });
    } else if (token.trim() !== '') {
      return { ok: false, error: 'Content found outside the root element.' };
    }
  }

  if (stack.length > 0) return { ok: false, error: `Unclosed element <${stack[stack.length - 1].tag}>.` };
  if (!root) return { ok: false, error: 'No root element found.' };
  return { ok: true, root };
};

const INDENT = '  ';

const formatElement = (node: XmlElementNode, depth: number): string => {
  const indent = INDENT.repeat(depth);
  const attrsStr = node.attrs.map(([name, value]) => ` ${name}="${encodeAttrValue(value)}"`).join('');
  const meaningfulChildren = node.children.filter((child) => !(child.type === 'text' && child.value.trim() === ''));

  if (meaningfulChildren.length === 0) return `${indent}<${node.tag}${attrsStr} />`;

  if (meaningfulChildren.length === 1 && meaningfulChildren[0].type === 'text') {
    return `${indent}<${node.tag}${attrsStr}>${encodeText(meaningfulChildren[0].value.trim())}</${node.tag}>`;
  }

  const inner = meaningfulChildren
    .map((child) => {
      if (child.type === 'element') return formatElement(child, depth + 1);
      if (child.type === 'comment') return `${INDENT.repeat(depth + 1)}<!--${child.value}-->`;
      return `${INDENT.repeat(depth + 1)}${encodeText(child.value.trim())}`;
    })
    .join('\n');

  return `${indent}<${node.tag}${attrsStr}>\n${inner}\n${indent}</${node.tag}>`;
};

export interface XmlFormatResult {
  ok: boolean;
  formatted?: string;
  error?: string;
}

/** Parses and pretty-prints `raw` XML with two-space indentation. On malformed input, returns
 *  `ok: false` with a human-readable reason instead of throwing — callers fall back to a plain
 *  text view. */
export const formatXml = (raw: string): XmlFormatResult => {
  const parsed = parseXml(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, formatted: formatElement(parsed.root, 0) };
};
