// Regenerates the /guides/{category} and /guides/{category}/{slug} <url>
// entries in public/sitemap.xml from src/content/guides/data.ts and
// src/content/guides/categories.ts — the single source of truth for both
// (article URLs go through the same guidePath() helper the app itself uses,
// so the sitemap can never drift from what the app actually renders).
// Every other <url> block (static pages, tool pages, blog posts, and the
// /guides hub itself) is left untouched: this script rereads
// public/sitemap.xml, keeps every block that ISN'T under /guides/<segment>,
// and reinserts freshly generated category + article blocks right after the
// /guides hub entry, so the file always matches GUIDES/GUIDE_CATEGORIES
// exactly. This also means the sitemap only ever contains the new
// canonical /guides/{category}/{slug} article URLs — the legacy flat
// /guides/{slug} shape is never written here, since it's a client-side
// redirect target, not a page that should be indexed or prerendered
// separately (see GuideOrCategoryPage.tsx).
//
// Runs as "prebuild" (see package.json), so the refreshed file exists
// before `vite build` copies public/ into dist/, and before
// scripts/prerender.mjs reads public/sitemap.xml to decide what to
// prerender.
//
// Why this exists: sitemap.xml used to be entirely hand-typed, and guides
// silently drifted out of sync with it — the same class of bug
// generate-rss.mjs's header comment describes for the QR Code Generator.
// Non-guide routes (tools, static pages, blog) stay hand-maintained for now;
// only guides/categories multiply fast enough to need this.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml');
const SITE_ORIGIN = 'https://101techlabs.com';

const { GUIDES } = await import(path.join(ROOT, 'src/content/guides/data.ts'));
const { GUIDE_CATEGORIES, guidePath } = await import(path.join(ROOT, 'src/content/guides/categories.ts'));

const existingXml = await readFile(SITEMAP_PATH, 'utf8');

const blocks = existingXml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
if (blocks.length === 0) {
  throw new Error(`No <url> blocks found in ${SITEMAP_PATH} — refusing to overwrite.`);
}

// Matches anything under the hub — both /guides/{category} and
// /guides/{category}/{slug}, plus any stale /guides/{slug} block a prior
// run left behind. The bare hub itself (/guides, no trailing slash) doesn't
// match this and stays in the hand-maintained seed below.
const GUIDES_SUBPATH_LOC_PREFIX = `<loc>${SITE_ORIGIN}/guides/`;

// Static pages, tool pages, blog, and the /guides hub — everything that
// isn't a category or article page under /guides. Hand-maintained: add a
// new tool/static route here directly when one ships.
const seedBlocks = blocks.filter((block) => !block.includes(GUIDES_SUBPATH_LOC_PREFIX));

const hubIndex = seedBlocks.findIndex((block) => block.includes(`<loc>${SITE_ORIGIN}/guides</loc>`));
if (hubIndex === -1) {
  throw new Error(`Could not find the /guides hub <url> block in ${SITEMAP_PATH} — refusing to overwrite.`);
}

const buildGuideBlock = (guide) => {
  const loc = `${SITE_ORIGIN}${guidePath(guide)}`;
  return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
    <lastmod>${guide.updatedDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
};

// Categories with zero guides are skipped — nothing to index yet, same rule
// the /guides hub's own category nav follows (see getGuideCategoriesWithCounts).
const buildCategoryBlock = (category, guidesInCategory) => {
  const loc = `${SITE_ORIGIN}/guides/${category.slug}`;
  const lastmod = guidesInCategory
    .map((guide) => guide.updatedDate)
    .sort()
    .at(-1);
  return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`;
};

const categoryBlocks = GUIDE_CATEGORIES.map((category) => {
  const guidesInCategory = GUIDES.filter((guide) => guide.category === category.slug);
  return guidesInCategory.length > 0 ? buildCategoryBlock(category, guidesInCategory) : null;
}).filter((block) => block !== null);

// Guides flagged noindex (see src/content/guides/types.ts) are kept as live,
// linkable pages but deliberately excluded here — a URL that's both listed
// in the sitemap and tagged noindex is a contradictory signal to crawlers.
const guideBlocks = GUIDES.filter((guide) => !guide.noindex).map(buildGuideBlock);

const allBlocks = [
  ...seedBlocks.slice(0, hubIndex + 1),
  ...categoryBlocks,
  ...guideBlocks,
  ...seedBlocks.slice(hubIndex + 1),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allBlocks.join('\n\n')}
</urlset>
`;

await writeFile(SITEMAP_PATH, xml);
console.log(
  `sitemap.xml generated: ${allBlocks.length} URLs (${seedBlocks.length} static/tool/blog + ${categoryBlocks.length} categories + ${guideBlocks.length} guides).`,
);
