import { GUIDES, getGuideBySlug, getRelatedGuides } from './data';
import { guidePath } from './categories';
import { API_REQUEST_BUILDER_GUIDE_SLUGS } from '../../tools/apiRequestBuilder/seoContent';
import { buildOpenApiImportPlan } from '../../tools/apiRequestBuilder/openapi';
import { validateOpenApiDocument } from '../../tools/apiRequestBuilder/openapi/validator';
import { convertSecurityScheme } from '../../tools/apiRequestBuilder/openapi/security';
import { convertPathTemplate } from '../../tools/apiRequestBuilder/openapi/operationConverter';
import { parseOpenApiText } from '../../tools/apiRequestBuilder/openapi/parser';
import { isLocalRef } from '../../tools/apiRequestBuilder/openapi/refs';

const SLUG = 'test-openapi-spec-online';

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

// The example spec the guide prints, reassembled from its own bullets so every
// assertion below runs the real importer over exactly the YAML a reader would
// copy — not a second, hand-maintained copy that could drift from the article.
const exampleSpecYaml = () => sectionBy('A small OpenAPI spec to try').bullets!.join('\n');

describe('test-openapi-spec-online guide', () => {
  it('exists exactly once, under developer-tools, with a unique slug', () => {
    const matches = GUIDES.filter((g) => g.slug === SLUG);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe('developer-tools');
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  it('has title/description metadata and a canonical path', () => {
    expect(guide().title).toBe('How to Test an OpenAPI Spec Online');
    expect(guide().description.length).toBeGreaterThan(0);
    expect(guide().description.length).toBeLessThan(170);
    expect(guide().description).toMatch(/OpenAPI 3\.0 or 3\.1/);
    expect(guidePath(guide())).toBe('/guides/developer-tools/test-openapi-spec-online');
    expect(guide().noindex).toBeUndefined();
  });

  it('uses unique H2 section headings and a substantial structure', () => {
    const headings = guide().sections.map((s) => s.heading);
    expect(new Set(headings).size).toBe(headings.length);
    expect(headings.length).toBeGreaterThan(8);
    expect(guide().intro.length).toBeGreaterThan(0);
  });

  it('renders every bullet under a distinct React key', () => {
    for (const section of guide().sections) {
      const bullets = section.bullets ?? [];
      expect(new Set(bullets).size).toBe(bullets.length);
    }
  });

  it('points its CTA at the API Request Builder', () => {
    expect(guide().ctaToolHref).toBe('/tools/developer/api-request-builder');
    expect(guide().ctaText).toContain('Import your OpenAPI spec');
    expect(guide().ctaToolLabel).toBe('Try the free API Request Builder');
  });

  it('is listed on the API Request Builder tool page exactly once', () => {
    expect(API_REQUEST_BUILDER_GUIDE_SLUGS.filter((s) => s === SLUG).length).toBe(1);
    expect(new Set(API_REQUEST_BUILDER_GUIDE_SLUGS).size).toBe(API_REQUEST_BUILDER_GUIDE_SLUGS.length);
  });

  it('has related slugs that all resolve, with the visible three first', () => {
    for (const slug of guide().relatedSlugs) expect(getGuideBySlug(slug)).toBeDefined();
    // GuidePage renders getRelatedGuides()'s default limit of three.
    expect(getRelatedGuides(guide()).map((g) => g.slug)).toEqual([
      'import-postman-collection-without-postman',
      'how-to-test-an-api',
      'authentication-testing-examples',
    ]);
    expect(guide().relatedSlugs).toContain('curl-to-fetch-axios-python');
    expect(guide().relatedSlugs).toContain('json-post-request-example');
  });

  it('names the UI controls the import flow actually has', () => {
    const steps = sectionBy('Step by step: import the spec').bullets!.join('\n');
    // Labels rendered by CollectionsBrowser.tsx / OpenApiImportModal.tsx.
    expect(steps).toContain('Import OpenAPI');
    expect(steps).toContain('Choose a .json, .yaml, or .yml file');
    expect(steps).toContain('Choose a different file');
    expect(steps).toContain('/tools/developer/api-request-builder');
    expect(steps).toContain('(Imported)');
    // Never claims the import sends anything.
    expect(allText()).not.toMatch(/import[^.]{0,40}(sends|executes) (the |your )?requests?/i);
  });

  it('claims exactly the OpenAPI versions the validator accepts', () => {
    const doc = (version: string) => validateOpenApiDocument({ openapi: version, info: { title: 'X' }, paths: {} });
    expect(doc('3.0.3').ok).toBe(true);
    expect(doc('3.1.0').ok).toBe(true);
    expect(doc('2.0.0').ok).toBe(false);
    expect(validateOpenApiDocument({ swagger: '2.0', paths: {} }).ok).toBe(false);
    expect(validateOpenApiDocument({ swagger: '2.0', paths: {} }).error).toContain('OpenAPI 3.0 and 3.1');

    const text = allText();
    expect(text).toContain('OpenAPI 3.0.x and OpenAPI 3.1.x');
    expect(text).toContain('Swagger 2.0 is not supported');
    expect(text).not.toMatch(/Swagger 2\.0[^.]{0,40}(is supported|works|imports fine)/i);
  });

  it('is accurate that format detection is by parsing, not extension', () => {
    // A ".yaml" file whose content is JSON, and YAML content, both parse.
    expect(parseOpenApiText('{"openapi":"3.1.0"}').ok).toBe(true);
    expect(parseOpenApiText('openapi: 3.1.0').ok).toBe(true);
    expect(parseOpenApiText('').ok).toBe(false);

    const text = allText();
    expect(text).toContain('determined by parsing, not by the extension');
    expect(text).toContain('.json`, `.yaml`, and `.yml');
  });

  it('claims exactly the security schemes convertSecurityScheme supports', () => {
    expect(convertSecurityScheme({ type: 'http', scheme: 'bearer' }, 'b').auth!.type).toBe('bearer');
    expect(convertSecurityScheme({ type: 'http', scheme: 'basic' }, 'b').auth!.type).toBe('basic');

    const apiKey = convertSecurityScheme({ type: 'apiKey', in: 'header', name: 'X-Api-Key' }, 'k');
    expect(apiKey.auth!.type).toBe('api-key');
    expect(apiKey.auth!.apiKeyName).toBe('X-Api-Key');

    for (const scheme of [{ type: 'oauth2' }, { type: 'openIdConnect' }, { type: 'mutualTLS' }, { type: 'apiKey', in: 'cookie' }, { type: 'http', scheme: 'digest' }]) {
      const result = convertSecurityScheme(scheme, 'x');
      expect(result.auth).toBeNull();
      expect(result.warning).toBeTruthy();
    }

    // Secret values are never carried over, even when the document supplies one.
    const bearer = convertSecurityScheme({ type: 'http', scheme: 'bearer' }, 'b').auth!;
    expect(bearer.bearerToken).toBe('');
    expect(convertSecurityScheme({ type: 'apiKey', in: 'header', name: 'k' }, 'k').auth!.apiKeyValue).toBe('');

    const text = allText();
    expect(text).toMatch(/OAuth 2\.0[^.]*not imported/);
    expect(text).not.toMatch(/OAuth[^.]{0,40}(is supported|fully imported)/i);
    expect(text).not.toMatch(/(fetch|acquire|obtain)e?s? (a|the|your) (OAuth )?token (for you|on your behalf)/i);
  });

  it('is accurate that only local $refs are followed', () => {
    expect(isLocalRef('#/components/schemas/User')).toBe(true);
    expect(isLocalRef('https://example.com/spec.yaml#/components/schemas/User')).toBe(false);
    expect(isLocalRef('./common.yaml#/User')).toBe(false);

    const text = allText();
    expect(text).toContain('#/components/schemas/User');
    expect(text).toContain('Remote references are intentionally never fetched');
  });

  it('describes path templating the way convertPathTemplate implements it', () => {
    expect(convertPathTemplate('/users/{userId}')).toBe('/users/{{userId}}');
    expect(allText()).toContain('{{baseUrl}}/users/{{userId}}');
  });

  it('the example spec imports into exactly what the guide says', () => {
    const outcome = buildOpenApiImportPlan(exampleSpecYaml(), [], []);
    expect(outcome.ok).toBe(true);

    const summary = outcome.summary!;
    expect(summary.title).toBe('Demo API');
    expect(summary.version).toBe('3.1.0');
    expect(summary.operationCount).toBe(2);
    expect(summary.folderCount).toBe(2);
    expect(summary.tagCount).toBe(2);
    expect(summary.serverCount).toBe(1);
    expect(summary.securitySchemeCount).toBe(1);
    expect(outcome.warnings).toEqual([]);
    expect(outcome.skippedOperationCount).toBe(0);

    const plan = outcome.plan!;
    expect(plan.collection.name).toBe('Demo API (Imported)');
    expect(plan.folders.map((f) => f.name)).toEqual(['Users', 'Orders']);

    const byName = (name: string) => plan.requests.find((r) => r.name === name)!;

    // GET: operationId name, templated path variable, query default, inherited bearer auth.
    const get = byName('getUser');
    expect(get.request.method).toBe('GET');
    expect(get.request.url).toBe('{{baseUrl}}/anything/users/{{userId}}');
    expect(get.request.params.map((p) => [p.key, p.value])).toEqual([['include', 'profile']]);
    expect(get.request.auth.type).toBe('bearer');
    expect(get.request.auth.bearerToken).toBe('');
    expect(get.folderId).toBe(plan.folders[0].id);

    // POST: $ref-resolved schema turned into an editable JSON sample.
    const post = byName('createOrder');
    expect(post.request.method).toBe('POST');
    expect(post.request.url).toBe('{{baseUrl}}/anything/orders');
    expect(post.request.body.mode).toBe('json');
    expect(JSON.parse(post.request.body.raw)).toEqual({ sku: '', quantity: 0 });
    expect(post.request.auth.type).toBe('bearer');
    expect(post.folderId).toBe(plan.folders[1].id);

    // Server becomes a baseUrl environment variable; the path variable does not.
    expect(plan.environment!.name).toBe('Demo API (Imported)');
    expect(plan.environment!.variables.map((v) => [v.key, v.value])).toEqual([['baseUrl', 'https://httpbin.org']]);
  });

  it('generates the body sample the guide prints for its schema snippet', () => {
    const schemaYaml = sectionBy('How request bodies are generated').bullets!.join('\n');
    const printed = sectionBy('What schema-generated bodies look like').bullets!.join('\n');

    const spec = [
      'openapi: 3.1.0',
      'info: { title: Body Demo, version: 1.0.0 }',
      'paths:',
      '  /demo:',
      '    post:',
      '      requestBody:',
      '        content:',
      '          application/json:',
      '            schema:',
      ...schemaYaml.split('\n').map((line) => `              ${line}`),
      '      responses: { "200": { description: OK } }',
    ].join('\n');

    const outcome = buildOpenApiImportPlan(spec, [], []);
    expect(outcome.ok).toBe(true);
    expect(JSON.parse(outcome.plan!.requests[0].request.body.raw)).toEqual(JSON.parse(printed));
  });

  it('reports the same limits the parser and validator enforce', () => {
    const text = allText();
    expect(text).toContain('5MB');
    // Rejection cases must match validateOpenApiDocument / buildOpenApiImportPlan.
    expect(buildOpenApiImportPlan('openapi: 3.1.0\ninfo: { title: X }\n', [], []).ok).toBe(false);
    expect(buildOpenApiImportPlan('openapi: 3.1.0\ninfo: { title: X }\npaths: {}\n', [], []).error).toContain('No importable operations');
    expect(text).toContain('no `paths` object');
  });

  it('states that the generated environment is not activated', () => {
    const text = allText();
    expect(text).toContain('does not activate that environment');
    expect(text).not.toMatch(/environment is (made |set )?active automatically/i);
  });

  it('contains no credential-shaped value or filesystem path', () => {
    const text = allText();
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(text).not.toMatch(/sk_(live|test)_[A-Za-z0-9]+/);
    expect(text).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(text).not.toMatch(/\/(home|Users|tmp|var|mnt)\//);
  });
});
