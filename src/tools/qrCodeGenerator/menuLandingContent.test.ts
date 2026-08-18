import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  MENU_FORMAT_COMPARISON,
  MENU_QR_FAQ,
  MENU_QR_HOW_IT_WORKS_STEPS,
  MENU_QR_PLACEMENT_IDEAS,
  MENU_QR_PRINT_TIPS,
} from './menuLandingContent';
import { createBlankForms } from './types';
import { buildQrValue, getQrTypeDefinition, validateQrInput } from './encode';

const ALL_COPY = [
  ...MENU_QR_HOW_IT_WORKS_STEPS,
  ...MENU_QR_PLACEMENT_IDEAS,
  ...MENU_QR_PRINT_TIPS,
  ...MENU_FORMAT_COMPARISON.flatMap((option) => [option.format, option.summary, ...option.advantages]),
  ...MENU_QR_FAQ.flatMap((item) => [item.question, item.answer]),
].map((text) => text.toLowerCase());

describe('menu landing page copy', () => {
  it('has no empty strings anywhere', () => {
    for (const text of ALL_COPY) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate FAQ questions', () => {
    const questions = MENU_QR_FAQ.map((item) => item.question);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it('covers both menu formats the page compares', () => {
    expect(MENU_FORMAT_COMPARISON.map((option) => option.format)).toEqual(['Webpage menu', 'PDF menu']);
  });

  // The generator has no backend: it encodes the URL straight into the code.
  // Any copy implying an editable destination, a redirect service, or scan
  // analytics would describe a product that does not exist.
  it('never claims dynamic QR, editable destinations, or scan tracking as features', () => {
    for (const text of ALL_COPY) {
      expect(text).not.toContain('dynamic qr');
      expect(text).not.toContain('edit the destination');
      expect(text).not.toContain('change the link later');
      expect(text).not.toContain('track scans');
      expect(text).not.toContain('scan analytics');
    }
  });

  it('never implies the QR code stores the menu file itself', () => {
    const pdfAnswer = MENU_QR_FAQ.find((item) => item.question.toLowerCase().includes('pdf menu'))!.answer.toLowerCase();
    expect(pdfAnswer).toContain('does not store the pdf itself');
    expect(pdfAnswer).toContain('link');

    for (const text of ALL_COPY) {
      expect(text).not.toContain('upload your menu');
      expect(text).not.toContain('upload your pdf here');
      expect(text).not.toContain('we host');
    }
  });

  // The "can I update the menu without reprinting" answer is the one place
  // this page can easily become wrong — it has to distinguish a stable URL
  // (code keeps working) from a new URL (code does not follow).
  it('explains the stable-URL rule accurately in the update FAQ', () => {
    const answer = MENU_QR_FAQ.find((item) => item.question.toLowerCase().includes('update my menu'))!.answer.toLowerCase();
    expect(answer).toContain('same url');
    expect(answer).toContain('different url');
    expect(answer).toContain('print a new one');
  });

  it('hedges scanner compatibility instead of guaranteeing every device', () => {
    const appAnswer = MENU_QR_FAQ.find((item) => item.question.toLowerCase().includes('need an app'))!.answer.toLowerCase();
    expect(appAnswer).toContain('most');
    expect(appAnswer).toContain('qr scanner app');

    for (const text of ALL_COPY) {
      expect(text).not.toContain('every phone');
      expect(text).not.toContain('all devices');
      expect(text).not.toContain('guaranteed');
    }
  });

  it('gives print guidance without inventing a universal exact size', () => {
    const printCopy = MENU_QR_PRINT_TIPS.join(' ').toLowerCase();
    expect(printCopy).toContain('contrast');
    expect(printCopy).toContain('quiet zone');
    expect(printCopy).toContain('svg');
    expect(printCopy).toContain('screenshot');
    expect(printCopy).toContain('test');

    // No "print it at exactly N cm and it always works" claims.
    expect(printCopy).not.toMatch(/\d+\s*(cm|mm|inch|inches|px)/);
  });

  it('makes no revenue, conversion, or scan-rate claims and cites no statistics', () => {
    for (const text of ALL_COPY) {
      expect(text).not.toMatch(/\d+\s*%/);
      expect(text).not.toContain('increase sales');
      expect(text).not.toContain('more orders');
      expect(text).not.toContain('boost revenue');
      expect(text).not.toContain('higher ratings');
      expect(text).not.toContain('studies show');
    }
  });
});

describe('menu landing page reuses the shared generator engine', () => {
  it('drives the same registered `menu` QR type the hub uses', () => {
    const definition = getQrTypeDefinition('menu');
    expect(definition.id).toBe('menu');

    const blank = createBlankForms();
    const menuUrl = 'https://cafe.example.com/menu';

    // Static behavior, exactly as the copy above describes it: the encoded
    // value is the URL itself, with no redirect hop injected.
    expect(validateQrInput('menu', { ...blank, menu: { value: menuUrl } }).valid).toBe(true);
    expect(buildQrValue('menu', { ...blank, menu: { value: menuUrl } }, 'https://example.com/go')).toBe(menuUrl);
    expect(validateQrInput('menu', blank).valid).toBe(false);
  });
});

describe('/menu-qr-code indexability', () => {
  const sitemap = readFileSync(path.resolve(__dirname, '../../../public/sitemap.xml'), 'utf8');

  // scripts/prerender.mjs derives its route list from sitemap.xml, so a
  // missing entry here means the page ships as an empty SPA shell to any
  // crawler that doesn't run JavaScript — not just an unlisted URL.
  it('is listed in the sitemap so it gets prerendered and indexed', () => {
    expect(sitemap).toContain('<loc>https://101techlabs.com/menu-qr-code</loc>');
  });

  it('is not canonicalized or aliased to the QR hub, and has no Hindi variant', () => {
    expect(sitemap).not.toContain('https://101techlabs.com/hi/menu-qr-code');
    expect(sitemap).not.toContain('https://101techlabs.com/tools/generators/qr-code-generator/menu');
    expect(sitemap).not.toContain('menu-qr-code?');
  });

  it('keeps the QR hub in the sitemap alongside it', () => {
    expect(sitemap).toContain('<loc>https://101techlabs.com/tools/generators/qr-code-generator</loc>');
  });
});
