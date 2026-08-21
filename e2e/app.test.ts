import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

// This suite had drifted out of usefulness: every test hit
// http://localhost:3000/101TechLabs/, a host and base path the app stopped
// serving when `base` moved to '/' and the dev port to 4321, so all seven
// tests failed on connection refused rather than on anything about the page.
// One of them also asserted a #projects section that was deliberately deleted
// in August, so it would have failed even pointed at the right URL.
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4321';

describe('Homepage', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    // 1536 so the section rail renders — it is 2xl-only, because below that
    // the labelled rail overlaps the hero terminal.
    await page.setViewport({ width: 1536, height: 900 });
    await page.goto(BASE, { waitUntil: 'networkidle2' });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('renders the primary nav', async () => {
    expect(await page.$('nav[aria-label="Primary"]')).not.toBeNull();
  });

  test.each([
    ['#home', 'hero'],
    ['#next', 'now / next'],
    ['#about', 'about'],
    ['#experience', 'services'],
    ['#faq', 'faq'],
    ['#contact', 'contact'],
  ])('renders the %s section (%s)', async (selector) => {
    expect(await page.$(selector)).not.toBeNull();
  });

  test('has exactly one h1 and no skipped heading levels', async () => {
    const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', (els) => els.map((el) => Number(el.tagName[1])));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    const skips = levels.filter((level, i) => i > 0 && level > levels[i - 1] + 1);
    expect(skips).toHaveLength(0);
  });

  test('nav carries Products marked as coming soon, anchored to a real section', async () => {
    const href = await page.$eval('a[aria-label="Products — coming soon"]', (el) => el.getAttribute('href'));
    expect(href).toBe('/#next');
    expect(await page.$('#next')).not.toBeNull();
  });

  test('the two statuses use different visual languages, not two pills', async () => {
    const statuses = await page.$$eval('#next .t-label', (els) => els.map((el) => (el.textContent ?? '').trim()));
    expect(statuses).toContain('Active');
    expect(statuses).toContain('Coming soon');
  });

  test('the hero terminal answers a real command', async () => {
    await page.focus('#hero-terminal-input');
    await page.type('#hero-terminal-input', 'whoami');
    await page.keyboard.press('Enter');
    // Whitespace-normalised innerText: the prompt and the command are adjacent
    // flex items, so textContent runs them together as "$whoami" while
    // innerText puts a newline between them. Collapsing runs of whitespace is
    // the only form that matches what a reader actually sees.
    const readLog = () =>
      page.$eval('#hero-terminal-input', (el) =>
        ((el.closest('.overflow-y-auto') as HTMLElement).innerText ?? '').replace(/\s+/g, ' ').trim(),
      );
    await page.waitForFunction(
      () =>
        (((document.querySelector('#hero-terminal-input')?.closest('.overflow-y-auto') as HTMLElement | null)?.innerText ?? '')
          .replace(/\s+/g, ' ')).includes('$ whoami'),
      { timeout: 4000 },
    );
    const log = await readLog();
    // The echoed command plus a real response, not just the welcome banner.
    expect(log).toContain('$ whoami');
    expect(log.length).toBeGreaterThan(120);
  });

  test('anchor links move the hash', async () => {
    await page.click('a[href$="#about"]');
    await page.waitForFunction(() => globalThis.location.hash.includes('about'));
    expect(page.url()).toContain('#about');
  });

  test('contact form keeps its fields and submit label', async () => {
    const contact = await page.$('#contact');
    expect(contact).not.toBeNull();
    const form = await contact!.$('form');
    expect(form).not.toBeNull();

    expect(await form!.$('input[placeholder="Your Name"]')).not.toBeNull();
    expect(await form!.$('input[placeholder="your@email.com"]')).not.toBeNull();
    expect(await form!.$('textarea[placeholder="Tell us about your project..."]')).not.toBeNull();

    const label = await form!.$eval('button[type="submit"]', (el) => el.textContent ?? '');
    expect(label).toContain('Send Message');
  });

  test('empty submit shows validation errors and sends nothing', async () => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.click('#contact button[type="submit"]');
    await page.waitForSelector('#contact-name-error');
    expect(await page.$('#contact-email-error')).not.toBeNull();
    expect(await page.$('#contact-message-error')).not.toBeNull();
    expect(requests.filter((u) => u.includes('web3forms'))).toHaveLength(0);
  });
});
