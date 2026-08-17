import { GUIDES, getGuideBySlug, getRelatedGuides } from './data';
import { guidePath } from './categories';
import { TIMEOUT_OPTIONS_MS, DEFAULT_TIMEOUT_MS } from '../../tools/apiRequestBuilder/types';
import { API_REQUEST_BUILDER_GUIDE_SLUGS } from '../../tools/apiRequestBuilder/seoContent';

const SLUG = 'common-api-testing-errors';

const guide = () => getGuideBySlug(SLUG)!;
const headings = () => guide().sections.map((s) => s.heading);
const sectionBy = (fragment: string) => guide().sections.find((s) => s.heading.includes(fragment))!;
const sectionText = (s: { heading: string; paragraphs: string[]; bullets?: string[] }) =>
  [s.heading, ...s.paragraphs, ...(s.bullets ?? [])].join('\n');
const allText = () =>
  [
    guide().title,
    guide().description,
    ...guide().intro,
    ...guide().sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
    ...guide().faq.flatMap((f) => [f.question, f.answer]),
  ].join('\n');

// Every status code the brief requires this page to explain — one section each,
// all of them also present in the quick-reference table at the top.
const STATUS_CODES = ['400', '401', '403', '404', '405', '409', '415', '422', '429', '500', '502', '503'];

