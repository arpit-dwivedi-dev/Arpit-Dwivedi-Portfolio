import { convertPostmanUrl } from './url';

describe('convertPostmanUrl', () => {
  it('accepts a plain string URL', () => {
    const result = convertPostmanUrl('https://api.example.com/users');
    expect(result.url).toBe('https://api.example.com/users');
    expect(result.params).toEqual([]);
  });

  it('splits query params out of a plain string URL', () => {
    const result = convertPostmanUrl('https://api.example.com/users?page=1&active=true');
    expect(result.url).toBe('https://api.example.com/users');
    expect(result.params.map((p) => [p.key, p.value])).toEqual([
      ['page', '1'],
      ['active', 'true'],
    ]);
    expect(result.params.every((p) => p.enabled)).toBe(true);
  });

  it('prefers `raw` on a structured URL object', () => {
    const result = convertPostmanUrl({ raw: 'https://api.example.com/users?page=1', host: ['api', 'example', 'com'], path: ['users'] });
    expect(result.url).toBe('https://api.example.com/users');
  });

  it('builds a raw URL from structured host/path when raw is absent', () => {
    const result = convertPostmanUrl({ protocol: 'https', host: ['api', 'example', 'com'], path: ['users', '5'] });
    expect(result.url).toBe('https://api.example.com/users/5');
  });

  it('uses the structured query array (not the raw query string) to preserve disabled params', () => {
    const result = convertPostmanUrl({
      raw: 'https://api.example.com/users?page=1',
      query: [
        { key: 'page', value: '1' },
        { key: 'limit', value: '10', disabled: true },
      ],
    });
    expect(result.params).toEqual([
      expect.objectContaining({ key: 'page', value: '1', enabled: true }),
      expect.objectContaining({ key: 'limit', value: '10', enabled: false }),
    ]);
  });

  it('converts Postman legacy `:name` path variables into {{name}} syntax', () => {
    const result = convertPostmanUrl('{{baseUrl}}/users/:userId/posts/:postId');
    expect(result.url).toBe('{{baseUrl}}/users/{{userId}}/posts/{{postId}}');
  });

  it('preserves {{variable}} templates untouched', () => {
    const result = convertPostmanUrl('{{baseUrl}}/anything/{{userId}}');
    expect(result.url).toBe('{{baseUrl}}/anything/{{userId}}');
  });

  it('returns an empty url for an unrecognized shape', () => {
    expect(convertPostmanUrl(42).url).toBe('');
    expect(convertPostmanUrl(undefined).url).toBe('');
  });
});
