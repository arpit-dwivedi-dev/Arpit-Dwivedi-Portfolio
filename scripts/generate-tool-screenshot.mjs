// One-off generator for public/screenshots/google-maps-business-finder.png —
// a real screenshot of the tool's own UI (not a mockup), used on the tool
// page and in marketing/OG contexts. Deliberately does NOT submit the search
// form: this repo's .env.local points VITE_TOOLS_API_URL at the real
// production scraper backend, and this script must never trigger a live
// third-party search as a side effect of a docs/screenshot task. Only types
// example text into the (unsubmitted) inputs so the screenshot shows real
// product UI with realistic placeholder values.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4174;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

async function main() {
  const shellHtml = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const ext = path.extname(urlPath);
    if (ext) {
      const hit = path.join(DIST, urlPath);
      if (existsSync(hit) && statSync(hit).isFile()) {
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        createReadStream(hit).pipe(res);
        return;
      }
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(shellHtml);
  });
  await new Promise((resolve) => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${PORT}/tools/lead-generation/google-maps-business-finder`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('#maps-query');
  await page.type('#maps-query', 'coffee shops');
  await page.type('#maps-location', 'Austin, TX');
  await new Promise((r) => setTimeout(r, 200));

  const target = await page.$('form');
  if (!target) throw new Error('Could not locate the tool form to screenshot');
  await target.screenshot({ path: path.join(ROOT, 'public/screenshots/google-maps-business-finder.png') });

  await browser.close();
  server.close();
  console.log('Wrote public/screenshots/google-maps-business-finder.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
