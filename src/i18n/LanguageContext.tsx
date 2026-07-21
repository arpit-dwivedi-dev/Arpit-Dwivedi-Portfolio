import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import metadata from '../../metadata.json';
import { hiContent } from '../content/hi';
import type { SiteContent, Lang } from './types';

export type { SiteContent, Lang };

interface LanguageContextValue {
  lang: Lang;
  content: SiteContent;
  // Path (relative to the router basename) for the given language,
  // preserving the current page and hash — used by real <Link>s, never
  // an in-place content swap, so the browser announces a page change.
  toPath: (target: Lang) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const stripHiPrefix = (pathname: string) => {
  const stripped = pathname.replace(/^\/hi(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
};

// Absolute URL for a given (lang, pathname) pair, honoring the base path
// GitHub Pages serves this app from — used for the hreflang link tags.
const absoluteUrl = (target: Lang, basePathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
  return `${window.location.origin}${base}${path === '/' ? '/' : path}`;
};

const upsertAlternateLink = (hreflang: string, href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isHindi = location.pathname === '/hi' || location.pathname.startsWith('/hi/');
  const lang: Lang = isHindi ? 'hi' : 'en';

  const content = isHindi ? hiContent : metadata.content;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const basePathname = stripHiPrefix(location.pathname);
    upsertAlternateLink('en', absoluteUrl('en', basePathname));
    upsertAlternateLink('hi', absoluteUrl('hi', basePathname));
    upsertAlternateLink('x-default', absoluteUrl('en', basePathname));
  }, [location.pathname]);

  const toPath: LanguageContextValue['toPath'] = (target) => {
    const basePathname = stripHiPrefix(location.pathname);
    const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
    return `${path}${location.hash}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, content, toPath }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
