// One-off generator for public/og-image.jpg (1200x630 social preview card),
// screenshotting scripts/og-card.html with Puppeteer. Not part of the build
// — re-run manually (`node scripts/generate-og-image.mjs`) if the card design
// or copy changes.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(import.meta.dirname, '..');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, 'scripts/og-card.html')).toString(), { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  });
  await page.screenshot({
    path: path.join(ROOT, 'public/og-image.jpg'),
    type: 'jpeg',
    quality: 92,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  await browser.close();
  console.log('Wrote public/og-image.jpg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