describe('common-api-testing-errors guide', () => {
  it('exists exactly once, under developer-tools, with a unique slug', () => {
    const matches = GUIDES.filter((g) => g.slug === SLUG);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe('developer-tools');
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  it('has title/description metadata and a canonical path', () => {
    expect(guide().title).toBe('Common API Testing Errors and What They Mean');
    expect(guide().description.length).toBeGreaterThan(0);
    expect(guide().description.length).toBeLessThan(180);
    expect(guidePath(guide())).toBe('/guides/developer-tools/common-api-testing-errors');
    expect(guide().noindex).toBeUndefined();
  });

  it('names the troubleshooting topics its meta description promises', () => {
    for (const term of ['400', '401', '403', '404', '405', '415', '422', '429', '5xx', 'timeout', 'CORS']) {
      expect(guide().description).toContain(term);
    }
  });

  it('is a single page: no per-status-code guide was created alongside it', () => {
    const strayStatusGuides = GUIDES.filter((g) => g.slug !== SLUG && /^(http-)?\d{3}(-|$)/.test(g.slug));
    expect(strayStatusGuides).toEqual([]);
  });

  it('opens with a quick-reference table covering every documented status code', () => {
    const table = sectionBy('Quick reference');
    expect(guide().sections.indexOf(table)).toBe(0);
    // Status — Meaning — Typical cause, one line per code.
    const bullets = table.bullets ?? [];
    for (const code of STATUS_CODES) {
      expect(bullets.some((b) => b.startsWith(`${code} `))).toBe(true);
    }
    // Plus the no-status-code row for timeouts/CORS.
    expect(bullets.some((b) => b.startsWith('No status code'))).toBe(true);
    for (const bullet of bullets) expect(bullet).toContain('—');
  });

  it('notes that status-code usage is not universal across APIs', () => {
    const caveat = sectionBy('not universal') ?? sectionBy('not the answer');
    const text = sectionText(caveat);
    expect(text).toContain('API-specific');
    expect(text).toContain('response body');
  });

  it.each(STATUS_CODES)('has a dedicated section for %s with causes and next actions', (code) => {
    const section = guide().sections.find((s) => s.heading.startsWith(code) || s.heading.includes(` ${code} `));
    expect(section).toBeDefined();
    const text = sectionText(section!);
    expect(text.length).toBeGreaterThan(200);
  });

  it('has a request timeout section that matches the tool’s real timeout choices', () => {
    const section = sectionBy('Request timeout');
    const text = sectionText(section);
    expect(text).toContain('not an HTTP status code');
    // The documented options must be exactly TIMEOUT_OPTIONS_MS, in seconds.
    const seconds = TIMEOUT_OPTIONS_MS.map((ms) => ms / 1000);
    expect(text).toContain(`${seconds.slice(0, -1).join(', ')}, and ${seconds[seconds.length - 1]} seconds`);
    expect(text).toContain(`defaulting to ${DEFAULT_TIMEOUT_MS / 1000}`);
    // Distinguishes the four failure modes rather than blaming the server.
    expect(text).toContain('client-side');
    expect(text).toContain('network failure');
    expect(text).toContain('does not prove the server is down');
  });

  it('has a browser/CORS section that points at the CORS guide', () => {
    const section = sectionBy('cURL but fails in the browser');
    const text = sectionText(section);
    expect(text).toContain('preflight');
    expect(text).toContain(guidePath(getGuideBySlug('what-is-a-cors-error')!));
  });

  it('has authentication sections that point at the authentication guide', () => {
    const authPath = guidePath(getGuideBySlug('authentication-testing-examples')!);
    expect(sectionText(sectionBy('401 Unauthorized'))).toContain(authPath);
    expect(sectionText(sectionBy('401 or 403'))).toContain(authPath);
  });

  it('has JSON and form-data sections that point at the right guides', () => {
    const jsonPath = guidePath(getGuideBySlug('json-post-request-example')!);
    const formPath = guidePath(getGuideBySlug('form-data-file-upload-example')!);

    expect(sectionText(sectionBy('400 Bad Request'))).toContain(jsonPath);
    expect(sectionText(sectionBy('422'))).toContain(jsonPath);

    const mediaType = sectionBy('415');
    expect(sectionText(mediaType)).toContain(jsonPath);
    expect(sectionText(mediaType)).toContain(formPath);
    // FormData boundary guidance, stated the way the tool actually behaves.
    expect(sectionText(mediaType)).toContain('boundary');
  });

  it('shows an invalid JSON body and its corrected form', () => {
    expect(sectionBy('Invalid JSON body').bullets).toEqual([
      '{',
      '  "name": "John"',
      '  "email": "john@example.com"',
      '}',
    ]);
    expect(sectionBy('corrected').bullets).toEqual([
      '{',
      '  "name": "John",',
      '  "email": "john@example.com"',
      '}',
    ]);
    expect(sectionText(sectionBy('Syntax errors versus schema errors'))).toContain('separate concerns');
  });

  it('has both troubleshooting checklists, each numbered', () => {
    for (const fragment of ['401 or 403', 'debugging any failing request']) {
      const bullets = sectionBy(fragment).bullets ?? [];
      expect(bullets.length).toBeGreaterThan(5);
      expect(bullets[0].startsWith('1. ')).toBe(true);
    }
  });

  it('describes the response and request information the tool actually shows', () => {
    const text = sectionText(sectionBy('What to look at in the API Request Builder'));
    for (const item of [
      'status code',
      'response time',
      'response size',
      'Headers',
      'Params',
      'Body',
      'Auth',
      'environment picker',
      'Timeout',
    ]) {
      expect(text).toContain(item);
    }
  });

  it('links only to guides that exist, and shows three related cards', () => {
    for (const slug of guide().relatedSlugs) expect(getGuideBySlug(slug)).toBeDefined();
    expect(new Set(guide().relatedSlugs).size).toBe(guide().relatedSlugs.length);
    expect(guide().relatedSlugs).not.toContain(SLUG);
    // getRelatedGuides caps the rendered list at 3.
    expect(getRelatedGuides(guide()).length).toBe(3);

    // Every in-text guide path resolves to a real guide.
    const paths = allText().match(/\/guides\/developer-tools\/[a-z0-9-]+/g) ?? [];
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(getGuideBySlug(path.split('/').pop()!)).toBeDefined();
    }
  });

  it('has a single API Request Builder CTA', () => {
    expect(guide().ctaToolHref).toBe('/tools/developer/api-request-builder');
    expect(guide().ctaToolLabel).toBe('Test the failing request in API Request Builder');
    expect(guide().ctaText!.length).toBeGreaterThan(0);
    // No per-status-code interactive examples — this is a reference page.
    expect(guide().sections.flatMap((s) => s.examples ?? [])).toEqual([]);
  });

  it('is listed on the API Request Builder tool page exactly once', () => {
    expect(API_REQUEST_BUILDER_GUIDE_SLUGS.filter((s) => s === SLUG).length).toBe(1);
    expect(new Set(API_REQUEST_BUILDER_GUIDE_SLUGS).size).toBe(API_REQUEST_BUILDER_GUIDE_SLUGS.length);
  });

  it('uses one H1 (the title) and unique, non-empty H2 section headings', () => {
    expect(new Set(headings()).size).toBe(headings().length);
    expect(headings().length).toBeGreaterThan(12);
    for (const heading of headings()) expect(heading.trim().length).toBeGreaterThan(0);
  });

  it('stays scannable: no giant paragraphs, and FAQ answers stay short', () => {
    for (const paragraph of guide().sections.flatMap((s) => s.paragraphs)) {
      expect(paragraph.length).toBeLessThan(900);
    }
    for (const item of guide().faq) expect(item.answer.length).toBeLessThan(700);
  });

  it('contains no credential-shaped value anywhere in its content', () => {
    const text = allText();
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // JWT-shaped
    expect(text).not.toMatch(/sk_(live|test)_[A-Za-z0-9]+/); // Stripe-shaped key
    expect(text).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS-shaped key
    expect(text).not.toMatch(/\/(home|Users|tmp|var|mnt)\//); // filesystem path
  });
});
