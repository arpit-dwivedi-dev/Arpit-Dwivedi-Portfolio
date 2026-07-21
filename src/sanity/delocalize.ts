import type { Lang } from '../i18n/types';

// Every localized field in the Sanity schema (localeString/localeText) is
// stored as exactly {en: string, hi: string} — walk the fetched document and
// collapse each of those down to a single string for the given language,
// leaving everything else (plain strings, numbers, booleans, arrays) as-is.
export const delocalize = <T,>(node: unknown, lang: Lang): T => {
  if (Array.isArray(node)) {
    return node.map((item) => delocalize(item, lang)) as unknown as T;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => !k.startsWith('_'));
    const isLocalePair = keys.length === 2 && keys.includes('en') && keys.includes('hi')
      && typeof obj.en === 'string' && typeof obj.hi === 'string';
    if (isLocalePair) {
      return obj[lang] as unknown as T;
    }
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = delocalize(obj[key], lang);
    }
    return result as unknown as T;
  }
  return node as T;
};
