// Prerenders every route in public/sitemap.xml into a real, HTTP-200,
// content-complete static file so search/AI crawlers (most of which don't
// execute JavaScript) see actual per-page content instead of a 404 or an
// empty <div id="root"></div>. See ../101techlabs.com-audit/ for why this
// exists — it was the highest-priority finding of the SEO audit.
//
// How it works: serve the freshly built dist/ over HTTP, visit every
// sitemap route in a real headless browser (letting React Router, the
// LanguageProvider's title/meta/canonical/hreflang injection, and the
// per-route JsonLd components all run), then snapshot the resulting DOM
// to disk as dist/<route>/index.html. Each snapshot still ships the app's
// <script type="module"> tag, so the SPA hydrates normally for real users
// — this only changes what a non-JS client sees on first byte.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4173;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
};

async function getRoutes() {
  const sitemap = await readFile(path.join(ROOT, 'public/sitemap.xml'), 'utf8');
  const routes = [...sitemap.matchAll(/<loc>https:\/\/101techlabs\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  return [...new Set(routes)];
}

// The pristine, un-prerendered SPA shell — captured once, before any route
// snapshot overwrites dist/index.html. Every route must start hydration from
// this same shell; falling back to whatever's currently on disk at dist/
// would serve an already-prerendered route's leftover head tags (JSON-LD,
// title, etc.) to the next route, since disk content mutates as we go.
async function startServer() {
  const shellHtml = await readFile(path.join(DIST, 'index.html'), 'utf8');

  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const isHtmlRoute = !path.extname(urlPath);
    if (!isHtmlRoute) {
      const hit = path.join(DIST, urlPath);
      if (existsSync(hit) && statSync(hit).isFile()) {
        res.setHeader('Content-Type', MIME[path.extname(hit)] || 'application/octet-stream');
        createReadStream(hit).pipe(res);
        return;
      }
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(shellHtml);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

// Writes both dist/<route>/index.html (directory-index form) and a flat
// dist/<route>.html sibling with identical content. GitHub Pages' static
// serving hasn't been verified to prefer one resolution strategy over the
// other for an extensionless request — writing both means whichever
// mechanism it uses, the exact sitemap/canonical URL (no trailing slash)
// resolves directly to a 200 with no redirect hop required.
async function outputPathsFor(route) {
  if (route === '/') return [path.join(DIST, 'index.html')];
  const slug = route.replace(/^\//, '');
  const dir = path.join(DIST, slug);
  await mkdir(dir, { recursive: true });
  return [path.join(dir, 'index.html'), path.join(DIST, `${slug}.html`)];
}

async function main() {
  const routes = await getRoutes();
  console.log(`Prerendering ${routes.length} routes...`);

  const server = await startServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    for (const route of routes) {
      const page = await browser.newPage();
      const consoleErrors = [];
      page.on('pageerror', (err) => consoleErrors.push(String(err)));
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
      // LanguageProvider's head-injection effects and lazy route chunks run
      // in useEffect after the initial paint; give React a beat to settle.
      await new Promise((r) => setTimeout(r, 250));
      const html = await page.content();
      await page.close();

      if (consoleErrors.length) {
        console.warn(`  ! ${route} had page errors: ${consoleErrors.join('; ')}`);
      }

      const outPaths = await outputPathsFor(route);
      await Promise.all(outPaths.map((p) => writeFile(p, `<!doctype html>\n${html}`, 'utf8')));
      console.log(`  ✓ ${route} -> ${outPaths.map((p) => path.relative(DIST, p)).join(', ')}`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Real 404 page for genuinely unknown paths — a plain, honest 404 (not
  // the SPA shell) so it doesn't get confused for a prerendered route.
  // GitHub Pages requires this filename specifically.
  const notFoundHtml = await readFile(path.join(DIST, 'index.html'), 'utf8');
  await writeFile(path.join(DIST, '404.html'), notFoundHtml, 'utf8');

  console.log('Prerender complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
