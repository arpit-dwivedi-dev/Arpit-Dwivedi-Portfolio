export const QR_TYPE_IDS = ['url', 'pdf', 'multiUrl', 'contact', 'text', 'wifi', 'googleForm', 'googleReview', 'menu', 'app', 'sms', 'email', 'phone', 'social'] as const;

export type QrTypeId = (typeof QR_TYPE_IDS)[number];

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export interface QrStyle {
  fgColor: string;
  bgColor: string;
  level: 'L' | 'M' | 'Q' | 'H';
}

export interface SimpleLinkFormData {
  value: string;
}

export interface SocialFormData {
  value: string;
  platform: string;
}

export interface ContactFormData {
  prefix: string;
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  mobile: string;
  homePhone: string;
  fax: string;
  street: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  website: string;
}

export interface TextFormData {
  value: string;
}

export type WifiSecurity = 'WPA' | 'WEP' | 'None';

export interface WifiFormData {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

export interface SmsFormData {
  phone: string;
  message: string;
}

export interface EmailFormData {
  to: string;
  subject: string;
  body: string;
}

export interface PhoneFormData {
  phone: string;
}

export interface MultiUrlFormData {
  urls: string[];
}

export interface AppFormData {
  ios: string;
  android: string;
}

export interface QrForms {
  url: SimpleLinkFormData;
  pdf: SimpleLinkFormData;
  multiUrl: MultiUrlFormData;
  contact: ContactFormData;
  text: TextFormData;
  wifi: WifiFormData;
  googleForm: SimpleLinkFormData;
  googleReview: SimpleLinkFormData;
  menu: SimpleLinkFormData;
  app: AppFormData;
  sms: SmsFormData;
  email: EmailFormData;
  phone: PhoneFormData;
  social: SocialFormData;
}

export const createBlankForms = (): QrForms => ({
  url: { value: '' },
  pdf: { value: '' },
  multiUrl: { urls: ['', ''] },
  contact: {
    prefix: '',
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    email: '',
    mobile: '',
    homePhone: '',
    fax: '',
    street: '',
    city: '',
    region: '',
    postcode: '',
    country: '',
    website: '',
  },
  text: { value: '' },
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  googleForm: { value: '' },
  googleReview: { value: '' },
  menu: { value: '' },
  app: { ios: '', android: '' },
  sms: { phone: '', message: '' },
  email: { to: '', subject: '', body: '' },
  phone: { phone: '' },
  social: { value: '', platform: 'facebook' },
});

export interface SocialPlatform {
  id: string;
  label: string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/919999999999' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...' },
  { id: 'telegram', label: 'Telegram', placeholder: 'https://t.me/yourhandle' },
  { id: 'discord', label: 'Discord', placeholder: 'https://discord.gg/yourinvite' },
];

export const DEFAULT_QR_STYLE: QrStyle = { fgColor: '#0b0b0f', bgColor: '#ffffff', level: 'M' };

export interface QrColorPreset {
  id: string;
  fgColor: string;
  bgColor: string;
}

export const QR_COLOR_PRESETS: QrColorPreset[] = [
  { id: 'classic', fgColor: '#0b0b0f', bgColor: '#ffffff' },
  { id: 'blue', fgColor: '#005fa8', bgColor: '#ffffff' },
  { id: 'forest', fgColor: '#0f5132', bgColor: '#ffffff' },
  { id: 'maroon', fgColor: '#7a1f2b', bgColor: '#ffffff' },
];
