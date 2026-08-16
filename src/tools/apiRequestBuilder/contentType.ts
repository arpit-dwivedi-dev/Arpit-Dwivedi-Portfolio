/** Pure content-type classification and filename helpers for the response viewer.
 *  No DOM/React dependencies — safe to unit test directly and reuse from requestExecutor. */

export type ResponseBodyKind = 'json' | 'xml' | 'html' | 'image' | 'text' | 'binary';

export interface ContentTypeInfo {
  kind: ResponseBodyKind;
  /** `type/subtype` only, lowercased, with any `;charset=...` parameters stripped. Empty string when the response had no Content-Type header at all. */
  mimeType: string;
}

const stripParameters = (contentType: string): string => contentType.split(';')[0]?.trim().toLowerCase() ?? '';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

/** SVG can carry `<script>`/event-handler content, so it is deliberately excluded from
 *  "safe to preview as an <img>" — see PART 13. Every other bitmap type is inert as an <img> source. */
export const isSafeToPreviewAsImage = (mimeType: string): boolean => mimeType.startsWith('image/') && mimeType !== 'image/svg+xml';

/** Classifies a response by its (already parameter-stripped) HTTP Content-Type header.
 *  Given no header at all, falls back to 'text' — a missing header is treated conservatively
 *  rather than guessed as binary, matching the pre-existing behavior of decoding every
 *  response as text. Callers that want JSON auto-detection without a header (e.g. an API that
 *  forgets to set Content-Type) should layer that on top of this classification, not inside it. */
export const classifyContentType = (contentType: string | undefined | null): ContentTypeInfo => {
  const mimeType = stripParameters(contentType ?? '');
  if (!mimeType) return { kind: 'text', mimeType: '' };

  if (mimeType === 'application/json' || mimeType.endsWith('+json')) return { kind: 'json', mimeType };

  if (mimeType === 'application/xml' || mimeType === 'text/xml' || mimeType.endsWith('+xml')) {
    // `image/svg+xml` is visual content first — classify it as an image, not XML text.
    if (mimeType.startsWith('image/')) return { kind: 'image', mimeType };
    return { kind: 'xml', mimeType };
  }

  if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') return { kind: 'html', mimeType };

  if (mimeType.startsWith('image/')) return { kind: 'image', mimeType };

  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/ecmascript' ||
    mimeType === 'application/x-javascript' ||
    mimeType === 'application/x-www-form-urlencoded'
  ) {
    return { kind: 'text', mimeType };
  }

  return { kind: 'binary', mimeType };
};

// Path separators, characters reserved/unsafe across common filesystems, and control chars —
// deliberately leaves spaces and hyphens untouched since those are safe and common in filenames.
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;

/** Strips path separators and other characters unsafe for an `<a download>` attribute or a
 *  filesystem save dialog. Never trusts a server-supplied name as-is. */
export const sanitizeFilename = (name: string): string => {
  const base = name.split(/[\\/]/).pop() ?? name;
  const cleaned = base.replace(UNSAFE_FILENAME_CHARS, '_').replace(/^\.+/, '').trim();
  return cleaned === '' ? 'response' : cleaned.slice(0, 200);
};

/** Extracts a filename from a raw `Content-Disposition` header value, preferring the RFC 6266
 *  `filename*=UTF-8''...` extended form over the plain `filename="..."` form when both are present.
 *  Returns the sanitized name, or null when nothing usable is present. */
export const parseContentDispositionFilename = (headerValue: string | undefined | null): string | null => {
  if (!headerValue) return null;

  const extended = headerValue.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/);
  if (extended) {
    try {
      const decoded = decodeURIComponent(extended[1].trim());
      return sanitizeFilename(decoded);
    } catch {
      // Malformed percent-encoding — fall through to the plain form below.
    }
  }

  const quoted = headerValue.match(/filename\s*=\s*"([^"]*)"/);
  if (quoted) return sanitizeFilename(quoted[1]);

  const bare = headerValue.match(/filename\s*=\s*([^;]+)/);
  if (bare) return sanitizeFilename(bare[1].trim());

  return null;
};

/** Sensible default filename by content kind, used when Content-Disposition is absent or unparseable. */
export const defaultFilename = (kind: ResponseBodyKind, mimeType: string): string => {
  switch (kind) {
    case 'json':
      return 'response.json';
    case 'xml':
      return 'response.xml';
    case 'html':
      return 'response.html';
    case 'image':
      return `response.${IMAGE_EXTENSIONS[mimeType] ?? 'img'}`;
    case 'binary':
      return 'response.bin';
    case 'text':
    default:
      return 'response.txt';
  }
};
