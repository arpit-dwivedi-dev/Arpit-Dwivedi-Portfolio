import { MAX_POSTMAN_IMPORT_BYTES, parsePostmanText } from './parser';

describe('parsePostmanText', () => {
  it('parses valid JSON', () => {
    const result = parsePostmanText('{"info": {"name": "x"}}');
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ info: { name: 'x' } });
  });

  it('rejects malformed JSON without throwing', () => {
    const result = parsePostmanText('{ not valid json');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects empty input', () => {
    const result = parsePostmanText('   ');
    expect(result.ok).toBe(false);
  });

  it('rejects a file over the size limit before parsing', () => {
    const huge = `{"pad": "${'a'.repeat(MAX_POSTMAN_IMPORT_BYTES)}"}`;
    const result = parsePostmanText(huge);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });
});
