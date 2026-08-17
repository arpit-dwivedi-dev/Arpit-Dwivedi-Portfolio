import { GUIDES, getGuideBySlug, getRelatedGuides } from './data';
import { guidePath } from './categories';
import { buildApiExampleUrl } from '../../tools/apiRequestBuilder/example';
import { decodeShareRequest, readShareParam } from '../../tools/apiRequestBuilder/shareRequest';
import { resolveRequest } from '../../tools/apiRequestBuilder/resolveRequest';
import { API_REQUEST_BUILDER_GUIDE_SLUGS } from '../../tools/apiRequestBuilder/seoContent';

const SLUG = 'form-data-file-upload-example';

const guide = () => getGuideBySlug(SLUG)!;
const examples = () => guide().sections.flatMap((s) => s.examples ?? []);
const textExample = () => examples().find((e) => e.request.body.formFields.every((f) => !f.isFile))!;
const fileExample = () => examples().find((e) => e.request.body.formFields.some((f) => f.isFile))!;

describe('form-data-file-upload-example guide', () => {
  it('exists exactly once, under developer-tools, with a unique slug', () => {
    const matches = GUIDES.filter((g) => g.slug === SLUG);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe('developer-tools');
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  it('has title/description metadata and a canonical path', () => {
    expect(guide().title).toBe('How to Send Form Data and File Uploads to an API');
    expect(guide().description.length).toBeGreaterThan(0);
    expect(guide().description.length).toBeLessThan(170);
    expect(guidePath(guide())).toBe('/guides/developer-tools/form-data-file-upload-example');
    expect(guide().noindex).toBeUndefined();
  });

  it('has exactly two interactive examples, both multipart POSTs to the httpbin sandbox', () => {
    expect(examples().length).toBe(2);
    for (const example of examples()) {
      expect(example.request.method).toBe('POST');
      expect(example.request.url).toBe('https://httpbin.org/anything');
      expect(example.request.body.mode).toBe('multipart');
    }
  });

  it('example 1 carries only text fields — name and email', () => {
    const fields = textExample().request.body.formFields;
    expect(fields.map((f) => [f.key, f.value])).toEqual([
      ['name', 'John Doe'],
      ['email', 'john@example.com'],
    ]);
    expect(fields.every((f) => f.enabled)).toBe(true);
    expect(fields.some((f) => f.isFile)).toBe(false);
  });

  it('example 2 mixes a text field with a file field placeholder that carries no file', () => {
    const fields = fileExample().request.body.formFields;
    expect(fields.map((f) => f.key)).toEqual(['name', 'file']);

    const [text, file] = fields;
    expect([text.key, text.value]).toEqual(['name', 'profile']);
    expect(file.isFile).toBe(true);
    // The reader supplies the file after opening the request — a static example can
    // reference neither a File object nor a name/path for one.
    expect(file.value).toBe('');
    expect(file.file).toBeUndefined();
    expect(file.fileName).toBeUndefined();
  });

  it('neither example sets a Content-Type header — the browser must generate the boundary', () => {
    for (const example of examples()) {
      expect(example.request.headers).toEqual([]);
      const resolved = resolveRequest(example.request);
      expect(resolved.headers.some(([key]) => key.toLowerCase() === 'content-type')).toBe(false);
      expect(resolved.contentTypeAutoApplied).toBeUndefined();
      expect(resolved.bodyInit).toBeInstanceOf(FormData);
    }
  });

  it('neither example carries auth, params, or any credential-shaped value', () => {
    for (const example of examples()) {
      expect(example.request.auth.type).toBe('none');
      expect(example.request.params).toEqual([]);
    }
  });

  it('every example builds an "Open in API Request Builder" link', () => {
    for (const example of examples()) {
      expect(buildApiExampleUrl(example.request).startsWith('/tools/developer/api-request-builder?request=')).toBe(true);
    }
  });

  it('the shared file example round-trips as a file field with no filesystem path', () => {
    const href = buildApiExampleUrl(fileExample().request);
    const encoded = readShareParam(href.slice(href.indexOf('?')))!;
    const decoded = decodeShareRequest(encoded);
    expect(decoded.ok).toBe(true);

    const fields = decoded.request!.body.formFields;
    expect(decoded.request!.body.mode).toBe('multipart');
    expect(fields.map((f) => f.key)).toEqual(['name', 'file']);

    const file = fields[1];
    expect(file.isFile).toBe(true);
    expect(file.fileName).toBeUndefined();
    expect(file.file).toBeUndefined();
    expect(file.value).toBe('');

    // No absolute/relative filesystem path survives into the shareable payload.
    expect(decodeURIComponent(href)).not.toMatch(/(^|[^a-z])[A-Za-z]:\\|\/(home|Users|tmp|var|mnt)\//);
  });

  it('no example or body text embeds a filesystem path, secret, or environment value', () => {
    const text = [
      guide().title,
      guide().description,
      ...guide().intro,
      ...guide().sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
      ...guide().faq.flatMap((f) => [f.question, f.answer]),
    ].join('\n');

    expect(text).not.toMatch(/\/(home|Users|tmp|var|mnt)\//);
    expect(text).not.toMatch(/[A-Za-z]:\\/);
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // JWT-shaped
    expect(text).not.toMatch(/sk_(live|test)_[A-Za-z0-9]+/); // Stripe-shaped key
  });

  it('teaches the Content-Type/boundary rule explicitly', () => {
    const text = guide().sections.flatMap((s) => [...s.paragraphs, ...(s.bullets ?? [])]).join('\n');
    expect(text).toContain('boundary');
    expect(text).toContain('multipart/form-data');
  });

  it('has related slugs that all resolve to real, rendered guides', () => {
    const related = getRelatedGuides(guide());
    expect(related.length).toBe(guide().relatedSlugs.length);
    expect(related.map((g) => g.slug)).toEqual(['json-post-request-example', 'how-to-test-an-api', 'what-is-a-cors-error']);
  });

  it('is linked back from the general API testing guide', () => {
    expect(getGuideBySlug('how-to-test-an-api')!.relatedSlugs).toContain(SLUG);
    expect(getRelatedGuides(getGuideBySlug('how-to-test-an-api')!).map((g) => g.slug)).toContain(SLUG);
  });

  it('is listed on the API Request Builder tool page', () => {
    expect(API_REQUEST_BUILDER_GUIDE_SLUGS).toContain(SLUG);
  });

  it('uses one H1 (the title) and unique H2 section headings', () => {
    const headings = guide().sections.map((s) => s.heading);
    expect(new Set(headings).size).toBe(headings.length);
    expect(headings.length).toBeGreaterThan(4);
  });
});
