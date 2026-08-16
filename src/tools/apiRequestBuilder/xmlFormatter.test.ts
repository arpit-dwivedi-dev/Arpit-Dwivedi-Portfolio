import { formatXml } from './xmlFormatter';

describe('formatXml — valid documents', () => {
  it('formats a minimal single-element document', () => {
    const result = formatXml('<root>hello</root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>hello</root>');
  });

  it('indents nested elements', () => {
    const result = formatXml('<root><child>value</child></root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>\n  <child>value</child>\n</root>');
  });

  it('indents multiple levels of nesting', () => {
    const result = formatXml('<a><b><c>deep</c></b></a>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<a>\n  <b>\n    <c>deep</c>\n  </b>\n</a>');
  });

  it('preserves attributes on elements', () => {
    const result = formatXml('<user id="42" active="true">Ann</user>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<user id="42" active="true">Ann</user>');
  });

  it('formats self-closing elements', () => {
    const result = formatXml('<root><empty/></root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>\n  <empty />\n</root>');
  });

  it('formats self-closing elements with attributes', () => {
    const result = formatXml('<root><img src="a.png"/></root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>\n  <img src="a.png" />\n</root>');
  });

  it('formats siblings at the same level', () => {
    const result = formatXml('<root><a>1</a><b>2</b></root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>\n  <a>1</a>\n  <b>2</b>\n</root>');
  });

  it('ignores an XML declaration', () => {
    const result = formatXml('<?xml version="1.0" encoding="UTF-8"?><root>ok</root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>ok</root>');
  });

  it('decodes standard entities in text content', () => {
    const result = formatXml('<root>a &amp; b &lt; c</root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>a &amp; b &lt; c</root>');
  });

  it('tolerates surrounding whitespace between tags', () => {
    const result = formatXml('<root>\n  <a>1</a>\n</root>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe('<root>\n  <a>1</a>\n</root>');
  });
});

describe('formatXml — malformed documents', () => {
  it('rejects an empty string', () => {
    const result = formatXml('');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a whitespace-only string', () => {
    const result = formatXml('   \n  ');
    expect(result.ok).toBe(false);
  });

  it('rejects an unclosed element', () => {
    const result = formatXml('<root><child></root>');
    expect(result.ok).toBe(false);
  });

  it('rejects a mismatched closing tag', () => {
    const result = formatXml('<root><a></b></root>');
    expect(result.ok).toBe(false);
  });

  it('rejects a document with more than one root element', () => {
    const result = formatXml('<a/><b/>');
    expect(result.ok).toBe(false);
  });

  it('rejects plain non-XML text', () => {
    const result = formatXml('this is just plain text, not xml at all');
    expect(result.ok).toBe(false);
  });

  it('rejects a tag that is never closed at all', () => {
    const result = formatXml('<root>');
    expect(result.ok).toBe(false);
  });
});
