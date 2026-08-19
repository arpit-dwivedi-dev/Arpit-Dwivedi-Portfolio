// Single source of truth for which application routes (see ../App.tsx) are
// public, indexable content — and where each one's data comes from. Both
// scripts/generate-sitemap.mjs and scripts/prerender.mjs import this module
// (via tsx, the same way they already import src/content/guides/data.ts)
// instead of one deriving its route list from the other's output. That was
// the actual bug this file fixes: prerender.mjs used to read
// public/sitemap.xml to decide what to snapshot, so a route present in
// App.tsx but missing from the hand-maintained sitemap silently never got a
// static HTML file and 404'd on GitHub Pages.
//
// This module does NOT duplicate App.tsx's rendering — it only classifies
// which of App.tsx's routes are indexable, and pulls their metadata
// (lastmod, priority, changefreq) from a small hand-maintained list for
// static pages, plus the same data modules the pages themselves render from
// (src/tools/registry.ts, src/content/guides/*, src/content/blog/data.ts)
// for everything that multiplies.
//
// Route classes (Task 3's must-index policy, encoded as data + filters
// rather than a separate prose list so it can't drift from what actually
// renders):
//   - indexable public routes    → STATIC_ROUTES + tool/category/guide/blog
//                                   generators below (all reachable from
//                                   getIndexableRoutes)
//   - non-indexable utility routes → getExcludedRoutes(): QR redirect,
//                                   legacy /free-tools redirects, hidden
//                                   tools
//   - client-only redirect routes  → same getExcludedRoutes() list (QR
//                                   redirect, legacy redirects) — these are
//                                   Navigate/window.location targets, not
//                                   content pages, and were never meant to
//                                   be indexed or prerendered as content
//   - dynamic content routes       → tool/category pages (from
//                                   src/tools/registry.ts), guide
//                                   categories/articles (from
//                                   src/content/guides/*), blog posts (from
//                                   src/content/blog/data.ts)
import { isEnglishOnlyPath } from '../i18n/routeMeta';
import { TOOL_CATEGORIES, TOOLS, getToolsByCategory } from '../tools/registry';
import { guidePath, getGuideCategoriesWithCounts } from './guides/categories';
import { GUIDES } from './guides/data';
import { BLOG_POSTS } from './blog/data';

export const SITE_ORIGIN = 'https://101techlabs.com';

export type ChangeFreq = 'yearly' | 'monthly' | 'weekly' | 'daily';

export interface PublicRoute {
  /** Path with no origin, e.g. "/about". "/" for the homepage. */
  path: string;
  /** Hindi counterpart, when App.tsx defines one — see isEnglishOnlyPath. */
  hiPath?: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: number;
  /** Priority of hiPath's own <url> entry. Every bilingual pair in the
   *  hand-maintained sitemap this replaced used exactly priority - 0.1 for
   *  the Hindi entry — kept as a computed default so it can't drift out of
   *  that pattern; override only if a page genuinely needs a different one. */
  hiPriority?: number;
}

export interface ExcludedRoute {
  path: string;
  hiPath?: string;
  reason: string;
}

const hiPathFor = (path: string): string | undefined => {
  if (isEnglishOnlyPath(path)) return undefined;
  return path === '/' ? '/hi' : `/hi${path}`;
};

const withHi = (
  path: string,
  meta: { lastmod: string; changefreq: ChangeFreq; priority: number },
): PublicRoute => ({
  path,
  hiPath: hiPathFor(path),
  lastmod: meta.lastmod,
  changefreq: meta.changefreq,
  priority: meta.priority,
  hiPriority: hiPathFor(path) ? Math.round((meta.priority - 0.1) * 100) / 100 : undefined,
});

