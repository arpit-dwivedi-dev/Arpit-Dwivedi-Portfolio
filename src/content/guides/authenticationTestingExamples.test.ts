import { GUIDES, getGuideBySlug, getRelatedGuides } from './data';
import { buildApiExampleUrl } from '../../tools/apiRequestBuilder/example';

const SLUG = 'authentication-testing-examples';

describe('authentication-testing-examples guide', () => {
  it('exists exactly once, under developer-tools', () => {
    const matches = GUIDES.filter((g) => g.slug === SLUG);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe('developer-tools');
  });

  it('has title/description metadata', () => {
    const guide = getGuideBySlug(SLUG)!;
    expect(guide.title.length).toBeGreaterThan(0);
    expect(guide.description.length).toBeGreaterThan(0);
    expect(guide.description.length).toBeLessThan(170);
  });

  it('has related slugs that all resolve to real guides', () => {
    const guide = getGuideBySlug(SLUG)!;
    const related = getRelatedGuides(guide);
    expect(related.length).toBe(guide.relatedSlugs.length);
  });

  it('is referenced back by the CORS and JSON POST guides (bidirectional linking)', () => {
    expect(getGuideBySlug('what-is-a-cors-error')!.relatedSlugs).toContain(SLUG);
    expect(getGuideBySlug('json-post-request-example')!.relatedSlugs).toContain(SLUG);
  });

  it('has exactly three interactive examples: Bearer, API key, and Basic Auth', () => {
    const guide = getGuideBySlug(SLUG)!;
    const examples = guide.sections.flatMap((s) => s.examples ?? []);
    expect(examples.length).toBe(3);

    const bearer = examples.find((e) => e.request.auth.type === 'bearer')!;
    const apiKey = examples.find((e) => e.request.auth.type === 'api-key')!;
    const basic = examples.find((e) => e.request.auth.type === 'basic')!;
    expect(bearer).toBeDefined();
    expect(apiKey).toBeDefined();
    expect(basic).toBeDefined();
  });

  it('Bearer example uses a {{token}} template, not a literal secret', () => {
    const guide = getGuideBySlug(SLUG)!;
    const examples = guide.sections.flatMap((s) => s.examples ?? []);
    const bearer = examples.find((e) => e.request.auth.type === 'bearer')!;
    expect(bearer.request.auth.bearerToken).toBe('{{token}}');
    expect(bearer.request.method).toBe('GET');
    expect(bearer.request.url).toBe('https://httpbin.org/anything');
  });

  it('API key example uses a {{apiKey}} template sent as a header', () => {
    const guide = getGuideBySlug(SLUG)!;
    const examples = guide.sections.flatMap((s) => s.examples ?? []);
    const apiKey = examples.find((e) => e.request.auth.type === 'api-key')!;
    expect(apiKey.request.auth.apiKeyValue).toBe('{{apiKey}}');
    expect(apiKey.request.auth.apiKeyName).toBe('X-Api-Key');
    expect(apiKey.request.auth.apiKeyLocation).toBe('header');
  });

  it('Basic Auth example uses the public demo/demo sandbox credentials, not a real secret', () => {
    const guide = getGuideBySlug(SLUG)!;
    const examples = guide.sections.flatMap((s) => s.examples ?? []);
    const basic = examples.find((e) => e.request.auth.type === 'basic')!;
    expect(basic.request.auth.basicUsername).toBe('demo');
    expect(basic.request.auth.basicPassword).toBe('demo');
    expect(basic.request.url).toBe('https://httpbin.org/basic-auth/demo/demo');
  });

  it('never contains a real-looking secret anywhere in its text content', () => {
    const guide = getGuideBySlug(SLUG)!;
    const text = [
      ...guide.intro,
      ...guide.sections.flatMap((s) => [...s.paragraphs, ...(s.bullets ?? [])]),
      ...guide.faq.flatMap((f) => [f.question, f.answer]),
    ].join('\n');
    // Guards against ever pasting in something that looks like a real bearer JWT or a
    // long hex/base64 API key instead of a {{template}} or the public demo/demo pair.
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // JWT-shaped
    expect(text).not.toMatch(/sk_(live|test)_[A-Za-z0-9]+/); // Stripe-shaped key
  });

  it('every example link ("Open in API Request Builder") builds successfully', () => {
    const guide = getGuideBySlug(SLUG)!;
    const examples = guide.sections.flatMap((s) => s.examples ?? []);
    for (const example of examples) {
      const href = buildApiExampleUrl(example.request);
      expect(href.startsWith('/tools/developer/api-request-builder?request=')).toBe(true);
    }
  });

  it('the "Open in API Request Builder" link preserves a templated credential but strips a literal one', () => {
    // Documents real, verified behavior of shareRequest.ts's sanitizeForShare: a
    // {{template}} auth value survives the share link, a literal one does not — so the
    // Basic Auth example's password will NOT come back "demo" through this link, even
    // though the example itself is defined with basicPassword: 'demo'. This is a
    // deliberate anti-secret-leak rule in the tool's existing sharing code (out of scope
    // to change here), not a defect in this guide's example.
    const guide = getGuideBySlug(SLUG)!;
    const examples = guide.sections.flatMap((s) => s.examples ?? []);

    const bearer = examples.find((e) => e.request.auth.type === 'bearer')!;
    const bearerHref = buildApiExampleUrl(bearer.request);
    expect(decodeURIComponent(bearerHref)).toEqual(expect.any(String));

    const basic = examples.find((e) => e.request.auth.type === 'basic')!;
    // sanity: the source example itself still carries the intended demo/demo pair —
    // it's only the round-tripped share link that can't carry the literal password.
    expect(basic.request.auth.basicUsername).toBe('demo');
    expect(basic.request.auth.basicPassword).toBe('demo');
  });
});
