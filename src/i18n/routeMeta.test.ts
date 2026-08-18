import { ROUTE_META, ROUTE_KEY_BY_PATH, isEnglishOnlyPath, resolveLanguagePath } from './routeMeta';

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

describe('/vcard-qr-code route metadata', () => {
  it('maps to its own route key instead of falling back to the hub or homepage default', () => {
    expect(ROUTE_KEY_BY_PATH['/vcard-qr-code']).toBe('vcardQrCode');
    expect(ROUTE_KEY_BY_PATH['/vcard-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/tools/generators/qr-code-generator']);
  });

  it('has an English title/description distinct from the QR hub, mentioning vCard/contact intent', () => {
    const vcard = ROUTE_META.en.vcardQrCode;
    const hub = ROUTE_META.en.qrCodeGenerator;
    expect(vcard.title).not.toBe(hub.title);
    expect(vcard.description).not.toBe(hub.description);
    expect(vcard.title.toLowerCase()).toContain('vcard');
    expect(vcard.description.toLowerCase()).toContain('contact');
  });

  it('has no /hi/vcard-qr-code route entry — the page is English-only by design', () => {
    expect(ROUTE_KEY_BY_PATH['/hi/vcard-qr-code']).toBeUndefined();
  });
});

describe('/menu-qr-code route metadata', () => {
  it('maps to its own route key instead of falling back to the hub, vCard, or homepage default', () => {
    expect(ROUTE_KEY_BY_PATH['/menu-qr-code']).toBe('menuQrCode');
    expect(ROUTE_KEY_BY_PATH['/menu-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/tools/generators/qr-code-generator']);
    expect(ROUTE_KEY_BY_PATH['/menu-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/vcard-qr-code']);
  });

  it('has the menu-intent English title and description, distinct from the QR hub', () => {
    const menu = ROUTE_META.en.menuQrCode;
    const hub = ROUTE_META.en.qrCodeGenerator;

    expect(menu.title).toBe('Menu QR Code Generator – For Restaurants & Cafés | 101 Tech Labs');
    expect(menu.title).not.toBe(hub.title);
    expect(menu.description).not.toBe(hub.description);
    expect(menu.description.toLowerCase()).toContain('menu');
  });

  it('keeps the description within a sane SERP length and free of keyword stuffing', () => {
    const { description } = ROUTE_META.en.menuQrCode;
    expect(description.length).toBeLessThanOrEqual(160);

    // "menu" belongs in the description once; repeating it (or piling in every
    // secondary phrase) is the failure mode this page is meant to avoid.
    const menuMentions = description.toLowerCase().match(/menu/g) ?? [];
    expect(menuMentions).toHaveLength(1);
    expect(description.toLowerCase()).not.toContain('restaurant qr code menu');
    expect(description.toLowerCase()).not.toContain('digital menu qr code');
  });

  it('has no /hi/menu-qr-code route entry — the page is English-only by design', () => {
    expect(ROUTE_KEY_BY_PATH['/hi/menu-qr-code']).toBeUndefined();
  });
});

describe('/wifi-qr-code route metadata', () => {
  it('maps to its own route key instead of falling back to the hub or other landing pages', () => {
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).toBe('wifiQrCode');
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/tools/generators/qr-code-generator']);
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/vcard-qr-code']);
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/menu-qr-code']);
  });

  it('has the wifi-intent English title and description, distinct from the QR hub', () => {
    const wifi = ROUTE_META.en.wifiQrCode;
    const hub = ROUTE_META.en.qrCodeGenerator;

    expect(wifi.title).toBe('WiFi QR Code Generator – Free, No Signup | 101 Tech Labs');
    expect(wifi.title).not.toBe(hub.title);
    expect(wifi.description).not.toBe(hub.description);
    expect(wifi.description.toLowerCase()).toContain('wifi');
    expect(wifi.description.toLowerCase()).toContain('password');
  });

  it('keeps the description within a sane SERP length', () => {
    expect(ROUTE_META.en.wifiQrCode.description.length).toBeLessThanOrEqual(160);
  });

  it('has no /hi/wifi-qr-code route entry — the page is English-only by design', () => {
    expect(ROUTE_KEY_BY_PATH['/hi/wifi-qr-code']).toBeUndefined();
  });
});