// ---- static pages ------------------------------------------------------
// Hand-maintained on purpose — these don't multiply. Add a new static page
// (About/Services/legal/tools hub/etc.) here directly when it ships; that
// addition alone is enough to make it indexable, sitemapped, and
// prerendered (see Task 6's validation script for the guardrail that
// catches a page shipped in App.tsx but forgotten here).
const STATIC_ROUTES: PublicRoute[] = [
  withHi('/', { lastmod: '2026-08-05', changefreq: 'weekly', priority: 1.0 }),
  withHi('/about', { lastmod: '2026-08-05', changefreq: 'monthly', priority: 0.7 }),
  withHi('/services', { lastmod: '2026-08-05', changefreq: 'monthly', priority: 0.8 }),
  withHi('/projects', { lastmod: '2026-08-05', changefreq: 'monthly', priority: 0.8 }),
  withHi('/contact', { lastmod: '2026-08-05', changefreq: 'yearly', priority: 0.6 }),
  withHi('/privacy-policy', { lastmod: '2026-08-05', changefreq: 'yearly', priority: 0.3 }),
  withHi('/terms', { lastmod: '2026-08-05', changefreq: 'yearly', priority: 0.3 }),
  withHi('/editorial-policy', { lastmod: '2026-08-05', changefreq: 'yearly', priority: 0.3 }),
  withHi('/tools', { lastmod: '2026-08-05', changefreq: 'weekly', priority: 0.9 }),
  withHi('/vcard-qr-code', { lastmod: '2026-08-17', changefreq: 'monthly', priority: 0.8 }),
  withHi('/menu-qr-code', { lastmod: '2026-08-17', changefreq: 'monthly', priority: 0.8 }),
  withHi('/wifi-qr-code', { lastmod: '2026-08-17', changefreq: 'monthly', priority: 0.8 }),
  withHi('/guides', { lastmod: '2026-08-05', changefreq: 'weekly', priority: 0.8 }),
  withHi('/blog', { lastmod: '2026-08-12', changefreq: 'weekly', priority: 0.8 }),
];

export const getStaticRoutes = (): PublicRoute[] => STATIC_ROUTES;

// ---- tool category pages (dynamic content route) ------------------------
// A category is only real, indexable content once it has at least one
// visible (non-hidden) tool in it — an empty category page (lead-generation
// today, with its one hidden tool; seo/ai/converters/validators/utilities
// with none yet) is a thin/empty page, same call the old hand-maintained
// sitemap already made. Encoding it as a filter on TOOLS/TOOL_CATEGORIES
// means a category can never silently drift onto or off the indexable list
// independent of whether it actually has content.
const CATEGORY_LASTMOD: Record<string, string> = {
  generators: '2026-08-05',
  developer: '2026-08-16',
};

export const getIndexableToolCategoryRoutes = (): PublicRoute[] =>
  TOOL_CATEGORIES.filter((category) => getToolsByCategory(category.slug).length > 0).map((category) => {
    const lastmod = CATEGORY_LASTMOD[category.slug];
    if (!lastmod) {
      throw new Error(
        `[siteRoutes] Tool category "${category.slug}" has visible tools but no CATEGORY_LASTMOD entry in src/content/siteRoutes.ts.`,
      );
    }
    return withHi(`/tools/${category.slug}`, { lastmod, changefreq: 'weekly', priority: 0.8 });
  });

// ---- individual tool pages (dynamic content route) -----------------------
// `hidden` tools (see ToolDefinition.hidden in src/tools/registry.ts) keep a
// live route for direct links but are deliberately excluded here — same
// rule ToolsPage/ToolCategoryPage already apply via getToolsByCategory.
const TOOL_LASTMOD: Record<string, string> = {
  'invoice-generator': '2026-08-05',
  'qr-code-generator': '2026-08-12',
  'api-request-builder': '2026-08-16',
  'dbml-diagram-builder': '2026-08-16',
};

export const getIndexableToolRoutes = (): PublicRoute[] =>
  TOOLS.filter((tool) => !tool.hidden).map((tool) => {
    const lastmod = TOOL_LASTMOD[tool.id];
    if (!lastmod) {
      throw new Error(`[siteRoutes] Tool "${tool.id}" has no TOOL_LASTMOD entry in src/content/siteRoutes.ts.`);
    }
    return withHi(`/tools/${tool.category}/${tool.path}`, { lastmod, changefreq: 'monthly', priority: 0.9 });
  });

// ---- guide categories + articles (dynamic content route) -----------------
// GUIDES/GUIDE_CATEGORIES/guidePath are already the single source of truth
// the app itself renders from (see src/content/guides/categories.ts) — this
// just re-exposes them in the same PublicRoute shape as everything else so
// the sitemap/prerender scripts have one interface to consume, not two.
export const getIndexableGuideCategoryRoutes = (): PublicRoute[] => {
  const categoriesWithCounts = getGuideCategoriesWithCounts(GUIDES);
  return categoriesWithCounts.map((category) => {
    const guidesInCategory = GUIDES.filter((guide) => guide.category === category.slug);
    const lastmod = guidesInCategory
      .map((guide) => guide.updatedDate)
      .sort()
      .at(-1)!;
    return { path: `/guides/${category.slug}`, lastmod, changefreq: 'weekly', priority: 0.75 };
  });
};

