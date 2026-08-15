export type TokenType =
  | 'ident'
  | 'string'
  | 'number'
  | 'symbol'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  /** Character offset of the token's first char in the original source. */
  start: number;
  /** Character offset just past the token's last char. Includes any quotes. */
  end: number;
}

const SYMBOLS = ['{', '}', '[', ']', '(', ')', ':', ',', '.', '>', '<', '-'];

/**
 * Hand-rolled tokenizer for the DBML subset this app supports. Strips
 * comments up front so string/brace matching never has to special-case them,
 * then walks the source char-by-char rather than splitting on lines — DBML
 * blocks and refs routinely span or share lines, and column defaults/notes
 * can contain characters (":", "-") that collide with our symbol tokens.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  const len = source.length;

  const peek = (offset = 0) => source[i + offset];

  while (i < len) {
    const ch = source[i];
    // Every branch below advances `i` past the whole token before pushing, so
    // one capture here gives each token an exact source range. Source-editing
    // helpers (e.g. renaming a table in place) splice on these offsets, which
    // is what keeps user comments and formatting untouched.
    const tokenStart = i;

    if (ch === '\n') {
      line++;
      i++;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }

    // Line comment
    if (ch === '/' && peek(1) === '/') {
      while (i < len && source[i] !== '\n') i++;
      continue;
    }

    // Block comment
    if (ch === '/' && peek(1) === '*') {
      i += 2;
      while (i < len && !(source[i] === '*' && peek(1) === '/')) {
        if (source[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }

    // Triple-quoted multiline string/note
    if (ch === "'" && peek(1) === "'" && peek(2) === "'") {
      const startLine = line;
      i += 3;
      let value = '';
      while (i < len && !(source[i] === "'" && peek(1) === "'" && peek(2) === "'")) {
        if (source[i] === '\n') line++;
        value += source[i];
        i++;
      }
      i += 3;
      tokens.push({ type: 'string', value: value.trim(), line: startLine, start: tokenStart, end: i });
      continue;
    }

    // Single/double quoted string
    if (ch === "'" || ch === '"') {
      const quote = ch;
      const startLine = line;
      i++;
      let value = '';
      while (i < len && source[i] !== quote) {
        if (source[i] === '\\' && peek(1) === quote) {
          value += quote;
          i += 2;
          continue;
        }
        if (source[i] === '\n') line++;
        value += source[i];
        i++;
      }
      i++;
      tokens.push({ type: 'string', value, line: startLine, start: tokenStart, end: i });
      continue;
    }

    // Backtick-quoted expression (DBML default: `expr`) — treat like a string
    if (ch === '`') {
      const startLine = line;
      i++;
      let value = '';
      while (i < len && source[i] !== '`') {
        value += source[i];
        i++;
      }
      i++;
      tokens.push({ type: 'string', value, line: startLine, start: tokenStart, end: i });
      continue;
    }

    // Number (integer/decimal, optionally negative)
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(peek(1) ?? ''))) {
      const startLine = line;
      let value = ch;
      i++;
      while (i < len && /[0-9.]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({ type: 'number', value, line: startLine, start: tokenStart, end: i });
      continue;
    }

    // Multi-char symbol: <> for many-to-many
    if (ch === '<' && peek(1) === '>') {
      tokens.push({ type: 'symbol', value: '<>', line, start: tokenStart, end: i + 2 });
      i += 2;
      continue;
    }

    if (SYMBOLS.includes(ch)) {
      tokens.push({ type: 'symbol', value: ch, line, start: tokenStart, end: i + 1 });
      i++;
      continue;
    }

    // Identifier / keyword: letters, digits, underscore, $ (allows things like $type)
    if (/[A-Za-z_$#]/.test(ch)) {
      const startLine = line;
      let value = ch;
      i++;
      while (i < len && /[A-Za-z0-9_$#]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({ type: 'ident', value, line: startLine, start: tokenStart, end: i });
      continue;
    }

    // Unknown character — skip it silently, the parser will surface a
    // warning if it results in something unparsable.
    i++;
  }

  tokens.push({ type: 'eof', value: '', line, start: len, end: len });
  return tokens;
}
