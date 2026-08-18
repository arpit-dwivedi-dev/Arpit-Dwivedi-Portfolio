import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  WIFI_QR_FAQ,
  WIFI_QR_HOW_IT_WORKS_STEPS,
  WIFI_QR_PLACEMENT_IDEAS,
  WIFI_QR_PRINT_TIPS,
  WIFI_SECURITY_TYPES,
} from './wifiLandingContent';
import { createBlankForms } from './types';
import { buildQrValue, getQrTypeDefinition, validateQrInput } from './encode';

const ALL_COPY = [
  ...WIFI_QR_HOW_IT_WORKS_STEPS,
  ...WIFI_QR_PLACEMENT_IDEAS,
  ...WIFI_QR_PRINT_TIPS,
  ...WIFI_SECURITY_TYPES.flatMap((option) => [option.type, option.summary]),
  ...WIFI_QR_FAQ.flatMap((item) => [item.question, item.answer]),
].map((text) => text.toLowerCase());

describe('wifi landing page copy', () => {
  it('has no empty strings anywhere', () => {
    for (const text of ALL_COPY) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate FAQ questions', () => {
    const questions = WIFI_QR_FAQ.map((item) => item.question);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it('covers all three security types the generator supports', () => {
    expect(WIFI_SECURITY_TYPES.map((option) => option.type)).toEqual(['WPA / WPA2 / WPA3', 'WEP', 'Open / None']);
  });

  // The generator has no backend and no dynamic destination: it encodes the
  // network credentials straight into the code. Any copy implying scan
  // tracking, a dynamic/editable QR, or server-side storage would describe a
  // product that does not exist.
  it('never claims dynamic QR, scan tracking, or server-side storage as features', () => {
    for (const text of ALL_COPY) {
      expect(text).not.toContain('dynamic qr');
      expect(text).not.toContain('track scans');
      expect(text).not.toContain('scan analytics');
      expect(text).not.toContain('we store');
      expect(text).not.toContain('save it to our servers');
    }
  });

  // The single most important accuracy constraint on this page: the QR
  // format is not a password-protection mechanism, and the tool does not
  // encrypt the password beyond the plain WIFI: payload format.
  it('is explicit that the QR reveals the password to anyone who can scan it', () => {
    const answer = WIFI_QR_FAQ.find((item) => item.question.toLowerCase().includes('reveal my wifi password'))!.answer.toLowerCase();
    expect(answer).toContain('anyone who can scan');
    expect(answer).not.toContain('encrypt');

    for (const text of ALL_COPY) {
      expect(text).not.toContain('encrypts your password');
      expect(text).not.toContain('secure vault');
      expect(text).not.toContain('password is hidden from');
    }
  });

  // Hidden-network copy is the second easy place to overclaim: the toggle
  // only describes the property to a scanning device, it does not itself
  // hide the network.
  it('explains the hidden-network toggle without claiming it hides the network', () => {
    const answer = WIFI_QR_FAQ.find((item) => item.question.toLowerCase().includes('hidden network'))!.answer.toLowerCase();
    expect(answer).toContain('does not hide');

    for (const text of ALL_COPY) {
      expect(text).not.toContain('hides your network');
      expect(text).not.toContain('makes the network hidden');
    }
  });

  it('hedges connection/scan behavior instead of guaranteeing every device', () => {
    for (const text of ALL_COPY) {
      expect(text).not.toContain('every phone');
      expect(text).not.toContain('all devices');
      expect(text).not.toContain('guaranteed');
      expect(text).not.toContain('automatically connects');
      expect(text).not.toContain('will connect');
    }
  });

  it('gives print guidance without inventing a universal exact size', () => {
    const printCopy = WIFI_QR_PRINT_TIPS.join(' ').toLowerCase();
    expect(printCopy).toContain('contrast');
    expect(printCopy).toContain('quiet zone');
    expect(printCopy).toContain('test');

    // No "print it at exactly N cm and it always works" claims.
    expect(printCopy).not.toMatch(/\d+\s*(cm|mm|inch|inches|px)/);
  });

  it('makes no adoption, statistics, or revenue claims', () => {
    for (const text of ALL_COPY) {
      expect(text).not.toMatch(/\d+\s*%/);
      expect(text).not.toContain('increase sales');
      expect(text).not.toContain('more bookings');
      expect(text).not.toContain('studies show');
    }
  });
});

describe('wifi landing page reuses the shared generator engine', () => {
  it('drives the same registered `wifi` QR type the hub uses', () => {
    const definition = getQrTypeDefinition('wifi');
    expect(definition.id).toBe('wifi');

    const blank = createBlankForms();

    expect(validateQrInput('wifi', blank).valid).toBe(false);
    expect(
      validateQrInput('wifi', { ...blank, wifi: { ssid: 'Guest WiFi', password: 'letmein123', security: 'WPA', hidden: false } }).valid,
    ).toBe(true);
    expect(
      buildQrValue('wifi', { ...blank, wifi: { ssid: 'Guest WiFi', password: 'letmein123', security: 'WPA', hidden: false } }, 'https://example.com/go'),
    ).toBe('WIFI:T:WPA;S:Guest WiFi;P:letmein123;H:false;;');
  });
});

describe('/wifi-qr-code indexability', () => {
  const sitemap = readFileSync(path.resolve(__dirname, '../../../public/sitemap.xml'), 'utf8');

  // scripts/prerender.mjs derives its route list from sitemap.xml, so a
  // missing entry here means the page ships as an empty SPA shell to any
  // crawler that doesn't run JavaScript — not just an unlisted URL.
  it('is listed in the sitemap so it gets prerendered and indexed', () => {
    expect(sitemap).toContain('<loc>https://101techlabs.com/wifi-qr-code</loc>');
  });

  it('is not canonicalized or aliased to the QR hub, and has no Hindi variant', () => {
    expect(sitemap).not.toContain('https://101techlabs.com/hi/wifi-qr-code');
    expect(sitemap).not.toContain('https://101techlabs.com/tools/generators/qr-code-generator/wifi');
    expect(sitemap).not.toContain('wifi-qr-code?');
  });

  it('keeps the QR hub in the sitemap alongside it', () => {
    expect(sitemap).toContain('<loc>https://101techlabs.com/tools/generators/qr-code-generator</loc>');
  });
});
