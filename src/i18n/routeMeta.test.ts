import { ROUTE_META, ROUTE_KEY_BY_PATH } from './routeMeta';

describe('/tools/developer route metadata', () => {
  it('maps to its own route key instead of falling back to the homepage default', () => {
    expect(ROUTE_KEY_BY_PATH['/tools/developer']).toBe('toolsDeveloper');
  });

  it('has a title/description distinct from the homepage', () => {
    const developer = ROUTE_META.toolsDeveloper;
    const home = ROUTE_META.home;
    expect(developer.title).not.toBe(home.title);
    expect(developer.description).not.toBe(home.description);
    expect(developer.title).toContain('Developer Tools');
  });
});

describe('API Request Builder route metadata', () => {
  it('mentions the tool, REST APIs, and browser-based positioning without keyword stuffing', () => {
    const { title, description } = ROUTE_META.apiRequestBuilder;
    expect(title.toLowerCase()).toContain('api request builder');
    expect(title.length).toBeLessThan(70);
    expect(description.toLowerCase()).toContain('rest api');
    expect(description.toLowerCase()).toContain('browser');
  });

  it('does not overclaim "no server" given the CORS proxy fallback exists', () => {
    expect(ROUTE_META.apiRequestBuilder.description.toLowerCase()).not.toContain('no server');
  });
});

describe('ROUTE_META', () => {
  it('gives every mapped path a metadata entry', () => {
    for (const [path, key] of Object.entries(ROUTE_KEY_BY_PATH)) {
      expect(ROUTE_META[key]).toBeDefined();
      expect(ROUTE_META[key].title).toEqual(expect.stringContaining('101 Tech Labs'));
      expect(ROUTE_META[key].description.length).toBeGreaterThan(0);
      expect(path.startsWith('/')).toBe(true);
    }
  });

  // The /hi Hindi mirror was retired — its routes now resolve through
  // HindiRedirect in App.tsx, so nothing under /hi should have route
  // metadata of its own (that would imply a real, indexable page).
  it('has no /hi route entries left over from the retired Hindi mirror', () => {
    const hiPaths = Object.keys(ROUTE_KEY_BY_PATH).filter((path) => path === '/hi' || path.startsWith('/hi/'));
    expect(hiPaths).toEqual([]);
  });
});

describe('/vcard-qr-code route metadata', () => {
  it('maps to its own route key instead of falling back to the hub or homepage default', () => {
    expect(ROUTE_KEY_BY_PATH['/vcard-qr-code']).toBe('vcardQrCode');
    expect(ROUTE_KEY_BY_PATH['/vcard-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/tools/generators/qr-code-generator']);
  });

  it('has a title/description distinct from the QR hub, mentioning vCard/contact intent', () => {
    const vcard = ROUTE_META.vcardQrCode;
    const hub = ROUTE_META.qrCodeGenerator;
    expect(vcard.title).not.toBe(hub.title);
    expect(vcard.description).not.toBe(hub.description);
    expect(vcard.title.toLowerCase()).toContain('vcard');
    expect(vcard.description.toLowerCase()).toContain('contact');
  });
});

describe('/menu-qr-code route metadata', () => {
  it('maps to its own route key instead of falling back to the hub, vCard, or homepage default', () => {
    expect(ROUTE_KEY_BY_PATH['/menu-qr-code']).toBe('menuQrCode');
    expect(ROUTE_KEY_BY_PATH['/menu-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/tools/generators/qr-code-generator']);
    expect(ROUTE_KEY_BY_PATH['/menu-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/vcard-qr-code']);
  });

  it('has the menu-intent title and description, distinct from the QR hub', () => {
    const menu = ROUTE_META.menuQrCode;
    const hub = ROUTE_META.qrCodeGenerator;

    expect(menu.title).toBe('Menu QR Code Generator – For Restaurants & Cafés | 101 Tech Labs');
    expect(menu.title).not.toBe(hub.title);
    expect(menu.description).not.toBe(hub.description);
    expect(menu.description.toLowerCase()).toContain('menu');
  });

  it('keeps the description within a sane SERP length and free of keyword stuffing', () => {
    const { description } = ROUTE_META.menuQrCode;
    expect(description.length).toBeLessThanOrEqual(160);

    // "menu" belongs in the description once; repeating it (or piling in every
    // secondary phrase) is the failure mode this page is meant to avoid.
    const menuMentions = description.toLowerCase().match(/menu/g) ?? [];
    expect(menuMentions).toHaveLength(1);
    expect(description.toLowerCase()).not.toContain('restaurant qr code menu');
    expect(description.toLowerCase()).not.toContain('digital menu qr code');
  });
});

describe('/wifi-qr-code route metadata', () => {
  it('maps to its own route key instead of falling back to the hub or other landing pages', () => {
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).toBe('wifiQrCode');
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/tools/generators/qr-code-generator']);
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/vcard-qr-code']);
    expect(ROUTE_KEY_BY_PATH['/wifi-qr-code']).not.toBe(ROUTE_KEY_BY_PATH['/menu-qr-code']);
  });

  it('has the wifi-intent title and description, distinct from the QR hub', () => {
    const wifi = ROUTE_META.wifiQrCode;
    const hub = ROUTE_META.qrCodeGenerator;

    expect(wifi.title).toBe('WiFi QR Code Generator – Free, No Signup | 101 Tech Labs');
    expect(wifi.title).not.toBe(hub.title);
    expect(wifi.description).not.toBe(hub.description);
    expect(wifi.description.toLowerCase()).toContain('wifi');
    expect(wifi.description.toLowerCase()).toContain('password');
  });

  it('keeps the description within a sane SERP length', () => {
    expect(ROUTE_META.wifiQrCode.description.length).toBeLessThanOrEqual(160);
  });
});
