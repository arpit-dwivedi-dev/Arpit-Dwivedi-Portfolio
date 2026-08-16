import { getGuideBySlug } from '../../content/guides/data';
import { TOOLS, getRelatedTools } from '../registry';
import { API_REQUEST_BUILDER_FAQ, API_REQUEST_BUILDER_GUIDE_SLUGS } from './seoContent';

describe('API_REQUEST_BUILDER_FAQ', () => {
  it('has no empty questions or answers', () => {
    for (const item of API_REQUEST_BUILDER_FAQ) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate questions', () => {
    const questions = API_REQUEST_BUILDER_FAQ.map((item) => item.question);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it('never claims requests never leave the browser (proxy fallback makes that false)', () => {
    for (const item of API_REQUEST_BUILDER_FAQ) {
      expect(item.answer.toLowerCase()).not.toContain('never leave your browser');
    }
  });
});

describe('API_REQUEST_BUILDER_GUIDE_SLUGS', () => {
  it('only references guide slugs that actually exist', () => {
    for (const slug of API_REQUEST_BUILDER_GUIDE_SLUGS) {
      expect(getGuideBySlug(slug)).toBeDefined();
    }
  });
});

describe('API Request Builder registry entry', () => {
  it('is linked to the DBML Diagram Builder as a related tool', () => {
    const tool = TOOLS.find((t) => t.id === 'api-request-builder')!;
    const related = getRelatedTools(tool);
    expect(related.some((t) => t.id === 'dbml-diagram-builder')).toBe(true);
  });

  it('does not overclaim "no server" given the CORS proxy fallback exists', () => {
    const tool = TOOLS.find((t) => t.id === 'api-request-builder')!;
    expect(tool.description.toLowerCase()).not.toContain('no server');
  });
});
