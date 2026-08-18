import type {
  AppFormData,
  ContactFormData,
  EmailFormData,
  MultiUrlFormData,
  PhoneFormData,
  QrForms,
  QrTypeId,
  SmsFormData,
  SocialFormData,
  TextFormData,
  ValidationResult,
} from './types';
import { QR_TYPE_IDS } from './types';

export type QrTypeDefinition<TType extends QrTypeId = QrTypeId, TInput = QrForms[TType]> = {
  id: TType;
  label: string;
  validate: (input: TInput) => ValidationResult;
  encode: (input: TInput, redirectPageUrl: string) => string | null;
};

// vCard 3.0 — widely supported by both iOS and Android camera scanners.
// Escaping per RFC 6350 §3.4: backslash, comma, semicolon, colon, quotes, and embedded newlines.
const escapeVCardValue = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\n');

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isPlausiblePhone = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const normalized = trimmed.replace(/[\s()+-]/g, '');
  return normalized.length >= 7 && /^\+?[0-9]+$/.test(normalized);
};

const isValidWebsite = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const buildVCard = (data: ContactFormData): string => {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const prefix = data.prefix.trim();
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const organization = data.organization.trim();
  const title = data.title.trim();
  const mobile = data.mobile.trim();
  const homePhone = data.homePhone.trim();
  const fax = data.fax.trim();
  const email = data.email.trim();
  const street = data.street.trim();
  const city = data.city.trim();
  const region = data.region.trim();
  const postcode = data.postcode.trim();
  const country = data.country.trim();
  const website = data.website.trim();
  const fullName = [prefix, firstName, lastName].filter(Boolean).join(' ').trim();

  lines.push(`N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;${escapeVCardValue(prefix)};`);
  if (fullName) lines.push(`FN:${escapeVCardValue(fullName)}`);
  else if (organization) lines.push(`FN:${escapeVCardValue(organization)}`);
  if (organization) lines.push(`ORG:${escapeVCardValue(organization)}`);
  if (title) lines.push(`TITLE:${escapeVCardValue(title)}`);
  if (mobile) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(mobile)}`);
  if (homePhone) lines.push(`TEL;TYPE=HOME:${escapeVCardValue(homePhone)}`);
  if (fax) lines.push(`TEL;TYPE=FAX:${escapeVCardValue(fax)}`);
  if (email) lines.push(`EMAIL:${escapeVCardValue(email)}`);
  if (street || city || region || postcode || country) {
    lines.push(
      `ADR:;;${escapeVCardValue(street)};${escapeVCardValue(city)};${escapeVCardValue(region)};${escapeVCardValue(postcode)};${escapeVCardValue(country)}`,
    );
  }
  if (website) lines.push(`URL:${escapeVCardValue(website)}`);
  lines.push('END:VCARD');

  return lines.join('\n');
};

export const buildSmsUri = (data: SmsFormData): string => {
  const digits = data.phone.trim();
  return data.message ? `SMSTO:${digits}:${data.message}` : `SMSTO:${digits}`;
};

export const buildMailtoUri = (data: EmailFormData): string => {
  const params = new URLSearchParams();
  if (data.subject) params.set('subject', data.subject);
  if (data.body) params.set('body', data.body);
  const query = params.toString();
  return `mailto:${data.to.trim()}${query ? `?${query}` : ''}`;
};

export const buildTelUri = (data: PhoneFormData): string => `tel:${data.phone.trim()}`;

const escapeWifiValue = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');

export const buildWifiPacket = (data: QrForms['wifi']): string => {
  const security = data.security === 'None' ? 'nopass' : data.security;
  const ssid = escapeWifiValue(data.ssid);
  const password = escapeWifiValue(data.password);
  const hidden = String(Boolean(data.hidden));
  return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden};;`;
};

interface RedirectParams {
  urls?: string[];
  ios?: string;
  android?: string;
}

// Builds the URL encoded *into* the QR code, pointing at our own static
// redirect page (see QRRedirectPage). All routing data lives in the query
// string itself — no server/database needed to resolve it at scan time.
export const buildRedirectUrl = (redirectPageUrl: string, params: RedirectParams): string => {
  const search = new URLSearchParams();
  if (params.urls && params.urls.length > 0) {
    search.set('urls', params.urls.map((url) => encodeURIComponent(url.trim())).join(','));
  }
  if (params.ios) search.set('ios', params.ios.trim());
  if (params.android) search.set('android', params.android.trim());
  return `${redirectPageUrl}?${search.toString()}`;
};

