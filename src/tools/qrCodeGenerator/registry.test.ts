import { createBlankForms, type QrForms, type QrTypeId } from './types';
import { QR_TYPE_REGISTRY, buildQrValue, getQrTypeDefinition, validateQrInput } from './encode';

describe('qr code registry and validation foundation', () => {
  it('resolves every supported QR type from the registry', () => {
    const supportedTypes: QrTypeId[] = ['url', 'pdf', 'multiUrl', 'contact', 'text', 'wifi', 'googleForm', 'googleReview', 'menu', 'app', 'sms', 'email', 'phone', 'social'];

    supportedTypes.forEach((type) => {
      const definition = getQrTypeDefinition(type);
      expect(definition.id).toBe(type);
      expect(definition.label).toBeTruthy();
      expect(definition.validate).toEqual(expect.any(Function));
      expect(definition.encode).toEqual(expect.any(Function));
    });

    expect(Object.keys(QR_TYPE_REGISTRY)).toEqual(supportedTypes);
  });

  it('keeps current valid inputs valid and empty inputs invalid', () => {
    const blank = createBlankForms();
    const redirectPageUrl = 'https://example.com/go';

    expect(validateQrInput('url', blank).valid).toBe(false);
    expect(validateQrInput('url', { ...blank, url: { value: 'https://example.com' } }).valid).toBe(true);

    expect(validateQrInput('multiUrl', blank).valid).toBe(false);
    expect(validateQrInput('multiUrl', { ...blank, multiUrl: { urls: ['', 'https://example.com'] } }).valid).toBe(true);

    expect(validateQrInput('contact', blank).valid).toBe(false);
    expect(buildQrValue('contact', { ...blank, contact: { ...blank.contact, firstName: 'Ada' } }, redirectPageUrl)).toContain('BEGIN:VCARD');

    expect(validateQrInput('wifi', blank).valid).toBe(false);
    expect(validateQrInput('wifi', { ...blank, wifi: { ssid: 'Office WiFi', password: 'secret123', security: 'WPA', hidden: false } }).valid).toBe(true);

    expect(validateQrInput('googleForm', blank).valid).toBe(false);
    expect(
      validateQrInput('googleForm', { ...blank, googleForm: { value: 'https://docs.google.com/forms/d/e/example/viewform' } }).valid,
    ).toBe(true);

    expect(validateQrInput('googleReview', blank).valid).toBe(false);
    expect(
      validateQrInput('googleReview', { ...blank, googleReview: { value: 'https://g.page/r/example-review' } }).valid,
    ).toBe(true);

    expect(validateQrInput('menu', blank).valid).toBe(false);
    expect(validateQrInput('menu', { ...blank, menu: { value: 'https://restaurant.example.com/menu' } }).valid).toBe(true);

    expect(validateQrInput('app', blank).valid).toBe(false);
    expect(validateQrInput('app', { ...blank, app: { ios: 'com.example.app', android: '' } }).valid).toBe(true);
  });

  it('validates and preserves valid Menu URLs', () => {
    const blank = createBlankForms();
    const menuUrl = 'https://restaurant.example.com/menu';
    const menuUrlWithParams = 'https://restaurant.example.com/menu?table=12';

    expect(validateQrInput('menu', { ...blank, menu: { value: menuUrl } }).valid).toBe(true);
    expect(buildQrValue('menu', { ...blank, menu: { value: menuUrl } }, 'https://example.com/go')).toBe(menuUrl);

    expect(validateQrInput('menu', { ...blank, menu: { value: menuUrlWithParams } }).valid).toBe(true);
    expect(buildQrValue('menu', { ...blank, menu: { value: menuUrlWithParams } }, 'https://example.com/go')).toBe(menuUrlWithParams);

    expect(validateQrInput('menu', { ...blank, menu: { value: 'http://restaurant.example.com/menu' } }).valid).toBe(true);

    expect(validateQrInput('menu', { ...blank, menu: { value: '' } }).valid).toBe(false);
    expect(validateQrInput('menu', { ...blank, menu: { value: 'restaurant-menu' } }).valid).toBe(false);
  });

  it('validates and preserves valid Google Form URLs', () => {
    const blank = createBlankForms();
    const googleFormUrl = 'https://docs.google.com/forms/d/e/example/viewform?usp=sf_link&entry.123=Hello+World';

    expect(validateQrInput('googleForm', { ...blank, googleForm: { value: googleFormUrl } }).valid).toBe(true);
    expect(buildQrValue('googleForm', { ...blank, googleForm: { value: googleFormUrl } }, 'https://example.com/go')).toBe(googleFormUrl);
    expect(validateQrInput('googleForm', { ...blank, googleForm: { value: '' } }).valid).toBe(false);
    expect(validateQrInput('googleForm', { ...blank, googleForm: { value: 'not-a-url' } }).valid).toBe(false);
  });

  it('validates and preserves valid Google Review URLs', () => {
    const blank = createBlankForms();
    const reviewUrl = 'https://g.page/r/example-review';
    const reviewUrlWithParams = 'https://g.page/r/example-review?foo=bar';

    expect(validateQrInput('googleReview', { ...blank, googleReview: { value: reviewUrl } }).valid).toBe(true);
    expect(buildQrValue('googleReview', { ...blank, googleReview: { value: reviewUrl } }, 'https://example.com/go')).toBe(reviewUrl);

    expect(validateQrInput('googleReview', { ...blank, googleReview: { value: reviewUrlWithParams } }).valid).toBe(true);
    expect(buildQrValue('googleReview', { ...blank, googleReview: { value: reviewUrlWithParams } }, 'https://example.com/go')).toBe(reviewUrlWithParams);

    expect(validateQrInput('googleReview', { ...blank, googleReview: { value: '' } }).valid).toBe(false);
    expect(validateQrInput('googleReview', { ...blank, googleReview: { value: 'google-review-link' } }).valid).toBe(false);
  });

  it('validates and encodes realistic business-card contact details', () => {
    const blank = createBlankForms();
    const redirectPageUrl = 'https://example.com/go';

    expect(
      validateQrInput('contact', {
        ...blank,
        contact: {
          ...blank.contact,
          firstName: 'Arpit',
          lastName: 'Kumar',
          organization: 'Example Inc',
          title: 'Software Engineer',
          mobile: '+919876543210',
          email: 'arpit@example.com',
          website: 'https://example.com',
        },
      }).valid,
    ).toBe(true);

    expect(
      buildQrValue(
        'contact',
        {
          ...blank,
          contact: {
            ...blank.contact,
            firstName: 'José',
            lastName: 'Martínez',
            organization: 'Café Labs',
            mobile: '+919876543210',
            email: 'jose@cafelabs.test',
          },
        },
        redirectPageUrl,
      ),
    ).toContain('FN:José Martínez');

    expect(
      buildQrValue(
        'contact',
        {
          ...blank,
          contact: {
            ...blank.contact,
            firstName: 'Ada',
            lastName: 'Lovelace',
            organization: 'Test, Inc.; QA\\Team',
            mobile: '+1 (555) 123-4567',
            email: 'ada@example.com',
          },
        },
        redirectPageUrl,
      ),
    ).toContain('ORG:Test\\, Inc.\\; QA\\\\Team');

    expect(validateQrInput('contact', { ...blank, contact: { ...blank.contact, email: 'bad-email' } }).valid).toBe(false);
    expect(validateQrInput('contact', { ...blank, contact: { ...blank.contact, website: 'not-a-url' } }).valid).toBe(false);
    expect(validateQrInput('contact', { ...blank, contact: { ...blank.contact, mobile: 'abc' } }).valid).toBe(false);
    expect(validateQrInput('contact', { ...blank, contact: { ...blank.contact, firstName: 'Only one field' } }).valid).toBe(true);
  });

  it('encodes WiFi payloads with the proper standard form', () => {
    const blank = createBlankForms();

    expect(
      buildQrValue('wifi', { ...blank, wifi: { ssid: 'Office WiFi', password: 'secret123', security: 'WPA', hidden: false } }, 'https://example.com/go'),
    ).toBe('WIFI:T:WPA;S:Office WiFi;P:secret123;H:false;;');

    expect(
      buildQrValue('wifi', { ...blank, wifi: { ssid: 'Guest WiFi', password: '', security: 'None', hidden: false } }, 'https://example.com/go'),
    ).toBe('WIFI:T:nopass;S:Guest WiFi;P:;H:false;;');

    expect(
      buildQrValue('wifi', { ...blank, wifi: { ssid: 'Cafe\\WiFi;Office', password: 'pa:ss\\,word\"', security: 'WPA', hidden: true } }, 'https://example.com/go'),
    ).toBe('WIFI:T:WPA;S:Cafe\\\\WiFi\\;Office;P:pa\\:ss\\\\\\,word\\";H:true;;');

    expect(
      buildQrValue('wifi', { ...blank, wifi: { ssid: 'Café WiFi', password: 'secr3t', security: 'WEP', hidden: false } }, 'https://example.com/go'),
    ).toBe('WIFI:T:WEP;S:Café WiFi;P:secr3t;H:false;;');
  });

  it('keeps encoder output deterministic for the existing QR payloads', () => {
    const redirectPageUrl = 'https://example.com/go';
    const blank = createBlankForms();

    const forms: QrForms = {
      ...blank,
      url: { value: 'https://example.com' },
      pdf: { value: 'https://example.com/report.pdf' },
      text: { value: 'hello world' },
      sms: { phone: '+123456789', message: 'hello' },
      email: { to: 'me@example.com', subject: 'Hello', body: 'World' },
      phone: { phone: '+123456789' },
      social: { value: 'https://linkedin.com/in/example', platform: 'linkedin' },
      contact: { ...blank.contact, firstName: 'Ada', lastName: 'Lovelace' },
      app: { ios: 'com.example.app', android: 'com.example.app' },
      multiUrl: { urls: ['https://one.example', 'https://two.example'] },
      googleReview: { value: 'https://g.page/r/example-review' },
      menu: { value: 'https://restaurant.example.com/menu' },
    };

    expect(buildQrValue('url', forms, redirectPageUrl)).toBe('https://example.com');
    expect(buildQrValue('pdf', forms, redirectPageUrl)).toBe('https://example.com/report.pdf');
    expect(buildQrValue('text', forms, redirectPageUrl)).toBe('hello world');
    expect(buildQrValue('sms', forms, redirectPageUrl)).toBe('SMSTO:+123456789:hello');
    expect(buildQrValue('email', forms, redirectPageUrl)).toBe('mailto:me@example.com?subject=Hello&body=World');
    expect(buildQrValue('phone', forms, redirectPageUrl)).toBe('tel:+123456789');
    expect(buildQrValue('social', forms, redirectPageUrl)).toBe('https://linkedin.com/in/example');
    expect(buildQrValue('contact', forms, redirectPageUrl)).toContain('BEGIN:VCARD');
    expect(buildQrValue('multiUrl', forms, redirectPageUrl)).toBe(
      `${redirectPageUrl}?urls=https%253A%252F%252Fone.example%2Chttps%253A%252F%252Ftwo.example`,
    );
    expect(buildQrValue('app', forms, redirectPageUrl)).toContain('https://example.com/go');
    expect(buildQrValue('googleReview', forms, redirectPageUrl)).toBe('https://g.page/r/example-review');
    expect(buildQrValue('menu', forms, redirectPageUrl)).toBe('https://restaurant.example.com/menu');
  });

  // TASK-006: field-level validation UX relies on each type's validate()
  // returning a specific error message keyed by the offending field — these
  // pin down the required-field and malformed-value cases the UI now surfaces.
  it('reports required-field errors for empty simple-link and single-value types', () => {
    const blank = createBlankForms();

    expect(validateQrInput('url', blank).errors.value).toBeTruthy();
    expect(validateQrInput('pdf', blank).errors.value).toBeTruthy();
    expect(validateQrInput('text', blank).errors.value).toBeTruthy();
    expect(validateQrInput('phone', blank).errors.phone).toBeTruthy();
    expect(validateQrInput('sms', blank).errors.phone).toBeTruthy();
    expect(validateQrInput('email', blank).errors.to).toBeTruthy();
    expect(validateQrInput('social', blank).errors.value).toBeTruthy();
  });

  it('reports malformed-value errors with human-readable messages', () => {
    const blank = createBlankForms();

    expect(validateQrInput('url', { ...blank, url: { value: 'not-a-url' } }).errors.value).toBe('Enter a valid URL');
    expect(validateQrInput('pdf', { ...blank, pdf: { value: 'not-a-url' } }).errors.value).toBe('Enter a valid PDF URL');
    expect(validateQrInput('googleForm', { ...blank, googleForm: { value: 'not-a-url' } }).errors.value).toBe(
      'Enter a valid Google Form URL',
    );
    expect(validateQrInput('googleReview', { ...blank, googleReview: { value: 'not-a-url' } }).errors.value).toBe(
      'Enter a valid Google Review URL',
    );
    expect(validateQrInput('menu', { ...blank, menu: { value: 'not-a-url' } }).errors.value).toBe('Enter a valid menu URL');
    expect(
      validateQrInput('contact', { ...blank, contact: { ...blank.contact, firstName: 'Ada', email: 'not-an-email' } }).errors.email,
    ).toBe('Enter a valid email address');
    expect(
      validateQrInput('contact', { ...blank, contact: { ...blank.contact, firstName: 'Ada', mobile: 'abc' } }).errors.mobile,
    ).toBe('Enter a valid phone number');
    expect(
      validateQrInput('contact', { ...blank, contact: { ...blank.contact, firstName: 'Ada', website: 'not-a-url' } }).errors.website,
    ).toBe('Enter a valid website URL');
  });

  it('reports WiFi-specific required-field errors', () => {
    const blank = createBlankForms();

    expect(validateQrInput('wifi', blank).errors.ssid).toBe('Network name is required');
    expect(
      validateQrInput('wifi', { ...blank, wifi: { ssid: 'Office WiFi', password: '', security: 'WPA', hidden: false } }).errors.password,
    ).toBe('Password is required for secured networks');
    expect(
      validateQrInput('wifi', { ...blank, wifi: { ssid: 'Open Cafe', password: '', security: 'None', hidden: false } }).valid,
    ).toBe(true);
  });

  it('reports multiUrl and app required-field errors when nothing usable is filled in', () => {
    const blank = createBlankForms();

    expect(validateQrInput('multiUrl', { ...blank, multiUrl: { urls: ['', ''] } }).errors.urls).toBe('Add at least one URL');
    expect(validateQrInput('app', { ...blank, app: { ios: '', android: '' } }).errors.ios).toBe('Add at least one app link');
  });
});
