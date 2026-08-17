import { GUIDES, getGuideBySlug, getRelatedGuides } from './data';
import { guidePath } from './categories';
import { API_REQUEST_BUILDER_GUIDE_SLUGS } from '../../tools/apiRequestBuilder/seoContent';
import { buildPostmanImportPlan } from '../../tools/apiRequestBuilder/postman';
import { convertPostmanAuth } from '../../tools/apiRequestBuilder/postman/auth';
import { convertPostmanBody } from '../../tools/apiRequestBuilder/postman/body';
import { validatePostmanDocument } from '../../tools/apiRequestBuilder/postman/validator';
import { MAX_FOLDER_DEPTH } from '../../tools/apiRequestBuilder/collections';
import { redactSecrets } from '../../tools/apiRequestBuilder/storage';
import { createBlankRequest } from '../../tools/apiRequestBuilder/types';

const SLUG = 'import-postman-collection-without-postman';

const guide = () => getGuideBySlug(SLUG)!;
const sectionBy = (heading: string) => guide().sections.find((s) => s.heading === heading)!;

const allText = () =>
  [
    guide().title,
    guide().description,
    ...guide().intro,
    ...guide().sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
    ...guide().faq.flatMap((f) => [f.question, f.answer]),
  ].join('\n');

// The worked example the guide prints, reassembled from its own bullets so the
// assertions below run the importer over exactly the JSON a reader would copy —
// not a second, hand-maintained copy that could drift away from the article.
const workedExampleJson = () => sectionBy('A worked example').bullets!.join('\n');

