import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import metadata from '../../metadata.json';
import { getGuideBySlug } from '../content/guides/data';
import { getGuideCategory } from '../content/guides/categories';
import type { SiteContent } from './types';
// Route metadata lives in ./routeMeta (pure data, no React) so it's
// unit-testable without pulling in JSX or this provider's effects.
import { ROUTE_META, ROUTE_KEY_BY_PATH, type RouteKey } from './routeMeta';

export type { SiteContent };

// The site was bilingual (English + a /hi Hindi mirror) until the Hindi
// content was retired; see the HindiRedirect route in App.tsx. What's left
// here is the single-language content provider plus the per-route <head>
// injection that used to be language-aware — the names are kept as-is to
// avoid a rename touching every consuming page for no behavior change.
interface LanguageContextValue {
  content: SiteContent;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Fixed production origin rather than window.location.origin — this file
// also runs during the build-time prerender pass (see scripts/prerender.mjs),
// where the page is served from http://localhost, and canonical tags baked
// into the static HTML must point at the real domain regardless of where
// they were generated. Matches the domain hardcoded in index.html,
// public/sitemap.xml, and the JSON-LD graph.
const SITE_ORIGIN = 'https://101techlabs.com';

// Absolute URL for a pathname, honoring the base path GitHub Pages serves
// this app from — used for the canonical link tag.
const absoluteUrl = (pathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${SITE_ORIGIN}${base}${pathname === '/' ? '/' : pathname}`;
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

const upsertMetaByName = (name: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertMetaByProperty = (property: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  // Cast needed for `projects[].status`: SiteContent narrows it to the
  // literal 'demo' (see types.ts), but a plain JSON import only infers
  // `string` — the runtime value is correct, TS just can't prove the
  // literal narrowing through metadata.json.
  const content = metadata.content as SiteContent;

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  useEffect(() => {
    const { pathname } = location;

    // Any stale hreflang alternates left in a prerendered snapshot from the
    // bilingual era would now point at redirect-only URLs — drop them.
    document.head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((link) => link.remove());

    const routeKey: RouteKey = ROUTE_KEY_BY_PATH[pathname] ?? 'home';
    // Guide slugs are dynamic (/guides/:slug, /guides/:category/:slug) so
    // they can't live in the static map above — look the specific item up
    // and override the generic "guides" meta with its title/description
    // when one matches. The legacy single-segment
    // /guides/:slug shape is shared by category pages (/guides/invoicing)
    // and old flat article URLs (/guides/how-to-make-an-invoice) — see
    // GuideOrCategoryPage for the render-time resolution; category wins the
    // same way here. The canonical two-segment /guides/:category/:slug shape
    // only matches when the guide's own category agrees with the URL
    // segment, same validation GuidePage does, so a mismatched combination
    // (e.g. /guides/qr-code/how-to-make-an-invoice) falls through to the
    // generic "guides" meta rather than describing the wrong article.
    const guideSegments = pathname.startsWith('/guides/')
      ? pathname.slice('/guides/'.length).split('/')
      : undefined;
    const categoryMatch =
      guideSegments?.length === 1 ? getGuideCategory(guideSegments[0]) : undefined;
    const legacyGuideMatch =
      guideSegments?.length === 1 && !categoryMatch ? getGuideBySlug(guideSegments[0]) : undefined;
    const canonicalGuideMatch =
      guideSegments?.length === 2
        ? (() => {
            const [categorySlug, articleSlug] = guideSegments;
            const guide = getGuideBySlug(articleSlug);
            return guide && guide.category === categorySlug ? guide : undefined;
          })()
        : undefined;
    const guideMatch = legacyGuideMatch ?? canonicalGuideMatch;
    const meta = categoryMatch
      ? { title: `${categoryMatch.title} Guides | 101 Tech Labs`, description: categoryMatch.description }
      : guideMatch
        ? { title: `${guideMatch.title} | 101 Tech Labs`, description: guideMatch.description }
        : ROUTE_META[routeKey];
    const canonicalHref = absoluteUrl(pathname);

    document.title = meta.title;
    upsertCanonical(canonicalHref);
    upsertMetaByName('description', meta.description);
    upsertMetaByProperty('og:title', meta.title);
    upsertMetaByProperty('og:description', meta.description);
    upsertMetaByProperty('og:url', canonicalHref);
    upsertMetaByName('twitter:title', meta.title);
    upsertMetaByName('twitter:description', meta.description);
  }, [location.pathname]);

  return <LanguageContext.Provider value={{ content }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
