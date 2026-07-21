import { getSanityClient } from './client';
import { delocalize } from './delocalize';
import type { SiteContent } from '../i18n/types';

export interface LocalizedSiteContent {
  en: SiteContent;
  hi: SiteContent;
}

// Module-level cache so every consumer (and every re-render of LanguageProvider
// across route changes) shares one in-flight request instead of re-fetching.
let cached: Promise<LocalizedSiteContent | null> | null = null;

const QUERY = `*[_type == "siteContent"][0]`;

export const fetchSiteContent = (): Promise<LocalizedSiteContent | null> => {
  if (!cached) {
    cached = getSanityClient()
      .then((client) => client.fetch(QUERY))
      .then((doc) => {
        if (!doc) return null;
        return {
          en: delocalize<SiteContent>(doc, 'en'),
          hi: delocalize<SiteContent>(doc, 'hi'),
        };
      })
      .catch((err) => {
        console.error('[sanity] Failed to fetch site content, falling back to bundled content.', err);
        return null;
      });
  }
  return cached;
};
