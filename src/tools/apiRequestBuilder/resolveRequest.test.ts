import { createRow, type RequestHeader } from './types';
import { hasEnabledCookieHeader } from './resolveRequest';

const cookieHeader = (overrides: Partial<RequestHeader> = {}): RequestHeader => ({
  ...createRow(),
  key: 'Cookie',
  value: 'session=abc123',
  enabled: true,
  ...overrides,
});

describe('hasEnabledCookieHeader', () => {
  it('is true when an enabled, non-empty Cookie header is present', () => {
    expect(hasEnabledCookieHeader([cookieHeader()])).toBe(true);
  });

  it('is case-insensitive on the header name', () => {
    expect(hasEnabledCookieHeader([cookieHeader({ key: 'cOOkie' })])).toBe(true);
  });

  it('is false when no headers are present', () => {
    expect(hasEnabledCookieHeader([])).toBe(false);
  });

  it('is false when the only Cookie header is disabled', () => {
    expect(hasEnabledCookieHeader([cookieHeader({ enabled: false })])).toBe(false);
  });

  it('is false when the Cookie header has an empty value', () => {
    expect(hasEnabledCookieHeader([cookieHeader({ value: '' })])).toBe(false);
  });

  it('is false when there are only unrelated headers', () => {
    expect(hasEnabledCookieHeader([{ ...createRow(), key: 'Content-Type', value: 'application/json', enabled: true }])).toBe(
      false,
    );
  });

  it('is a pure check — it never mutates the headers it inspects', () => {
    const headers = [cookieHeader()];
    const snapshot = JSON.parse(JSON.stringify(headers));
    hasEnabledCookieHeader(headers);
    expect(headers).toEqual(snapshot);
  });
});
