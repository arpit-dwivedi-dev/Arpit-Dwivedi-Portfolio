import { createBlankRequest, createRow, type ApiRequest } from '../types';
import { generateCode, type CodeLanguage } from './index';

const LANGS: CodeLanguage[] = ['fetch', 'axios', 'node', 'python'];

const baseRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  ...createBlankRequest(),
  url: 'https://api.example.com/users',
  ...overrides,
});

describe('shared edge cases across every generator', () => {
  it.each(LANGS)('%s: never throws on a request with no headers configured at all', (lang) => {
    const code = generateCode(lang, baseRequest());
    expect(code.length).toBeGreaterThan(0);
  });

  it.each(LANGS)('%s: falls back to the raw body text when JSON is malformed, rather than breaking', (lang) => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'json', raw: '{not valid json', formFields: [] },
    });
    expect(() => generateCode(lang, request)).not.toThrow();
    expect(generateCode(lang, request)).toContain('not valid json');
  });

  it.each(LANGS)('%s: preserves a raw text body verbatim', (lang) => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'text', raw: 'hello\nworld', formFields: [] },
    });
    const code = generateCode(lang, request);
    expect(code).toContain('hello');
    expect(code).toContain('world');
  });

  it.each(LANGS)('%s: includes enabled form-urlencoded fields', (lang) => {
    const request = baseRequest({
      method: 'POST',
      body: { mode: 'form-urlencoded', raw: '', formFields: [{ ...createRow(), key: 'a', value: '1' }] },
    });
    const code = generateCode(lang, request);
    expect(code).toContain('a');
    expect(code).toContain('1');
  });

  it.each(LANGS)('%s: leaves an unknown variable as literal {{name}} when no environment is active', (lang) => {
    const request = baseRequest({ url: 'https://api.example.com/users/{{userId}}' });
    const code = generateCode(lang, request, {});
    expect(code).toContain('{{userId}}');
  });

  it.each(LANGS)('%s: resolves {{name}} to the active environment value, leaving no literal behind', (lang) => {
    const request = baseRequest({ url: 'https://{{baseUrl}}/users' });
    const code = generateCode(lang, request, { baseUrl: 'api.example.com' });
    expect(code).toContain('api.example.com');
    expect(code).not.toContain('{{baseUrl}}');
  });

  it.each(LANGS)('%s: never mutates the source ApiRequest object during generation', (lang) => {
    const request = baseRequest({ url: 'https://{{baseUrl}}/users' });
    const snapshot = JSON.parse(JSON.stringify(request));
    generateCode(lang, request, { baseUrl: 'api.example.com' });
    expect(JSON.parse(JSON.stringify(request))).toEqual(snapshot);
  });
});
