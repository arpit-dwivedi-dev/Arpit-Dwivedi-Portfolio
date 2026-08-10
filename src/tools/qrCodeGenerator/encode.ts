import type { AppFormData, ContactFormData, EmailFormData, MultiUrlFormData, PhoneFormData, QrForms, QrTypeId, SmsFormData, SocialFormData, TextFormData } from './types';

// vCard 3.0 — widely supported by both iOS and Android camera scanners.
// Escaping per RFC 6350 §3.4: backslash, comma, semicolon, and embedded newlines.
const escapeVCardValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

export const buildVCard = (data: ContactFormData): string => {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const fullName = [data.prefix, data.firstName, data.lastName].filter(Boolean).join(' ').trim();

  lines.push(`N:${escapeVCardValue(data.lastName)};${escapeVCardValue(data.firstName)};;${escapeVCardValue(data.prefix)};`);
  if (fullName) lines.push(`FN:${escapeVCardValue(fullName)}`);
  if (data.organization) lines.push(`ORG:${escapeVCardValue(data.organization)}`);
  if (data.title) lines.push(`TITLE:${escapeVCardValue(data.title)}`);
  if (data.mobile) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(data.mobile)}`);
  if (data.homePhone) lines.push(`TEL;TYPE=HOME:${escapeVCardValue(data.homePhone)}`);
  if (data.fax) lines.push(`TEL;TYPE=FAX:${escapeVCardValue(data.fax)}`);
  if (data.email) lines.push(`EMAIL:${escapeVCardValue(data.email)}`);
  if (data.street || data.city || data.region || data.postcode || data.country) {
    lines.push(
      `ADR:;;${escapeVCardValue(data.street)};${escapeVCardValue(data.city)};${escapeVCardValue(data.region)};${escapeVCardValue(data.postcode)};${escapeVCardValue(data.country)}`,
    );
  }
  if (data.website) lines.push(`URL:${escapeVCardValue(data.website)}`);
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

export const buildQrValue = (type: QrTypeId, forms: QrForms, redirectPageUrl: string): string | null => {
  switch (type) {
    case 'url':
      return nonEmpty(forms.url.value) ? forms.url.value.trim() : null;

    case 'pdf':
      return nonEmpty(forms.pdf.value) ? forms.pdf.value.trim() : null;

    case 'social': {
      const social: SocialFormData = forms.social;
      return nonEmpty(social.value) ? social.value.trim() : null;
    }

    case 'text': {
      const text: TextFormData = forms.text;
      return nonEmpty(text.value) ? text.value : null;
    }

    case 'contact': {
      const contact = forms.contact;
      const hasAnyField = Object.values(contact).some((value) => nonEmpty(value));
      return hasAnyField ? buildVCard(contact) : null;
    }

    case 'sms': {
      const sms: SmsFormData = forms.sms;
      return nonEmpty(sms.phone) ? buildSmsUri(sms) : null;
    }

    case 'email': {
      const email: EmailFormData = forms.email;
      return nonEmpty(email.to) ? buildMailtoUri(email) : null;
    }

    case 'phone': {
      const phone: PhoneFormData = forms.phone;
      return nonEmpty(phone.phone) ? buildTelUri(phone) : null;
    }

    case 'multiUrl': {
      const multiUrl: MultiUrlFormData = forms.multiUrl;
      const urls = multiUrl.urls.map((url) => url.trim()).filter(nonEmpty);
      if (urls.length === 0) return null;
      if (urls.length === 1) return urls[0];
      return buildRedirectUrl(redirectPageUrl, { urls });
    }

    case 'app': {
      const app: AppFormData = forms.app;
      const ios = app.ios.trim();
      const android = app.android.trim();
      if (ios && android) return buildRedirectUrl(redirectPageUrl, { ios, android });
      if (ios) return ios;
      if (android) return android;
      return null;
    }

    default:
      return null;
  }
};
