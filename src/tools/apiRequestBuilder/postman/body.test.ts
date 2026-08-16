import { convertPostmanBody } from './body';

describe('convertPostmanBody', () => {
  it('imports raw + options.raw.language=json + valid JSON as a json body', () => {
    const result = convertPostmanBody({ mode: 'raw', raw: '{"name":"pet"}', options: { raw: { language: 'json' } } });
    expect(result.body.mode).toBe('json');
    expect(result.body.raw).toBe('{"name":"pet"}');
    expect(result.warning).toBeNull();
  });

  it('falls back to text when language=json but the body is not valid JSON', () => {
    const result = convertPostmanBody({ mode: 'raw', raw: '{not valid', options: { raw: { language: 'json' } } });
    expect(result.body.mode).toBe('text');
    expect(result.body.raw).toBe('{not valid');
  });

  it('imports raw text when no language is declared', () => {
    const result = convertPostmanBody({ mode: 'raw', raw: 'plain text body' });
    expect(result.body.mode).toBe('text');
    expect(result.body.raw).toBe('plain text body');
  });

  it('maps urlencoded fields, preserving disabled state', () => {
    const result = convertPostmanBody({
      mode: 'urlencoded',
      urlencoded: [
        { key: 'a', value: '1' },
        { key: 'b', value: '2', disabled: true },
      ],
    });
    expect(result.body.mode).toBe('form-urlencoded');
    expect(result.body.formFields).toEqual([
      expect.objectContaining({ key: 'a', value: '1', enabled: true }),
      expect.objectContaining({ key: 'b', value: '2', enabled: false }),
    ]);
  });

  it('maps formdata text fields to multipart, and flags file fields with a warning instead of inventing content', () => {
    const result = convertPostmanBody({
      mode: 'formdata',
      formdata: [
        { key: 'title', value: 'hello', type: 'text' },
        { key: 'avatar', type: 'file', src: '/Users/me/avatar.png' },
      ],
    });
    expect(result.body.mode).toBe('multipart');
    expect(result.body.formFields).toEqual([
      expect.objectContaining({ key: 'title', value: 'hello' }),
      expect.objectContaining({ key: 'avatar', isFile: true, fileName: '/Users/me/avatar.png' }),
    ]);
    expect(result.body.formFields[0].isFile).toBeFalsy();
    expect(result.warning).toMatch(/re-selection/);
  });

  it('imports a graphql query as raw text with a warning, never as a runtime GraphQL body', () => {
    const result = convertPostmanBody({ mode: 'graphql', graphql: { query: 'query { pets { id } }', variables: '' } });
    expect(result.body.mode).toBe('text');
    expect(result.body.raw).toContain('query { pets { id } }');
    expect(result.warning).toMatch(/graphql/i);
  });

  it('skips a binary/file body without inventing content or a filesystem path', () => {
    const result = convertPostmanBody({ mode: 'file', file: { src: '/Users/me/payload.bin' } });
    expect(result.body.mode).toBe('none');
    expect(result.warning).toMatch(/binary/i);
  });

  it('returns an empty body for a missing/unrecognized body shape', () => {
    const result = convertPostmanBody(undefined);
    expect(result.body.mode).toBe('none');
    expect(result.warning).toBeNull();
  });
});
