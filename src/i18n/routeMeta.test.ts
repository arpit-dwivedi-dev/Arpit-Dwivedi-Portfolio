import { ROUTE_META, ROUTE_KEY_BY_PATH } from './routeMeta';

describe('/tools/developer route metadata', () => {
  it('maps to its own route key instead of falling back to the homepage default', () => {
    expect(ROUTE_KEY_BY_PATH['/tools/developer']).toBe('toolsDeveloper');
  });

  it('has an English title/description distinct from the homepage', () => {
    const developer = ROUTE_META.en.toolsDeveloper;
    const home = ROUTE_META.en.home;
    expect(developer.title).not.toBe(home.title);
    expect(developer.description).not.toBe(home.description);
    expect(developer.title).toContain('Developer Tools');
  });

  it('has a Hindi title/description distinct from the homepage', () => {
    const developer = ROUTE_META.hi.toolsDeveloper;
    const home = ROUTE_META.hi.home;
    expect(developer.title).not.toBe(home.title);
    expect(developer.description).not.toBe(home.description);
  });
});

describe('API Request Builder route metadata', () => {
  it('mentions the tool, REST APIs, and browser-based positioning without keyword stuffing', () => {
    const { title, description } = ROUTE_META.en.apiRequestBuilder;
    expect(title.toLowerCase()).toContain('api request builder');
    expect(title.length).toBeLessThan(70);
    expect(description.toLowerCase()).toContain('rest api');
    expect(description.toLowerCase()).toContain('browser');
  });

  it('does not overclaim "no server" given the CORS proxy fallback exists', () => {
    expect(ROUTE_META.en.apiRequestBuilder.description.toLowerCase()).not.toContain('no server');
  });
});

describe('ROUTE_META', () => {
  it('defines the same set of route keys for every language', () => {
    const enKeys = Object.keys(ROUTE_META.en).sort();
    const hiKeys = Object.keys(ROUTE_META.hi).sort();
    expect(hiKeys).toEqual(enKeys);
  });
});
