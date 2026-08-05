// One-off generator for public/og-image.png (1200x630 social preview card),
// screenshotting scripts/og-card.html with Puppeteer. Not part of the build
// — re-run manually (`node scripts/generate-og-image.mjs`) if the card design
// or copy changes.
import path from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(import.meta.dirname, '..');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(ROOT, 'scripts/og-card.html')}`);
  await page.screenshot({ path: path.join(ROOT, 'public/og-image.jpg'), type: 'jpeg', quality: 90 });
  await browser.close();
  console.log('Wrote public/og-image.jpg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
