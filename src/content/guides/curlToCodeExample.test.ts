import { GUIDES, getGuideBySlug, getRelatedGuides } from './data';
import { guidePath } from './categories';
import { buildApiExampleUrl } from '../../tools/apiRequestBuilder/example';
import { decodeShareRequest, readShareParam } from '../../tools/apiRequestBuilder/shareRequest';
import { generateCurlCommand } from '../../tools/apiRequestBuilder/curlGenerator';
import {
  generateAxiosCode,
  generateFetchCode,
  generateNodeCode,
  generatePythonCode,
} from '../../tools/apiRequestBuilder/codeGenerators';
import { parseCurlCommand } from '../../tools/apiRequestBuilder/curlParser';
import { API_REQUEST_BUILDER_GUIDE_SLUGS } from '../../tools/apiRequestBuilder/seoContent';

const SLUG = 'curl-to-fetch-axios-python';

const guide = () => getGuideBySlug(SLUG)!;
const examples = () => guide().sections.flatMap((s) => s.examples ?? []);
const request = () => examples()[0].request;
const sectionBy = (heading: string) => guide().sections.find((s) => s.heading === heading)!;

// The guide renders generated code as `bullets` (GuideSection has no code-block field),
// with blank lines dropped — mirror that here so a documented snippet can be compared
// against live generator output line for line.
const codeLines = (code: string): string[] => code.split('\n').filter((line) => line.trim().length > 0);

describe('curl-to-fetch-axios-python guide', () => {
  it('exists exactly once, under developer-tools, with a unique slug', () => {
    const matches = GUIDES.filter((g) => g.slug === SLUG);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe('developer-tools');
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  it('has title/description metadata and a canonical path', () => {
    expect(guide().title).toBe('Convert a cURL Command to JavaScript, Axios, or Python');
    expect(guide().description.length).toBeGreaterThan(0);
    expect(guide().description.length).toBeLessThan(170);
    expect(guidePath(guide())).toBe('/guides/developer-tools/curl-to-fetch-axios-python');
    expect(guide().noindex).toBeUndefined();
  });

  it('is built around one request: a JSON POST to the httpbin sandbox', () => {
    // Both cards embed the same request — one example definition, reused.
    expect(examples().length).toBe(2);
    expect(examples()[1].request).toBe(request());

    expect(request().method).toBe('POST');
    expect(request().url).toBe('https://httpbin.org/anything');
    expect(request().body.mode).toBe('json');
    expect(JSON.parse(request().body.raw)).toEqual({ name: 'John Doe', email: 'john@example.com' });
    expect(request().headers.map((h) => [h.key, h.value])).toEqual([
      ['Content-Type', 'application/json'],
      ['X-Client-Version', 'demo'],
    ]);
    expect(request().auth.type).toBe('none');
    expect(request().params).toEqual([]);
  });

  it('documents the cURL command the generator actually produces', () => {
    expect(sectionBy('The original cURL command').bullets).toEqual(codeLines(generateCurlCommand(request())));
  });

  it.each([
    ['Convert cURL to JavaScript Fetch', generateFetchCode],
    ['Convert cURL to Axios', generateAxiosCode],
    ['Convert cURL to Python Requests', generatePythonCode],
    ['Convert cURL to Node.js', generateNodeCode],
  ])('%s documents live generator output', (heading, generate) => {
    expect(sectionBy(heading).bullets).toEqual(codeLines(generate(request())));
  });

  it('the documented cURL command re-imports as the same request', () => {
    const parsed = parseCurlCommand(generateCurlCommand(request()));
    expect(parsed.ok).toBe(true);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.request!.method).toBe('POST');
    expect(parsed.request!.url).toBe('https://httpbin.org/anything');
    expect(parsed.request!.body.mode).toBe('json');
    expect(JSON.parse(parsed.request!.body.raw)).toEqual(JSON.parse(request().body.raw));
    expect(parsed.request!.headers.map((h) => [h.key, h.value])).toEqual([
      ['Content-Type', 'application/json'],
      ['X-Client-Version', 'demo'],
    ]);
  });

  it('builds an "Open in API Request Builder" link that round-trips the request', () => {
    const href = buildApiExampleUrl(request());
    expect(href.startsWith('/tools/developer/api-request-builder?request=')).toBe(true);

    const decoded = decodeShareRequest(readShareParam(href.slice(href.indexOf('?')))!);
    expect(decoded.ok).toBe(true);
    expect(decoded.request!.method).toBe('POST');
    expect(decoded.request!.url).toBe('https://httpbin.org/anything');
    expect(JSON.parse(decoded.request!.body.raw)).toEqual(JSON.parse(request().body.raw));
  });

  it('contains no credential-shaped value anywhere in its content', () => {
    const text = [
      guide().title,
      guide().description,
      ...guide().intro,
      ...guide().sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
      ...guide().faq.flatMap((f) => [f.question, f.answer]),
    ].join('\n');

    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // JWT-shaped
    expect(text).not.toMatch(/sk_(live|test)_[A-Za-z0-9]+/); // Stripe-shaped key
    expect(text).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS-shaped key
    expect(text).not.toMatch(/\/(home|Users|tmp|var|mnt)\//); // filesystem path
    // The only credentials shown are shell/environment placeholders.
    expect(text).toContain('$TOKEN');
    expect(text).toContain('{{token}}');
  });

  it('covers the conversion caveats readers actually hit', () => {
    const text = guide().sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]).join('\n');
    for (const topic of ['AbortController', 'CORS', 'Cookie', 'multipart', '{{baseUrl}}', 'Import cURL']) {
      expect(text).toContain(topic);
    }
  });

  it('has related slugs that all resolve to real, rendered guides', () => {
    const related = getRelatedGuides(guide());
    expect(related.length).toBe(guide().relatedSlugs.length);
    expect(related.map((g) => g.slug)).toEqual([
      'json-post-request-example',
      'authentication-testing-examples',
      'what-is-a-cors-error',
    ]);
  });

  it('is listed on the API Request Builder tool page exactly once', () => {
    expect(API_REQUEST_BUILDER_GUIDE_SLUGS.filter((s) => s === SLUG).length).toBe(1);
    expect(new Set(API_REQUEST_BUILDER_GUIDE_SLUGS).size).toBe(API_REQUEST_BUILDER_GUIDE_SLUGS.length);
  });

  it('uses one H1 (the title) and unique H2 section headings', () => {
    const headings = guide().sections.map((s) => s.heading);
    expect(new Set(headings).size).toBe(headings.length);
    expect(headings.length).toBeGreaterThan(4);
  });
});
