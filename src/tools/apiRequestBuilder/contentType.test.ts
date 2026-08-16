import { classifyContentType, defaultFilename, isSafeToPreviewAsImage, parseContentDispositionFilename, sanitizeFilename } from './contentType';

describe('classifyContentType', () => {
  it.each([
    ['application/json', 'json'],
    ['application/json; charset=utf-8', 'json'],
    ['application/problem+json', 'json'],
    ['application/vnd.api+json', 'json'],
    ['application/xml', 'xml'],
    ['text/xml', 'xml'],
    ['application/atom+xml', 'xml'],
    ['application/rss+xml', 'xml'],
    ['image/png', 'image'],
    ['image/jpeg', 'image'],
    ['image/gif', 'image'],
    ['image/webp', 'image'],
    ['image/avif', 'image'],
    ['image/svg+xml', 'image'],
    ['text/plain', 'text'],
    ['text/csv', 'text'],
    ['text/css', 'text'],
    ['application/javascript', 'text'],
    ['text/javascript', 'text'],
    ['text/html', 'html'],
    ['application/pdf', 'binary'],
    ['application/octet-stream', 'binary'],
    ['application/zip', 'binary'],
    ['font/woff2', 'binary'],
  ] as const)('classifies %s as %s', (contentType, expectedKind) => {
    expect(classifyContentType(contentType).kind).toBe(expectedKind);
  });

  it('falls back to text (not binary) when the header is missing entirely', () => {
    expect(classifyContentType(undefined).kind).toBe('text');
    expect(classifyContentType(null).kind).toBe('text');
    expect(classifyContentType('').kind).toBe('text');
  });

  it('treats an unrecognized content type as binary rather than guessing', () => {
    expect(classifyContentType('application/x-completely-made-up').kind).toBe('binary');
  });

  it('strips charset and other parameters before classifying', () => {
    expect(classifyContentType('text/html; charset=iso-8859-1').kind).toBe('html');
  });

  it('is case-insensitive on the mime type', () => {
    expect(classifyContentType('APPLICATION/JSON').kind).toBe('json');
  });

  it('exposes the stripped, lowercased mime type', () => {
    expect(classifyContentType('Application/JSON; charset=utf-8').mimeType).toBe('application/json');
  });
});

describe('isSafeToPreviewAsImage', () => {
  it('is true for ordinary bitmap types', () => {
    expect(isSafeToPreviewAsImage('image/png')).toBe(true);
    expect(isSafeToPreviewAsImage('image/jpeg')).toBe(true);
    expect(isSafeToPreviewAsImage('image/webp')).toBe(true);
  });

  it('is false for SVG, which can carry active content', () => {
    expect(isSafeToPreviewAsImage('image/svg+xml')).toBe(false);
  });

  it('is false for non-image types', () => {
    expect(isSafeToPreviewAsImage('application/pdf')).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('leaves an already-safe filename untouched', () => {
    expect(sanitizeFilename('report-2024.pdf')).toBe('report-2024.pdf');
  });

  it('strips path separators and keeps only the last segment', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('C:\\Windows\\System32\\evil.exe')).toBe('evil.exe');
  });

  it('replaces reserved/unsafe characters with underscores', () => {
    expect(sanitizeFilename('weird:name?.txt')).toBe('weird_name_.txt');
  });

  it('falls back to a default name when sanitizing leaves nothing usable', () => {
    expect(sanitizeFilename('...')).toBe('response');
    expect(sanitizeFilename('')).toBe('response');
  });
});

describe('parseContentDispositionFilename', () => {
  it('returns null when the header is missing', () => {
    expect(parseContentDispositionFilename(undefined)).toBeNull();
    expect(parseContentDispositionFilename(null)).toBeNull();
  });

  it('extracts a quoted filename', () => {
    expect(parseContentDispositionFilename('attachment; filename="report.pdf"')).toBe('report.pdf');
  });

  it('extracts an unquoted filename', () => {
    expect(parseContentDispositionFilename('attachment; filename=report.pdf')).toBe('report.pdf');
  });

  it('prefers the RFC 6266 UTF-8 extended form and decodes it', () => {
    const header = "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf";
    expect(parseContentDispositionFilename(header)).toBe('résumé.pdf');
  });

  it('sanitizes path separators embedded in a malicious filename', () => {
    expect(parseContentDispositionFilename('attachment; filename="../../etc/passwd"')).toBe('passwd');
  });

  it('returns null when no filename parameter is present', () => {
    expect(parseContentDispositionFilename('inline')).toBeNull();
  });
});

describe('defaultFilename', () => {
  it('picks a sensible extension per content kind', () => {
    expect(defaultFilename('json', 'application/json')).toBe('response.json');
    expect(defaultFilename('xml', 'application/xml')).toBe('response.xml');
    expect(defaultFilename('html', 'text/html')).toBe('response.html');
    expect(defaultFilename('text', 'text/plain')).toBe('response.txt');
    expect(defaultFilename('binary', 'application/pdf')).toBe('response.bin');
  });

  it('maps known image mime types to their extension', () => {
    expect(defaultFilename('image', 'image/png')).toBe('response.png');
    expect(defaultFilename('image', 'image/jpeg')).toBe('response.jpg');
    expect(defaultFilename('image', 'image/svg+xml')).toBe('response.svg');
  });
});
