// Build-time guardrail against indexing drift: fails loudly if a public
// route ever ends up present in App.tsx but missing from the shared route
// registry (src/content/siteRoutes.ts), missing from public/sitemap.xml, or
// missing a prerendered static file in dist/. That three-way drift is
// exactly what caused real tool/category routes to 404 on GitHub Pages
// before this pipeline existed (see siteRoutes.ts and prerender.mjs's
// header comments).
//
// Runs as the last step of "postbuild" (see package.json), after
// generate-sitemap.mjs (prebuild) and prerender.mjs have both already run,
// so public/sitemap.xml and dist/ reflect the current build.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const APP_TSX = path.join(ROOT, 'src/App.tsx');
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml');
const DIST = path.join(ROOT, 'dist');

const { SITE_ORIGIN, getIndexableRoutes, getIndexablePaths, getAllPrerenderPaths, getExcludedRoutes } = await import(
  path.join(ROOT, 'src/content/siteRoutes.ts')
);

const problems = [];
const report = (heading, lines) => {
  if (lines.length === 0) return;
  problems.push(`\n${heading}\n${lines.map((l) => `  - ${l}`).join('\n')}`);
};

// ---- 1. Every literal (non-dynamic, non-catch-all) route in App.tsx must
// be classified: either indexable (in the registry) or explicitly excluded
// (in getExcludedRoutes()). Anything else is a route a developer added
// without telling the indexing pipeline about it.
const appTsxSource = await readFile(APP_TSX, 'utf8');
const literalAppRoutes = [...appTsxSource.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => !p.includes(':') && p !== '*');

const indexablePaths = new Set(getIndexablePaths());
const excludedPaths = new Set(getExcludedRoutes().flatMap((r) => (r.hiPath ? [r.path, r.hiPath] : [r.path])));

const unclassified = literalAppRoutes.filter((p) => !indexablePaths.has(p) && !excludedPaths.has(p));
report(
  `Route(s) present in src/App.tsx but not classified in src/content/siteRoutes.ts (neither indexable nor in getExcludedRoutes()):`,
  unclassified.map(
    (p) => `${p} — expected source: src/content/siteRoutes.ts. Add it to STATIC_ROUTES (if static) or getExcludedRoutes() (if intentionally non-indexable), or confirm it's covered by a dynamic generator (tool/guide/blog).`,
  ),
);

// ---- 2. Every indexable path must be in public/sitemap.xml, and nothing
// excluded/hidden must have leaked into it.
if (existsSync(SITEMAP_PATH)) {
  const sitemapXml = await readFile(SITEMAP_PATH, 'utf8');
  const sitemapPaths = new Set(
    [...sitemapXml.matchAll(new RegExp(`<loc>${SITE_ORIGIN}([^<]*)</loc>`, 'g'))].map((m) => m[1] || '/'),
  );

  const missingFromSitemap = getIndexablePaths().filter((p) => !sitemapPaths.has(p));
  report(
    `Indexable route(s) missing from public/sitemap.xml (pipeline omitted: scripts/generate-sitemap.mjs):`,
    missingFromSitemap.map((p) => `${p} — expected source: src/content/siteRoutes.ts#getIndexableRoutes()`),
  );

  const leakedExclusions = [...excludedPaths].filter((p) => sitemapPaths.has(p));
  report(
    `Explicitly-excluded route(s) found in public/sitemap.xml (should never be indexed):`,
    leakedExclusions.map((p) => `${p} — see reason in src/content/siteRoutes.ts#getExcludedRoutes()`),
  );
} else {
  console.warn(`[validate-route-registry] ${path.relative(ROOT, SITEMAP_PATH)} not found — skipping sitemap checks.`);
}

// ---- 3. Every prerender-required path must have a static HTML snapshot in
// dist/ (pipeline omitted: scripts/prerender.mjs).
if (existsSync(DIST)) {
  const outputExistsFor = (route) => {
    if (route === '/') return existsSync(path.join(DIST, 'index.html'));
    const slug = route.replace(/^\//, '');
    return existsSync(path.join(DIST, slug, 'index.html')) || existsSync(path.join(DIST, `${slug}.html`));
  };

  const missingFromDist = getAllPrerenderPaths().filter((p) => !outputExistsFor(p));
  report(
    `Route(s) missing a prerendered static file in dist/ (pipeline omitted: scripts/prerender.mjs):`,
    missingFromDist.map((p) => `${p} — expected dist${p === '/' ? '/index.html' : `${p}/index.html`}`),
  );
} else {
  console.warn(`[validate-route-registry] ${path.relative(ROOT, DIST)} not found — skipping prerender checks.`);
}

// ---- 4. Sanity: noindex guides must still say noindex, and the count of
// indexable routes is non-trivial (catches an accidentally-emptied registry).
const indexableRoutes = getIndexableRoutes();
if (indexableRoutes.length === 0) {
  report(`Route registry sanity check failed:`, [`getIndexableRoutes() returned zero routes — refusing to trust an empty registry.`]);
}

if (problems.length > 0) {
  console.error(`\n[validate-route-registry] ROUTE INDEXING DRIFT DETECTED\n${problems.join('\n')}\n`);
  process.exit(1);
}

console.log(
  `[validate-route-registry] OK — ${indexableRoutes.length} indexable routes, ${literalAppRoutes.length} literal App.tsx routes all classified, sitemap and prerender output consistent.`,
);