describe('import-postman-collection-without-postman guide', () => {
  it('exists exactly once, under developer-tools, with a unique slug', () => {
    const matches = GUIDES.filter((g) => g.slug === SLUG);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe('developer-tools');
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  it('has title/description metadata and a canonical path', () => {
    expect(guide().title).toBe('How to Open a Postman Collection Without Installing Postman');
    expect(guide().description.length).toBeGreaterThan(0);
    expect(guide().description.length).toBeLessThan(170);
    expect(guidePath(guide())).toBe('/guides/developer-tools/import-postman-collection-without-postman');
    expect(guide().noindex).toBeUndefined();
  });

  it('uses unique H2 section headings and a substantial structure', () => {
    const headings = guide().sections.map((s) => s.heading);
    expect(new Set(headings).size).toBe(headings.length);
    expect(headings.length).toBeGreaterThan(8);
    expect(guide().intro.length).toBeGreaterThan(0);
  });

  it('points its CTA at the API Request Builder', () => {
    expect(guide().ctaToolHref).toBe('/tools/developer/api-request-builder');
    expect(guide().ctaText).toContain('import your collection');
    expect(guide().ctaToolLabel).toBe('Try the free API Request Builder');
  });

  it('is listed on the API Request Builder tool page exactly once', () => {
    expect(API_REQUEST_BUILDER_GUIDE_SLUGS.filter((s) => s === SLUG).length).toBe(1);
    expect(new Set(API_REQUEST_BUILDER_GUIDE_SLUGS).size).toBe(API_REQUEST_BUILDER_GUIDE_SLUGS.length);
  });

  it('has related slugs that all resolve to real guides', () => {
    const related = getRelatedGuides(guide());
    expect(related.length).toBe(guide().relatedSlugs.length);
    expect(related.map((g) => g.slug)).toEqual([
      'how-to-test-an-api',
      'authentication-testing-examples',
      'curl-to-fetch-axios-python',
    ]);
    for (const slug of guide().relatedSlugs) expect(getGuideBySlug(slug)).toBeDefined();
  });

  it('names the UI controls the import flow actually has', () => {
    const steps = sectionBy('Step by step: import the collection').bullets!.join('\n');
    // Labels rendered by CollectionsBrowser.tsx / PostmanImportModal.tsx.
    expect(steps).toContain('Import Postman Collection');
    expect(steps).toContain('Choose a Postman Collection .json file');
    expect(steps).toContain('Choose a different file');
    expect(steps).toContain('/tools/developer/api-request-builder');
    expect(steps).toContain('(Imported)');
  });

  it('claims only the schema versions the validator accepts', () => {
    const doc = (schema: string) => validatePostmanDocument({ info: { name: 'X', schema }, item: [] });
    expect(doc('https://schema.getpostman.com/json/collection/v2.1.0/collection.json').doc!.schemaVersion).toBe('2.1');
    expect(doc('https://schema.getpostman.com/json/collection/v2.0.0/collection.json').doc!.schemaVersion).toBe('2.0');
    expect(doc('https://schema.getpostman.com/json/collection/v1.0.0/collection.json').ok).toBe(false);

    const text = allText();
    expect(text).toContain('v2.0 and v2.1');
    expect(text).toContain('https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
  });

  it('states the folder depth limit the collections module enforces', () => {
    expect(MAX_FOLDER_DEPTH).toBe(3);
    const depth = sectionBy('The folder depth limit').paragraphs.join('\n');
    expect(depth).toContain('three levels deep');
    expect(depth).toContain('flattened');
    // Must not imply unlimited nesting anywhere on the page.
    expect(allText()).not.toMatch(/unlimited nesting|any depth/i);
  });

  it('claims exactly the auth types convertPostmanAuth supports', () => {
    expect(convertPostmanAuth({ type: 'bearer', bearer: [{ key: 'token', value: '{{token}}' }] }).auth!.type).toBe('bearer');
    expect(convertPostmanAuth({ type: 'basic', basic: [] }).auth!.type).toBe('basic');
    expect(convertPostmanAuth({ type: 'apikey', apikey: [] }).auth!.type).toBe('api-key');
    expect(convertPostmanAuth({ type: 'noauth' }).auth!.type).toBe('none');

    for (const type of ['oauth2', 'awsv4', 'digest', 'hawk', 'ntlm', 'edgegrid']) {
      const result = convertPostmanAuth({ type });
      expect(result.auth).toBeNull();
      expect(result.warning).toBeTruthy();
    }

    const text = allText();
    expect(text).toContain('OAuth 2.0');
    // No claim of OAuth support anywhere.
    expect(text).toMatch(/OAuth 2\.0[^.]*(is not imported|do not)/);
    expect(text).not.toMatch(/OAuth[^.]{0,40}(is supported|fully imported|supported and imported)/i);
  });

  it('claims exactly the body modes convertPostmanBody supports', () => {
    expect(convertPostmanBody({ mode: 'raw', raw: '{"a":1}', options: { raw: { language: 'json' } } }).body.mode).toBe('json');
    expect(convertPostmanBody({ mode: 'raw', raw: 'plain' }).body.mode).toBe('text');
    expect(convertPostmanBody({ mode: 'urlencoded', urlencoded: [{ key: 'a', value: 'b' }] }).body.mode).toBe('form-urlencoded');

    const multipart = convertPostmanBody({ mode: 'formdata', formdata: [{ key: 'f', type: 'file', src: '/x/y.png' }] });
    expect(multipart.body.mode).toBe('multipart');
    expect(multipart.body.formFields[0].isFile).toBe(true);
    expect(multipart.warning).toBe('Some Postman file fields require local file re-selection.');

    expect(convertPostmanBody({ mode: 'file' }).warning).toBeTruthy();
    expect(convertPostmanBody({ mode: 'graphql', graphql: { query: '{ me }' } }).body.mode).toBe('text');

    const bodies = sectionBy('Request bodies').bullets!.join('\n');
    for (const mode of ['Raw JSON', 'Raw text', 'URL-encoded', 'Multipart form data', 'GraphQL', 'Binary file body']) {
      expect(bodies).toContain(mode);
    }
  });

  it('makes no false claim about scripts or dynamic variables', () => {
    const text = allText();
    expect(text).toContain('pre-request script');
    expect(text).toContain('{{$randomUUID}}');
    expect(text).toContain('{{$timestamp}}');
    expect(text).toMatch(/never executed|not executed|Never\./);
    expect(text).not.toMatch(/scripts? (are|is) (run|executed|supported)/i);
    expect(text).not.toMatch(/dynamic variables? (are|is) (evaluated|resolved|generated)/i);
  });

  it('describes redaction accurately and never claims encrypted storage', () => {
    const request = {
      ...createBlankRequest(),
      auth: { ...createBlankRequest().auth, type: 'bearer' as const, bearerToken: 'literal-secret' },
      headers: [{ id: 'h1', key: 'Authorization', value: 'Bearer literal-secret', enabled: true }],
    };
    const redacted = redactSecrets(request);
    expect(redacted.auth.bearerToken).toBe('');
    expect(redacted.headers[0].value).toBe('');

    const text = allText();
    expect(text).toContain('not encrypted');
    expect(text).not.toMatch(/encrypted (local ?storage|at rest)/i);
    expect(text).not.toMatch(/credentials? (can )?never be exposed/i);
  });

  it("the worked example imports into what the guide says it does", () => {
    const outcome = buildPostmanImportPlan(workedExampleJson(), [], []);
    expect(outcome.ok).toBe(true);

    expect(outcome.summary!.title).toBe('Orders API');
    expect(outcome.summary!.schemaVersion).toBe('2.1');
    expect(outcome.summary!.requestCount).toBe(1);
    expect(outcome.summary!.folderCount).toBe(1);
    expect(outcome.summary!.variableCount).toBe(1);
    expect(outcome.warnings).toEqual([]);

    const plan = outcome.plan!;
    expect(plan.collection.name).toBe('Orders API (Imported)');
    expect(plan.folders[0].name).toBe('Orders');
    expect(plan.requests[0].name).toBe('List Orders');
    expect(plan.requests[0].folderId).toBe(plan.folders[0].id);

    const request = plan.requests[0].request;
    expect(request.method).toBe('GET');
    expect(request.url).toBe('{{baseUrl}}/orders');
    expect(request.params.map((p) => [p.key, p.value])).toEqual([['status', 'open']]);
    expect(request.headers.map((h) => [h.key, h.value])).toEqual([['Accept', 'application/json']]);

    expect(plan.environment!.name).toBe('Orders API (Imported)');
    expect(plan.environment!.variables.map((v) => [v.key, v.value])).toEqual([['baseUrl', 'https://api.example.com']]);

    // Every claim the follow-up section makes about this example.
    const outcomeText = sectionBy('What the importer makes of that example').paragraphs.join('\n');
    expect(outcomeText).toContain('Orders API (Imported)');
    expect(outcomeText).toContain('{{baseUrl}}/orders');
    expect(outcomeText).toContain('not activated');
  });

  it('contains no credential-shaped value or filesystem path', () => {
    const text = allText();
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(text).not.toMatch(/sk_(live|test)_[A-Za-z0-9]+/);
    expect(text).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(text).not.toMatch(/\/(home|Users|tmp|var|mnt)\//);
  });
});
