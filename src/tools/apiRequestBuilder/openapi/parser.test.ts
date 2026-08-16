import { MAX_OPENAPI_IMPORT_BYTES, parseOpenApiText } from './parser';

describe('parseOpenApiText', () => {
  it('parses valid JSON', () => {
    const result = parseOpenApiText('{"openapi":"3.0.0","paths":{}}');
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ openapi: '3.0.0', paths: {} });
  });

  it('parses valid YAML', () => {
    const result = parseOpenApiText('openapi: 3.0.0\npaths: {}\n');
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ openapi: '3.0.0', paths: {} });
  });

  it('parses YAML with nested block structure', () => {
    const yaml = `
openapi: 3.0.3
info:
  title: Test API
  version: "1.0"
paths:
  /users:
    get:
      summary: List users
`;
    const result = parseOpenApiText(yaml);
    expect(result.ok).toBe(true);
    expect((result.value as { info: { title: string } }).info.title).toBe('Test API');
  });

  it('does not trust the caller to say which format it is — a JSON-looking file that is invalid JSON but valid YAML still parses', () => {
    // Trailing comma makes this invalid JSON, but flow-style YAML happily accepts it as a mapping.
    const result = parseOpenApiText('{"openapi": "3.0.0", "paths": {},}');
    expect(result.ok).toBe(true);
  });

  it('rejects malformed JSON/YAML with a concise error', () => {
    const result = parseOpenApiText('{ this is not valid: [');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects malformed YAML (bad indentation)', () => {
    const result = parseOpenApiText('openapi: 3.0.0\n  paths:\nbad indent here: [oops\n');
    expect(result.ok).toBe(false);
  });

  it('rejects an empty file', () => {
    const result = parseOpenApiText('   \n  ');
    expect(result.ok).toBe(false);
  });

  it('rejects a file over the size limit', () => {
    const huge = 'x'.repeat(MAX_OPENAPI_IMPORT_BYTES + 1);
    const result = parseOpenApiText(huge);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it('never throws on hostile YAML alias/anchor bombs', () => {
    const bomb = `
a: &a ["x","x","x","x","x","x","x","x","x"]
b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]
c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]
d: [*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c,*c]
`;
    expect(() => parseOpenApiText(bomb)).not.toThrow();
  });
});