const nonEmpty = (value: string) => value.trim().length > 0;

const isValidHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
};

const makeInvalid = (field: string, message = 'This field is required'): ValidationResult => ({ valid: false, errors: { [field]: message } });
const makeValid = (): ValidationResult => ({ valid: true, errors: {} });

const qrTypeDefinitions: { [K in QrTypeId]: QrTypeDefinition<K, QrForms[K]> } = {
  url: {
    id: 'url',
    label: 'URL',
    validate: (input: QrForms['url']) => {
      const value = input.value.trim();
      if (!nonEmpty(input.value)) return makeInvalid('value');
      return isValidHttpUrl(value) ? makeValid() : makeInvalid('value', 'Enter a valid URL');
    },
    encode: (input: QrForms['url']) => {
      const value = input.value.trim();
      return nonEmpty(value) && isValidHttpUrl(value) ? value : null;
    },
  },
  pdf: {
    id: 'pdf',
    label: 'PDF',
    validate: (input: QrForms['pdf']) => {
      const value = input.value.trim();
      if (!nonEmpty(input.value)) return makeInvalid('value');
      return isValidHttpUrl(value) ? makeValid() : makeInvalid('value', 'Enter a valid PDF URL');
    },
    encode: (input: QrForms['pdf']) => {
      const value = input.value.trim();
      return nonEmpty(value) && isValidHttpUrl(value) ? value : null;
    },
  },
  multiUrl: {
    id: 'multiUrl',
    label: 'Multi URL',
    validate: (input: QrForms['multiUrl']) => {
      const urls = input.urls.map((url) => url.trim()).filter(nonEmpty);
      return urls.length > 0 ? makeValid() : makeInvalid('urls', 'Add at least one URL');
    },
    encode: (input: QrForms['multiUrl'], redirectPageUrl: string) => {
      const urls = input.urls.map((url) => url.trim()).filter(nonEmpty);
      if (urls.length === 0) return null;
      if (urls.length === 1) return urls[0];
      return buildRedirectUrl(redirectPageUrl, { urls });
    },
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    validate: (input: QrForms['contact']) => {
      const hasAnyField = [
        input.prefix,
        input.firstName,
        input.lastName,
        input.organization,
        input.mobile,
        input.homePhone,
        input.email,
        input.website,
      ].some(nonEmpty);

      if (!hasAnyField) return makeInvalid('firstName', 'Add at least one name, phone, email, or company detail');
      if (input.email.trim() && !isValidEmail(input.email)) return makeInvalid('email', 'Enter a valid email address');
      if (input.mobile.trim() && !isPlausiblePhone(input.mobile)) return makeInvalid('mobile', 'Enter a valid phone number');
      if (input.homePhone.trim() && !isPlausiblePhone(input.homePhone)) return makeInvalid('homePhone', 'Enter a valid phone number');
      if (input.website.trim() && !isValidWebsite(input.website)) return makeInvalid('website', 'Enter a valid website URL');

      return makeValid();
    },
    encode: (input: QrForms['contact']) => {
      const hasAnyField = [
        input.prefix,
        input.firstName,
        input.lastName,
        input.organization,
        input.mobile,
        input.homePhone,
        input.email,
        input.website,
      ].some(nonEmpty);

      return hasAnyField ? buildVCard(input) : null;
    },
  },
  text: {
    id: 'text',
    label: 'Text',
    validate: (input: QrForms['text']) => (nonEmpty(input.value) ? makeValid() : makeInvalid('value')),
    encode: (input: QrForms['text']) => (nonEmpty(input.value) ? input.value : null),
  },
  wifi: {
    id: 'wifi',
    label: 'WiFi',
    validate: (input: QrForms['wifi']) => {
      const ssid = input.ssid.trim();
      const security = input.security;
      const hidden = typeof input.hidden === 'boolean' ? input.hidden : false;

      if (!ssid) return makeInvalid('ssid', 'Network name is required');
      if (security !== 'WPA' && security !== 'WEP' && security !== 'None') return makeInvalid('security', 'Unsupported security type');
      if (security !== 'None' && !input.password.trim()) return makeInvalid('password', 'Password is required for secured networks');
      if (security === 'None' && input.password.trim() !== '' && input.password.trim().length > 0) return makeValid();
      if (security === 'None') return makeValid();
      if (typeof hidden !== 'boolean') return makeInvalid('hidden', 'Hidden network must be a boolean');
      return makeValid();
    },
    encode: (input: QrForms['wifi']) => {
      const ssid = input.ssid.trim();
      const security = input.security;
      if (!ssid) return null;
      if (security !== 'WPA' && security !== 'WEP' && security !== 'None') return null;
      if (security !== 'None' && !input.password.trim()) return null;
      return buildWifiPacket({ ...input, ssid, password: input.password, security, hidden: Boolean(input.hidden) });
    },
  },
  googleForm: {
    id: 'googleForm',
    label: 'Google Form',
    validate: (input: QrForms['googleForm']) => {
      const value = input.value.trim();
      if (!nonEmpty(value)) return makeInvalid('value');
      return isValidHttpUrl(value) ? makeValid() : makeInvalid('value', 'Enter a valid Google Form URL');
    },
    encode: (input: QrForms['googleForm']) => {
      const value = input.value.trim();
      return nonEmpty(value) && isValidHttpUrl(value) ? value : null;
    },
  },
  googleReview: {
    id: 'googleReview',
    label: 'Google Review',
    validate: (input: QrForms['googleReview']) => {
      const value = input.value.trim();
      if (!nonEmpty(value)) return makeInvalid('value');
      return isValidHttpUrl(value) ? makeValid() : makeInvalid('value', 'Enter a valid Google Review URL');
    },
    encode: (input: QrForms['googleReview']) => {
      const value = input.value.trim();
      return nonEmpty(value) && isValidHttpUrl(value) ? value : null;
    },
  },
  menu: {
    id: 'menu',
    label: 'Menu',
    validate: (input: QrForms['menu']) => {
      const value = input.value.trim();
      if (!nonEmpty(input.value)) return makeInvalid('value');
      return isValidHttpUrl(value) ? makeValid() : makeInvalid('value', 'Enter a valid menu URL');
    },
    encode: (input: QrForms['menu']) => {
      const value = input.value.trim();
      return nonEmpty(value) && isValidHttpUrl(value) ? value : null;
    },
  },
  app: {
    id: 'app',
    label: 'App',
    validate: (input: QrForms['app']) => {
      const ios = input.ios.trim();
      const android = input.android.trim();
      return ios || android ? makeValid() : makeInvalid('ios', 'Add at least one app link');
    },
    encode: (input: QrForms['app'], redirectPageUrl: string) => {
      const ios = input.ios.trim();
      const android = input.android.trim();
      if (ios && android) return buildRedirectUrl(redirectPageUrl, { ios, android });
      if (ios) return ios;
      if (android) return android;
      return null;
    },
  },
  sms: {
    id: 'sms',
    label: 'SMS',
    validate: (input: QrForms['sms']) => (nonEmpty(input.phone) ? makeValid() : makeInvalid('phone')),
    encode: (input: QrForms['sms']) => (nonEmpty(input.phone) ? buildSmsUri(input) : null),
  },
  email: {
    id: 'email',
    label: 'Email',
    validate: (input: QrForms['email']) => (nonEmpty(input.to) ? makeValid() : makeInvalid('to')),
    encode: (input: QrForms['email']) => (nonEmpty(input.to) ? buildMailtoUri(input) : null),
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    validate: (input: QrForms['phone']) => (nonEmpty(input.phone) ? makeValid() : makeInvalid('phone')),
    encode: (input: QrForms['phone']) => (nonEmpty(input.phone) ? buildTelUri(input) : null),
  },
  social: {
    id: 'social',
    label: 'Social',
    validate: (input: QrForms['social']) => (nonEmpty(input.value) ? makeValid() : makeInvalid('value')),
    encode: (input: QrForms['social']) => (nonEmpty(input.value) ? input.value.trim() : null),
  },
} as const;

export const QR_TYPE_REGISTRY = qrTypeDefinitions;

export const getQrTypeDefinition = <TType extends QrTypeId>(type: TType): QrTypeDefinition<TType, QrForms[TType]> => {
  return QR_TYPE_REGISTRY[type] as QrTypeDefinition<TType, QrForms[TType]>;
};

export const validateQrInput = (type: QrTypeId, forms: QrForms): ValidationResult => {
  const definition = getQrTypeDefinition(type);
  return definition.validate(forms[type]);
};

export const buildQrValue = (type: QrTypeId, forms: QrForms, redirectPageUrl: string): string | null => {
  const definition = getQrTypeDefinition(type);
  return definition.encode(forms[type], redirectPageUrl);
};

export const QR_TYPE_ORDER: QrTypeId[] = [...QR_TYPE_IDS];
