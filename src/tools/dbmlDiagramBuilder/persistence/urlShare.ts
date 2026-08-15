import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const SHARE_PARAM = 'schema';
/** Soft ceiling on the compressed payload — most browsers/CDNs accept URLs
 *  well past this, but very old proxies start truncating around 8k chars. */
export const SHARE_URL_WARN_LENGTH = 6000;

export function buildShareUrl(dbml: string): { url: string; length: number; tooLong: boolean } {
  const compressed = compressToEncodedURIComponent(dbml);
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.set(SHARE_PARAM, compressed);
  const full = url.toString();
  return { url: full, length: compressed.length, tooLong: compressed.length > SHARE_URL_WARN_LENGTH };
}

export function readSharedSchemaFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get(SHARE_PARAM);
    if (!compressed) return null;
    const dbml = decompressFromEncodedURIComponent(compressed);
    return dbml || null;
  } catch {
    return null;
  }
}

export function clearShareParamFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(SHARE_PARAM)) return;
    url.searchParams.delete(SHARE_PARAM);
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}
