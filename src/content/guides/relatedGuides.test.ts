import { GUIDES, getRelatedGuides } from './data';

// Library-wide invariant behind the related-guides fix: the renderer
// (GuidePage) shows getRelatedGuides(guide) verbatim, so a guide that declares
// more slugs than the default limit renders would drop authored links with no
// visible sign. Guard it for every guide rather than the two that hit it.
describe('related guides render without silent truncation', () => {
  it.each(GUIDES.map((guide) => [guide.slug, guide] as const))('%s renders every declared related slug', (_slug, guide) => {
    const rendered = getRelatedGuides(guide);
    expect(rendered.map((related) => related.slug)).toEqual(guide.relatedSlugs);
  });

  it('never declares a guide as related to itself, or twice', () => {
    for (const guide of GUIDES) {
      expect(guide.relatedSlugs).not.toContain(guide.slug);
      expect(new Set(guide.relatedSlugs).size).toBe(guide.relatedSlugs.length);
    }
  });
});