// Guides flagged noindex stay live and linkable (see GuidePage's robots-meta
// effect) but are excluded from the sitemap — a URL that's both listed and
// tagged noindex is a contradictory signal to crawlers. They still need a
// prerendered static file (see getNoindexPrerenderOnlyPaths below) so a
// direct link doesn't 404 on GitHub Pages.
export const getIndexableGuideArticleRoutes = (): PublicRoute[] =>
  GUIDES.filter((guide) => !guide.noindex).map((guide) => ({
    path: guidePath(guide),
    lastmod: guide.updatedDate,
    changefreq: 'monthly',
    priority: 0.7,
  }));

export const getNoindexPrerenderOnlyPaths = (): string[] =>
  GUIDES.filter((guide) => guide.noindex).map((guide) => guidePath(guide));

// ---- blog hub + posts (dynamic content route) -----------------------------
export const getIndexableBlogPostRoutes = (): PublicRoute[] =>
  BLOG_POSTS.map((post) => ({
    path: `/blog/${post.slug}`,
    lastmod: post.updatedDate,
    changefreq: 'monthly',
    priority: 0.7,
  }));

// ---- non-indexable utility / client-only redirect / hidden routes --------
// These exist as real App.tsx routes but must never appear in the sitemap
// or be treated as indexable content. Listed explicitly (rather than just
// "not in the registry") so scripts/validate-route-registry.mjs can tell
// "deliberately excluded" apart from "forgotten" when it diffs App.tsx's
// literal routes against this registry.
const HAND_MAINTAINED_EXCLUSIONS: ExcludedRoute[] = [
  {
    path: '/tools/generators/qr-code-generator/go',
    hiPath: '/hi/tools/generators/qr-code-generator/go',
    reason: 'Client-only smart-redirect target embedded in Multi-URL/App QR codes — not a content page (see QRRedirectPage, which sets its own noindex tag).',
  },
  {
    path: '/free-tools',
    hiPath: '/hi/free-tools',
    reason: 'Legacy redirect (Navigate) to /tools — see App.tsx.',
  },
  {
    path: '/free-tools/google-maps-scraper',
    hiPath: '/hi/free-tools/google-maps-scraper',
    reason: 'Legacy redirect (Navigate) to the Google Maps finder tool — see App.tsx.',
  },
];

const hiddenToolExclusions = (): ExcludedRoute[] =>
  TOOLS.filter((tool) => tool.hidden).map((tool) => {
    const path = `/tools/${tool.category}/${tool.path}`;
    return {
      path,
      hiPath: hiPathFor(path),
      reason: `Hidden tool (TOOLS['${tool.id}'].hidden in src/tools/registry.ts) — route stays live for direct links but is excluded from discovery and indexing.`,
    };
  });

export const getExcludedRoutes = (): ExcludedRoute[] => [...HAND_MAINTAINED_EXCLUSIONS, ...hiddenToolExclusions()];

// ---- aggregate views consumed by the sitemap/prerender/validation scripts
export const getIndexableRoutes = (): PublicRoute[] => [
  ...STATIC_ROUTES,
  ...getIndexableToolCategoryRoutes(),
  ...getIndexableToolRoutes(),
  ...getIndexableGuideCategoryRoutes(),
  ...getIndexableGuideArticleRoutes(),
  ...getIndexableBlogPostRoutes(),
];

/** Flat list of every indexable path, English and Hindi. */
export const getIndexablePaths = (): string[] =>
  getIndexableRoutes().flatMap((route) => (route.hiPath ? [route.path, route.hiPath] : [route.path]));

/** Every path that must receive a prerendered static HTML snapshot —
 *  indexable routes plus noindex-but-linkable guide articles. Redirect-only
 *  and hidden-tool routes are deliberately NOT included: they're not
 *  content, and GitHub Pages' 404.html (a copy of the SPA shell) already
 *  resolves them client-side for anyone with a direct link. */
export const getAllPrerenderPaths = (): string[] => [
  ...new Set([...getIndexablePaths(), ...getNoindexPrerenderOnlyPaths()]),
];