describe('isEnglishOnlyPath', () => {
  it('flags the QR landing pages and the DBML tool as English-only', () => {
    expect(isEnglishOnlyPath('/vcard-qr-code')).toBe(true);
    expect(isEnglishOnlyPath('/menu-qr-code')).toBe(true);
    expect(isEnglishOnlyPath('/wifi-qr-code')).toBe(true);
    expect(isEnglishOnlyPath('/tools/developer/dbml-diagram-builder')).toBe(true);
  });

  it('flags /guides and /blog, including their dynamic child routes', () => {
    expect(isEnglishOnlyPath('/guides')).toBe(true);
    expect(isEnglishOnlyPath('/guides/invoicing')).toBe(true);
    expect(isEnglishOnlyPath('/guides/qr-code/how-to-make-a-qr-code')).toBe(true);
    expect(isEnglishOnlyPath('/blog')).toBe(true);
    expect(isEnglishOnlyPath('/blog/some-post')).toBe(true);
  });

  it('does not flag the bilingual QR hub or other bilingual routes', () => {
    expect(isEnglishOnlyPath('/tools/generators/qr-code-generator')).toBe(false);
    expect(isEnglishOnlyPath('/')).toBe(false);
    expect(isEnglishOnlyPath('/about')).toBe(false);
    expect(isEnglishOnlyPath('/tools/developer')).toBe(false);
    expect(isEnglishOnlyPath('/tools/developer/api-request-builder')).toBe(false);
  });

  it('does not false-positive on routes that merely share a prefix', () => {
    // Guards against a naive `startsWith('/guides')` match — a hypothetical
    // bilingual route like /guides-hub should not be swept in.
    expect(isEnglishOnlyPath('/guides-hub')).toBe(false);
    expect(isEnglishOnlyPath('/blogging')).toBe(false);
  });
});

describe('resolveLanguagePath', () => {
  it('routes English-only pages to their /hi/... equivalent when switching to English (no-op)', () => {
    expect(resolveLanguagePath('/vcard-qr-code', 'en', '')).toBe('/vcard-qr-code');
  });

  it('keeps the visitor on the same English-only page instead of a dead /hi/... route when the target is Hindi', () => {
    expect(resolveLanguagePath('/vcard-qr-code', 'hi', '')).toBe('/vcard-qr-code');
    expect(resolveLanguagePath('/menu-qr-code', 'hi', '')).toBe('/menu-qr-code');
    expect(resolveLanguagePath('/wifi-qr-code', 'hi', '')).toBe('/wifi-qr-code');
    expect(resolveLanguagePath('/tools/developer/dbml-diagram-builder', 'hi', '')).toBe(
      '/tools/developer/dbml-diagram-builder',
    );
    expect(resolveLanguagePath('/guides', 'hi', '')).toBe('/guides');
  });

  it('preserves the hash on English-only pages', () => {
    expect(resolveLanguagePath('/vcard-qr-code', 'hi', '#faq')).toBe('/vcard-qr-code#faq');
  });

  it('still resolves the real /hi/... path for bilingual routes, including the QR hub', () => {
    expect(resolveLanguagePath('/tools/generators/qr-code-generator', 'hi', '')).toBe(
      '/hi/tools/generators/qr-code-generator',
    );
    expect(resolveLanguagePath('/', 'hi', '')).toBe('/hi');
    expect(resolveLanguagePath('/about', 'hi', '#team')).toBe('/hi/about#team');
  });

  it('strips the /hi prefix back off for bilingual routes when switching to English', () => {
    expect(resolveLanguagePath('/tools/generators/qr-code-generator', 'en', '')).toBe(
      '/tools/generators/qr-code-generator',
    );
  });
});
