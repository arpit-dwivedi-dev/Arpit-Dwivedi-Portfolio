import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import metadata from '../../metadata.json';
import { hiContent } from '../content/hi';
import { getGuideBySlug } from '../content/guides/data';
import { getGuideCategory } from '../content/guides/categories';
import { getBlogPostBySlug } from '../content/blog/data';
import type { SiteContent, Lang } from './types';
// Route metadata lives in ./routeMeta (pure data, no React) so it's
// unit-testable without pulling in JSX or this provider's effects.
import { ROUTE_META, ROUTE_KEY_BY_PATH, isEnglishOnlyPath, resolveLanguagePath, type RouteKey } from './routeMeta';

export type { SiteContent, Lang };

interface LanguageContextValue {
  lang: Lang;
  content: SiteContent;
  // Path (relative to the router basename) for the given language,
  // preserving the current page and hash — used by real <Link>s, never
  // an in-place content swap, so the browser announces a page change.
  toPath: (target: Lang) => string;
  // True on routes with no /hi/... counterpart (see isEnglishOnlyPath) —
  // LanguageSwitcher uses this to hide the Hindi option rather than link to
  // a route that doesn't exist.
  isEnglishOnly: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const stripHiPrefix = (pathname: string) => {
  const stripped = pathname.replace(/^\/hi(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
};

// Fixed production origin rather than window.location.origin — this file
// also runs during the build-time prerender pass (see scripts/prerender.mjs),
// where the page is served from http://localhost, and canonical/hreflang
// tags baked into the static HTML must point at the real domain regardless
// of where they were generated. Matches the domain hardcoded in index.html,
// public/sitemap.xml, and the JSON-LD graph.
const SITE_ORIGIN = 'https://101techlabs.com';

// Absolute URL for a given (lang, pathname) pair, honoring the base path
// GitHub Pages serves this app from — used for the hreflang link tags.
const absoluteUrl = (target: Lang, basePathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = target === 'hi' ? (basePathname === '/' ? '/hi' : `/hi${basePathname}`) : basePathname;
  return `${SITE_ORIGIN}${base}${path === '/' ? '/' : path}`;
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
  const isHindi = location.pathname === '/hi' || location.pathname.startsWith('/hi/');
  const lang: Lang = isHindi ? 'hi' : 'en';

  // Cast needed for `projects[].status`: SiteContent narrows it to the
  // literal 'demo' (see types.ts), but a plain JSON import only infers
  // `string` — the runtime value is correct, TS just can't prove the
  // literal narrowing through metadata.json.
  const content = isHindi ? hiContent : (metadata.content as SiteContent);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const basePathname = stripHiPrefix(location.pathname);
    upsertAlternateLink('en', absoluteUrl('en', basePathname));
    const hiLink = document.head.querySelector<HTMLLinkElement>('link[rel="alternate"][hreflang="hi"]');
    if (isEnglishOnlyPath(basePathname)) {
      // No /hi/... route exists for this page — emitting a Hindi alternate
      // would point search engines at a URL that doesn't resolve.
      hiLink?.remove();
    } else {
      upsertAlternateLink('hi', absoluteUrl('hi', basePathname));
    }
    upsertAlternateLink('x-default', absoluteUrl('en', basePathname));

    const routeKey: RouteKey = ROUTE_KEY_BY_PATH[basePathname] ?? 'home';
    // Guide/post slugs are dynamic (/guides/:slug, /guides/:category/:slug,
    // /blog/:slug) so they can't live in the static map above — look the
    // specific item up and override the generic "guides"/"blog" meta with
    // its title/description when one matches. The legacy single-segment
    // /guides/:slug shape is shared by category pages (/guides/invoicing)
    // and old flat article URLs (/guides/how-to-make-an-invoice) — see
    // GuideOrCategoryPage for the render-time resolution; category wins the
    // same way here. The canonical two-segment /guides/:category/:slug shape
    // only matches when the guide's own category agrees with the URL
    // segment, same validation GuidePage does, so a mismatched combination
    // (e.g. /guides/qr-code/how-to-make-an-invoice) falls through to the
    // generic "guides" meta rather than describing the wrong article.
    const guideSegments = basePathname.startsWith('/guides/')
      ? basePathname.slice('/guides/'.length).split('/')
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
    const blogMatch = basePathname.startsWith('/blog/') ? getBlogPostBySlug(basePathname.slice('/blog/'.length)) : undefined;
    const meta = categoryMatch
      ? { title: `${categoryMatch.title} Guides | 101 Tech Labs`, description: categoryMatch.description }
      : (guideMatch ?? blogMatch)
        ? { title: `${(guideMatch ?? blogMatch)!.title} | 101 Tech Labs`, description: (guideMatch ?? blogMatch)!.description }
        : ROUTE_META[lang][routeKey];
    const canonicalHref = absoluteUrl(lang, basePathname);

    document.title = meta.title;
    upsertCanonical(canonicalHref);
    upsertMetaByName('description', meta.description);
    upsertMetaByProperty('og:title', meta.title);
    upsertMetaByProperty('og:description', meta.description);
    upsertMetaByProperty('og:url', canonicalHref);
    upsertMetaByName('twitter:title', meta.title);
    upsertMetaByName('twitter:description', meta.description);
  }, [location.pathname, lang]);

  const toPath: LanguageContextValue['toPath'] = (target) =>
    resolveLanguagePath(stripHiPrefix(location.pathname), target, location.hash);

  const isEnglishOnly = isEnglishOnlyPath(stripHiPrefix(location.pathname));

  return (
    <LanguageContext.Provider value={{ lang, content, toPath, isEnglishOnly }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
