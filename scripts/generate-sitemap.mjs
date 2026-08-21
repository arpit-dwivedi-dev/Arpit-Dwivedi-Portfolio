// Regenerates public/sitemap.xml entirely from src/content/siteRoutes.ts —
// the single shared route registry also consumed by scripts/prerender.mjs
// (see that file's header for why: sitemap.xml used to be the thing
// prerender.mjs read to decide what to snapshot, so a route present in
// App.tsx but missing from this hand-typed file silently never got a
// static HTML file and 404'd on GitHub Pages).
//
// This script has no route knowledge of its own — it only serializes
// whatever src/content/siteRoutes.ts#getIndexableRoutes() returns into XML.
// Static pages, tool/category pages, guides/categories, and blog posts are
// all sourced from that one registry (which itself pulls from
// src/tools/registry.ts, src/content/guides/*, and src/content/blog/data.ts
// — the same data the pages render from), so nothing is hand-duplicated
// here anymore.
//
// Runs as "prebuild" (see package.json), so the refreshed file exists
// before `vite build` copies public/ into dist/, and before
// scripts/prerender.mjs and scripts/validate-route-registry.mjs run.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml');

const { SITE_ORIGIN, getIndexableRoutes } = await import(path.join(ROOT, 'src/content/siteRoutes.ts'));

// Matches the sitemap's existing style of always showing at least one
// decimal place (1 -> "1.0") while preserving genuine two-decimal values
// (0.75) as-is.
const formatPriority = (priority) => (Number.isInteger(priority * 10) ? priority.toFixed(1) : String(priority));

// No hreflang alternates: the site is single-language since the /hi Hindi
// mirror was retired (see HindiRedirect in src/App.tsx). A self-referencing
// hreflang on a monolingual site carries no signal.
const urlBlock = (route) => `  <url>
    <loc>${SITE_ORIGIN}${route.path}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${formatPriority(route.priority)}</priority>
  </url>`;

const routes = getIndexableRoutes();

const blocks = routes.map(urlBlock);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blocks.join('\n\n')}
</urlset>
`;

await writeFile(SITEMAP_PATH, xml);
console.log(`sitemap.xml generated: ${blocks.length} URLs from src/content/siteRoutes.ts (${routes.length} indexable routes).`);
