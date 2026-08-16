import { findDynamicVariableNames, mergePostmanVariables } from './variables';

describe('findDynamicVariableNames', () => {
  it('detects {{$randomUUID}} and {{$timestamp}}', () => {
    expect(findDynamicVariableNames('id={{$randomUUID}}&ts={{$timestamp}}')).toEqual(['randomUUID', 'timestamp']);
  });

  it('does not flag a normal {{variable}}', () => {
    expect(findDynamicVariableNames('{{baseUrl}}/users/{{userId}}')).toEqual([]);
  });

  it('dedupes repeated dynamic variables', () => {
    expect(findDynamicVariableNames('{{$guid}}-{{$guid}}')).toEqual(['guid']);
  });

  it('returns nothing for empty input', () => {
    expect(findDynamicVariableNames('')).toEqual([]);
  });
});

describe('mergePostmanVariables', () => {
  it('parses a single scope', () => {
    const result = mergePostmanVariables([{ key: 'baseUrl', value: 'https://httpbin.org' }]);
    expect(result).toEqual([{ key: 'baseUrl', value: 'https://httpbin.org', redacted: false }]);
  });

  it('later scopes override earlier ones by key (folder overrides collection, request overrides folder)', () => {
    const collectionScope = [{ key: 'env', value: 'collection' }];
    const folderScope = [{ key: 'env', value: 'folder' }];
    const requestScope = [{ key: 'env', value: 'request' }];
    const result = mergePostmanVariables(collectionScope, folderScope, requestScope);
    expect(result).toEqual([{ key: 'env', value: 'request', redacted: false }]);
  });

  it('preserves a value that is itself a {{variable}} template, even under a secret-shaped key', () => {
    const result = mergePostmanVariables([{ key: 'token', value: '{{externalToken}}' }]);
    expect(result).toEqual([{ key: 'token', value: '{{externalToken}}', redacted: false }]);
  });

  it('redacts a literal value under a secret-shaped key rather than persisting it', () => {
    const result = mergePostmanVariables([{ key: 'apiSecret', value: 'sk_live_abc123' }]);
    expect(result).toEqual([{ key: 'apiSecret', value: '', redacted: true }]);
  });

  it('keeps a non-secret literal default value (e.g. baseUrl) as-is', () => {
    const result = mergePostmanVariables([{ key: 'baseUrl', value: 'https://httpbin.org' }]);
    expect(result[0].redacted).toBe(false);
    expect(result[0].value).toBe('https://httpbin.org');
  });

  it('ignores malformed entries and non-array scopes', () => {
    const result = mergePostmanVariables([{ notAKey: true }], null as unknown as unknown[], [{ key: 'ok', value: '1' }]);
    expect(result).toEqual([{ key: 'ok', value: '1', redacted: false }]);
  });
});
