import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  Shuffle,
  Smartphone,
  Text,
  Trash2,
  User,
  UtensilsCrossed,
  Wifi,
  FileText,
} from 'lucide-react';
import { FaDiscord, FaFacebook, FaInstagram, FaLinkedin, FaSpotify, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { BuyMeACoffee } from '../../components/tools/BuyMeACoffee';
import { notifyToolUsed } from '../../components/tools/supportPrompt';
import { useLanguage } from '../../i18n/LanguageContext';
import { trackEvent } from '../../monitoring';
import { useQrCodeGenerator } from './useQrCodeGenerator';
import { downloadCanvasAsPng, downloadSvgElement, copyCanvasToClipboard } from './download';
import { QR_COLOR_PRESETS, SOCIAL_PLATFORMS } from './types';
import type { QrTypeId } from './types';

// Fixed production origin (matches the pattern in JsonLd/Breadcrumbs/LanguageContext) —
// this is embedded directly into generated QR codes, so it must always resolve to the
// real domain regardless of where the page happens to be running.
const SITE_ORIGIN = 'https://101techlabs.com';
const REDIRECT_PAGE_URL = `${SITE_ORIGIN}/tools/generators/qr-code-generator/go`;

// Shown in the preview before the user has typed anything, so the panel
// never looks broken/empty on first load — never used for downloads/copy,
// which stay gated on the real qrValue.
const PLACEHOLDER_QR_VALUE = 'https://101techlabs.com/';

const SOCIAL_ICONS: Record<string, typeof FaFacebook> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  whatsapp: FaWhatsapp,
  youtube: FaYoutube,
  spotify: FaSpotify,
  telegram: FaTelegram,
  discord: FaDiscord,
};

const QR_TYPE_ICONS: Record<QrTypeId, typeof Link2> = {
  url: Link2,
  pdf: FileText,
  multiUrl: Shuffle,
  contact: User,
  text: Text,
  wifi: Wifi,
  googleForm: Link2,
  googleReview: Link2,
  menu: UtensilsCrossed,
  app: Smartphone,
  sms: MessageSquare,
  email: Mail,
  phone: Phone,
  social: Share2,
};

const QR_TYPE_ORDER: QrTypeId[] = ['url', 'pdf', 'multiUrl', 'contact', 'text', 'wifi', 'googleForm', 'googleReview', 'menu', 'app', 'sms', 'email', 'phone', 'social'];

const fillPlaceholders = (text: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), text);

const fieldClass =
  'bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2 text-[15px] text-ink placeholder:text-secondary-text/60 focus:outline-none transition-colors';

const labelClass = 'text-[11px] font-mono text-secondary-text uppercase tracking-widest';

const errorTextClass = 'text-red-400 text-xs leading-snug break-words';

/** Inline field error, only rendered once a field has both been touched and failed validation. */
const FieldError = ({ id, message }: { id: string; message?: string }) => {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={errorTextClass}>
      {message}
    </p>
  );
};

const RequiredMark = ({ text }: { text: string }) => (
  <span className="text-secondary-text/60 normal-case tracking-normal font-normal ml-1">{text}</span>
);

export interface QrCodeGeneratorWidgetProps {
  /** QR type preselected on first mount — e.g. the vCard landing page opens
   *  straight into `contact` instead of the hub's default `url`. The type
   *  selector stays fully interactive either way; this only sets the
   *  starting tab. */
  initialType?: QrTypeId;
  /** Restricts the visible type tabs to a single type — used by the vCard
   *  landing page so it stays a dedicated contact-QR entry point rather than
   *  a second full copy of the generic hub. Omit to show every type (hub
   *  behavior). */
  lockToType?: QrTypeId;
  /** `tool_used`/`tool_to_contact_click` analytics tool_name — kept
   *  distinct per entry point so hub vs. vCard-landing usage can be told
   *  apart in analytics without duplicating any encoding/export logic. */
  toolId: string;
}

/**
 * The actual QR generator — type tabs, the active type's form, live preview,
 * and PNG/SVG/clipboard export. This is the single implementation of the QR
 * generation engine; both the hub page (QRCodeGeneratorPage) and the vCard
 * landing page (VCardQrCodePage) render this same component rather than
 * duplicating the encoder, validation, or export logic. Page-level chrome
 * (breadcrumbs, H1, marketing copy, FAQ) is intentionally NOT part of this
 * component — callers own that.
 */
export const QrCodeGeneratorWidget = ({ initialType = 'url', lockToType, toolId }: QrCodeGeneratorWidgetProps) => {
  const { content } = useLanguage();
  const t = content.qrCodeGeneratorTool;

  const { activeType, setActiveType, forms, updateForm, style, setStyle, qrValue, getFieldError, markTouched, reset } = useQrCodeGenerator(
    REDIRECT_PAGE_URL,
    initialType,
  );
  const [wifiPasswordVisible, setWifiPasswordVisible] = useState(false);

  const svgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  useEffect(() => {
    setClipboardSupported(Boolean(navigator.clipboard?.write && typeof ClipboardItem !== 'undefined'));
  }, []);

  const handleDownloadPng = () => {
    if (!qrValue || !canvasRef.current) return;
    trackEvent('tool_used', { tool_name: toolId, action: 'download_png', qr_type: activeType });
    downloadCanvasAsPng(canvasRef.current, 'qr-code.png');
    notifyToolUsed();
  };

  const handleDownloadSvg = () => {
    if (!qrValue) return;
    const svgEl = svgRef.current?.querySelector('svg');
    if (svgEl) {
      trackEvent('tool_used', { tool_name: toolId, action: 'download_svg', qr_type: activeType });
      downloadSvgElement(svgEl, 'qr-code.svg');
      notifyToolUsed();
    }
  };

  const handleCopyImage = async () => {
    if (!qrValue || !canvasRef.current) return;
    const ok = await copyCanvasToClipboard(canvasRef.current);
    if (ok) {
      trackEvent('tool_used', { tool_name: toolId, action: 'copy', qr_type: activeType });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      notifyToolUsed();
    }
  };

  const activePlatform = SOCIAL_PLATFORMS.find((p) => p.id === forms.social.platform) ?? SOCIAL_PLATFORMS[0];
  const visibleTypes = lockToType ? [lockToType] : QR_TYPE_ORDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 rounded-3xl bg-bg-secondary border border-ink/5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div>
          {visibleTypes.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label={t.typeTabsAriaLabel}>
              {visibleTypes.map((type) => {
                const Icon = QR_TYPE_ICONS[type];
                const isActive = type === activeType;
                return (
                  <button
                    key={type}
                    id={`qr-tab-${type}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`qr-panel-${type}`}
                    onClick={() => setActiveType(type)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-pure ${
                      isActive ? 'bg-accent-blue text-bg-pure' : 'bg-ink/5 text-secondary-text hover:text-ink hover:bg-ink/10'
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {t.types[type].label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-base font-bold text-ink">{t.types[activeType].heading}</h2>
            <button
              type="button"
              onClick={reset}
              aria-label={t.resetAriaLabel}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-secondary-text hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <RotateCcw size={13} aria-hidden="true" />
              {t.resetButton}
            </button>
          </div>
          <p className="text-secondary-text text-sm mb-4">{t.types[activeType].description}</p>

          <div
            id={`qr-panel-${activeType}`}
            role={visibleTypes.length > 1 ? 'tabpanel' : undefined}
            aria-labelledby={visibleTypes.length > 1 ? `qr-tab-${activeType}` : undefined}
            tabIndex={0}
          >
            {activeType === 'url' && (
              <div className="space-y-1">
                <label htmlFor="qr-url" className="sr-only">{t.types.url.fieldLabel}</label>
                <input
                  id="qr-url"
                  value={forms.url.value}
                  onChange={(e) => updateForm('url', { value: e.target.value })}
                  onBlur={() => markTouched('value')}
                  placeholder={t.types.url.placeholder}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('value'))}
                  aria-describedby={getFieldError('value') ? 'qr-url-error' : undefined}
                  className={`${fieldClass} w-full`}
                />
                <FieldError id="qr-url-error" message={getFieldError('value')} />
              </div>
            )}

            {activeType === 'pdf' && (
              <div className="space-y-2">
                <label htmlFor="qr-pdf" className="sr-only">{t.types.pdf.fieldLabel}</label>
                <input
                  id="qr-pdf"
                  value={forms.pdf.value}
                  onChange={(e) => updateForm('pdf', { value: e.target.value })}
                  onBlur={() => markTouched('value')}
                  placeholder={t.types.pdf.placeholder}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('value'))}
                  aria-describedby={getFieldError('value') ? 'qr-pdf-error' : undefined}
                  className={`${fieldClass} w-full`}
                />
                <FieldError id="qr-pdf-error" message={getFieldError('value')} />
                <p className="text-secondary-text text-xs">{t.types.pdf.helpNote}</p>
              </div>
            )}

            {activeType === 'text' && (
              <div className="space-y-1">
                <label htmlFor="qr-text" className={labelClass}>
                  {t.types.text.fieldLabel}
                  <RequiredMark text={t.requiredIndicator} />
                </label>
                <textarea
                  id="qr-text"
                  value={forms.text.value}
                  onChange={(e) => updateForm('text', { value: e.target.value })}
                  onBlur={() => markTouched('value')}
                  placeholder={t.types.text.placeholder}
                  rows={5}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('value'))}
                  aria-describedby={getFieldError('value') ? 'qr-text-error' : undefined}
                  className={`${fieldClass} w-full resize-none`}
                />
                <FieldError id="qr-text-error" message={getFieldError('value')} />
              </div>
            )}

            {activeType === 'wifi' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="qr-wifi-ssid" className={labelClass}>
                    {t.types.wifi.ssidLabel}
                    <RequiredMark text={t.requiredIndicator} />
                  </label>
                  <input
                    id="qr-wifi-ssid"
                    value={forms.wifi.ssid}
                    onChange={(e) => updateForm('wifi', { ssid: e.target.value })}
                    onBlur={() => markTouched('ssid')}
                    placeholder={t.types.wifi.ssidPlaceholder}
                    aria-required="true"
                    aria-invalid={Boolean(getFieldError('ssid'))}
                    aria-describedby={getFieldError('ssid') ? 'qr-wifi-ssid-error' : undefined}
                    className={`${fieldClass} w-full`}
                  />
                  <FieldError id="qr-wifi-ssid-error" message={getFieldError('ssid')} />
                </div>

                <div className="space-y-1">
                  <label htmlFor="qr-wifi-password" className={labelClass}>
                    {t.types.wifi.passwordLabel}
                    {forms.wifi.security !== 'None' && <RequiredMark text={t.requiredIndicator} />}
                  </label>
                  <div className="relative">
                    <input
                      id="qr-wifi-password"
                      type={wifiPasswordVisible ? 'text' : 'password'}
                      value={forms.wifi.password}
                      onChange={(e) => updateForm('wifi', { password: e.target.value })}
                      onBlur={() => markTouched('password')}
                      placeholder={t.types.wifi.passwordPlaceholder}
                      autoComplete="off"
                      aria-required={forms.wifi.security !== 'None'}
                      aria-invalid={Boolean(getFieldError('password'))}
                      aria-describedby={getFieldError('password') ? 'qr-wifi-password-error' : undefined}
                      className={`${fieldClass} w-full pr-9`}
                    />
                    <button
                      type="button"
                      aria-label={wifiPasswordVisible ? 'Hide password' : 'Show password'}
                      onClick={() => setWifiPasswordVisible((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-secondary-text hover:text-ink transition-colors"
                    >
                      {wifiPasswordVisible ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    </button>
                  </div>
                  <FieldError id="qr-wifi-password-error" message={getFieldError('password')} />
                </div>

                <div className="space-y-1">
                  <label htmlFor="qr-wifi-security" className={labelClass}>{t.types.wifi.securityLabel}</label>
                  <select
                    id="qr-wifi-security"
                    value={forms.wifi.security}
                    onChange={(e) => updateForm('wifi', { security: e.target.value as typeof forms.wifi.security })}
                    className={`${fieldClass} w-full`}
                  >
                    <option value="WPA">{t.types.wifi.securityWpa}</option>
                    <option value="WEP">{t.types.wifi.securityWep}</option>
                    <option value="None">{t.types.wifi.securityNone}</option>
                  </select>
                </div>

                <label htmlFor="qr-wifi-hidden" className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2 text-sm text-ink cursor-pointer">
                  <span className={labelClass}>{t.types.wifi.hiddenLabel}</span>
                  <input
                    id="qr-wifi-hidden"
                    type="checkbox"
                    checked={forms.wifi.hidden}
                    onChange={(e) => updateForm('wifi', { hidden: e.target.checked })}
                    className="size-4 accent-accent-blue"
                  />
                </label>
              </div>
            )}

            {activeType === 'googleForm' && (
              <div className="space-y-2">
                <label htmlFor="qr-google-form" className={labelClass}>
                  {t.types.googleForm.fieldLabel}
                  <RequiredMark text={t.requiredIndicator} />
                </label>
                <input
                  id="qr-google-form"
                  type="url"
                  value={forms.googleForm.value}
                  onChange={(e) => updateForm('googleForm', { value: e.target.value })}
                  onBlur={() => markTouched('value')}
                  placeholder={t.types.googleForm.placeholder}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('value'))}
                  aria-describedby={getFieldError('value') ? 'qr-google-form-error' : undefined}
                  className={`${fieldClass} w-full`}
                />
                <FieldError id="qr-google-form-error" message={getFieldError('value')} />
                <p className="text-secondary-text text-xs">{t.types.googleForm.helpNote}</p>
              </div>
            )}

            {activeType === 'googleReview' && (
              <div className="space-y-2">
                <label htmlFor="qr-google-review" className={labelClass}>
                  {t.types.googleReview.fieldLabel}
                  <RequiredMark text={t.requiredIndicator} />
                </label>
                <input
                  id="qr-google-review"
                  type="url"
                  value={forms.googleReview.value}
                  onChange={(e) => updateForm('googleReview', { value: e.target.value })}
                  onBlur={() => markTouched('value')}
                  placeholder={t.types.googleReview.placeholder}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('value'))}
                  aria-describedby={getFieldError('value') ? 'qr-google-review-error' : undefined}
                  className={`${fieldClass} w-full`}
                />
                <FieldError id="qr-google-review-error" message={getFieldError('value')} />
                <p className="text-secondary-text text-xs">{t.types.googleReview.helpNote}</p>
              </div>
            )}

            {activeType === 'menu' && (
              <div className="space-y-2">
                <label htmlFor="qr-menu" className={labelClass}>
                  {t.types.menu.fieldLabel}
                  <RequiredMark text={t.requiredIndicator} />
                </label>
                <input
                  id="qr-menu"
                  type="url"
                  value={forms.menu.value}
                  onChange={(e) => updateForm('menu', { value: e.target.value })}
                  onBlur={() => markTouched('value')}
                  placeholder={t.types.menu.placeholder}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('value'))}
                  aria-describedby={getFieldError('value') ? 'qr-menu-error' : undefined}
                  className={`${fieldClass} w-full`}
                />
                <FieldError id="qr-menu-error" message={getFieldError('value')} />
                <p className="text-secondary-text text-xs">{t.types.menu.helpNote}</p>
              </div>
            )}

            {activeType === 'phone' && (
              <div className="space-y-1">
                <label htmlFor="qr-phone" className={labelClass}>
                  {t.types.phone.phoneLabel}
                  <RequiredMark text={t.requiredIndicator} />
                </label>
                <input
                  id="qr-phone"
                  type="tel"
                  value={forms.phone.phone}
                  onChange={(e) => updateForm('phone', { phone: e.target.value })}
                  onBlur={() => markTouched('phone')}
                  placeholder={t.types.phone.phonePlaceholder}
                  aria-required="true"
                  aria-invalid={Boolean(getFieldError('phone'))}
                  aria-describedby={getFieldError('phone') ? 'qr-phone-error' : undefined}
                  className={`${fieldClass} w-full`}
                />
                <FieldError id="qr-phone-error" message={getFieldError('phone')} />
              </div>
            )}

            {activeType === 'sms' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="qr-sms-phone" className={labelClass}>
                    {t.types.sms.phoneLabel}
                    <RequiredMark text={t.requiredIndicator} />
                  </label>
                  <input
                    id="qr-sms-phone"
                    type="tel"
                    value={forms.sms.phone}
                    onChange={(e) => updateForm('sms', { phone: e.target.value })}
                    onBlur={() => markTouched('phone')}
                    placeholder={t.types.sms.phonePlaceholder}
                    aria-required="true"
                    aria-invalid={Boolean(getFieldError('phone'))}
                    aria-describedby={getFieldError('phone') ? 'qr-sms-phone-error' : undefined}
                    className={`${fieldClass} w-full`}
                  />
                  <FieldError id="qr-sms-phone-error" message={getFieldError('phone')} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="qr-sms-message" className={labelClass}>{t.types.sms.messageLabel}</label>
                  <textarea
                    id="qr-sms-message"
                    value={forms.sms.message}
                    onChange={(e) => updateForm('sms', { message: e.target.value })}
                    placeholder={t.types.sms.messagePlaceholder}
                    rows={3}
                    className={`${fieldClass} w-full resize-none`}
                  />
                </div>
              </div>
            )}

            {activeType === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="qr-email-to" className={labelClass}>
                    {t.types.email.toLabel}
                    <RequiredMark text={t.requiredIndicator} />
                  </label>
                  <input
                    id="qr-email-to"
                    type="email"
                    value={forms.email.to}
                    onChange={(e) => updateForm('email', { to: e.target.value })}
                    onBlur={() => markTouched('to')}
                    placeholder={t.types.email.toPlaceholder}
                    aria-required="true"
                    aria-invalid={Boolean(getFieldError('to'))}
                    aria-describedby={getFieldError('to') ? 'qr-email-to-error' : undefined}
                    className={`${fieldClass} w-full`}
                  />
                  <FieldError id="qr-email-to-error" message={getFieldError('to')} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="qr-email-subject" className={labelClass}>{t.types.email.subjectLabel}</label>
                  <input
                    id="qr-email-subject"
                    value={forms.email.subject}
                    onChange={(e) => updateForm('email', { subject: e.target.value })}
                    placeholder={t.types.email.subjectPlaceholder}
                    className={`${fieldClass} w-full`}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="qr-email-body" className={labelClass}>{t.types.email.bodyLabel}</label>
                  <textarea
                    id="qr-email-body"
                    value={forms.email.body}
                    onChange={(e) => updateForm('email', { body: e.target.value })}
                    placeholder={t.types.email.bodyPlaceholder}
                    rows={3}
                    className={`${fieldClass} w-full resize-none`}
                  />
                </div>
              </div>
            )}

            {activeType === 'social' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className={labelClass}>{t.types.social.platformLabel}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SOCIAL_PLATFORMS.map((platform) => {
                      const Icon = SOCIAL_ICONS[platform.id];
                      const isActive = platform.id === forms.social.platform;
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          aria-label={platform.label}
                          aria-pressed={isActive}
                          onClick={() => updateForm('social', { platform: platform.id })}
                          className={`p-2.5 rounded-xl transition-colors ${
                            isActive ? 'bg-accent-blue text-bg-pure' : 'bg-ink/5 text-secondary-text hover:text-ink hover:bg-ink/10'
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="qr-social-url" className={labelClass}>
                    {t.types.social.urlLabel}
                    <RequiredMark text={t.requiredIndicator} />
                  </label>
                  <input
                    id="qr-social-url"
                    value={forms.social.value}
                    onChange={(e) => updateForm('social', { value: e.target.value })}
                    onBlur={() => markTouched('value')}
                    placeholder={activePlatform.placeholder}
                    aria-required="true"
                    aria-invalid={Boolean(getFieldError('value'))}
                    aria-describedby={getFieldError('value') ? 'qr-social-url-error' : undefined}
                    className={`${fieldClass} w-full`}
                  />
                  <FieldError id="qr-social-url-error" message={getFieldError('value')} />
                </div>
              </div>
            )}

            {activeType === 'app' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="qr-app-ios" className={labelClass}>{t.types.app.iosLabel}</label>
                  <input
                    id="qr-app-ios"
                    value={forms.app.ios}
                    onChange={(e) => updateForm('app', { ios: e.target.value })}
                    onBlur={() => markTouched('ios')}
                    placeholder={t.types.app.iosPlaceholder}
                    aria-invalid={Boolean(getFieldError('ios'))}
                    aria-describedby={getFieldError('ios') ? 'qr-app-ios-error' : undefined}
                    className={`${fieldClass} w-full`}
                  />
                  <FieldError id="qr-app-ios-error" message={getFieldError('ios')} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="qr-app-android" className={labelClass}>{t.types.app.androidLabel}</label>
                  <input
                    id="qr-app-android"
                    value={forms.app.android}
                    onChange={(e) => updateForm('app', { android: e.target.value })}
                    onBlur={() => markTouched('android')}
                    placeholder={t.types.app.androidPlaceholder}
                    className={`${fieldClass} w-full`}
                  />
                </div>
                <p className="text-secondary-text text-xs">{t.types.app.bothNote}</p>
              </div>
            )}

            {activeType === 'multiUrl' && (
              <div className="space-y-3">
                {forms.multiUrl.urls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <label htmlFor={`qr-multi-url-${index}`} className="sr-only">
                      {fillPlaceholders(t.types.multiUrl.urlFieldLabel, { index: String(index + 1) })}
                    </label>
                    <input
                      id={`qr-multi-url-${index}`}
                      value={url}
                      onChange={(e) => {
                        const next = [...forms.multiUrl.urls];
                        next[index] = e.target.value;
                        updateForm('multiUrl', { urls: next });
                      }}
                      onBlur={() => markTouched('urls')}
                      placeholder={fillPlaceholders(t.types.multiUrl.urlFieldLabel, { index: String(index + 1) })}
                      aria-invalid={Boolean(getFieldError('urls'))}
                      aria-describedby={getFieldError('urls') ? 'qr-multi-url-error' : undefined}
                      className={`${fieldClass} w-full`}
                    />
                    <button
                      type="button"
                      onClick={() => updateForm('multiUrl', { urls: forms.multiUrl.urls.filter((_, i) => i !== index) })}
                      disabled={forms.multiUrl.urls.length <= 1}
                      aria-label={t.types.multiUrl.removeUrlLabel}
                      className="p-2 rounded-lg text-secondary-text hover:text-red-400 disabled:opacity-30 disabled:hover:text-secondary-text transition-colors shrink-0"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateForm('multiUrl', { urls: [...forms.multiUrl.urls, ''] })}
                  className="w-full py-2.5 rounded-xl border border-dashed border-ink/15 hover:border-accent-blue/40 text-secondary-text hover:text-accent-blue transition-colors text-sm inline-flex items-center justify-center gap-2"
                >
                  <Plus size={14} aria-hidden="true" />
                  {t.types.multiUrl.addUrlButton}
                </button>
                <FieldError id="qr-multi-url-error" message={getFieldError('urls')} />
                <p className="text-secondary-text text-xs">{t.types.multiUrl.minUrlsNote}</p>
              </div>
            )}

            {activeType === 'contact' && (
              <div className="space-y-5">
                <p className="text-xs text-secondary-text leading-relaxed">
                  Add at least a name, phone, email, or company to generate a contact card that can be saved directly to a phone.
                </p>

                <div className="space-y-3">
                  <p className={labelClass}>Personal</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {([
                      ['prefix', t.types.contact.prefixLabel],
                      ['firstName', t.types.contact.firstNameLabel],
                      ['lastName', t.types.contact.lastNameLabel],
                    ] as const).map(([field, label]) => (
                      <div key={field} className="space-y-1">
                        <label htmlFor={`qr-contact-${field}`} className={labelClass}>{label}</label>
                        <input
                          id={`qr-contact-${field}`}
                          value={forms.contact[field]}
                          onChange={(e) => updateForm('contact', { [field]: e.target.value })}
                          onBlur={() => markTouched(field)}
                          aria-invalid={Boolean(getFieldError(field))}
                          aria-describedby={getFieldError(field) ? `qr-contact-${field}-error` : undefined}
                          className={`${fieldClass} w-full`}
                        />
                        <FieldError id={`qr-contact-${field}-error`} message={getFieldError(field)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className={labelClass}>Work</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {([
                      ['organization', t.types.contact.organizationLabel],
                      ['title', t.types.contact.titleLabel],
                    ] as const).map(([field, label]) => (
                      <div key={field} className="space-y-1">
                        <label htmlFor={`qr-contact-${field}`} className={labelClass}>{label}</label>
                        <input
                          id={`qr-contact-${field}`}
                          value={forms.contact[field]}
                          onChange={(e) => updateForm('contact', { [field]: e.target.value })}
                          className={`${fieldClass} w-full`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className={labelClass}>Contact</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {([
                      ['mobile', t.types.contact.mobileLabel],
                      ['email', t.types.contact.emailLabel],
                    ] as const).map(([field, label]) => (
                      <div key={field} className="space-y-1">
                        <label htmlFor={`qr-contact-${field}`} className={labelClass}>{label}</label>
                        <input
                          id={`qr-contact-${field}`}
                          type={field === 'email' ? 'email' : 'tel'}
                          value={forms.contact[field]}
                          onChange={(e) => updateForm('contact', { [field]: e.target.value })}
                          onBlur={() => markTouched(field)}
                          aria-invalid={Boolean(getFieldError(field))}
                          aria-describedby={getFieldError(field) ? `qr-contact-${field}-error` : undefined}
                          className={`${fieldClass} w-full`}
                        />
                        <FieldError id={`qr-contact-${field}-error`} message={getFieldError(field)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className={labelClass}>Address</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {([
                      ['street', t.types.contact.streetLabel],
                      ['city', t.types.contact.cityLabel],
                      ['region', t.types.contact.regionLabel],
                      ['postcode', t.types.contact.postcodeLabel],
                      ['country', t.types.contact.countryLabel],
                    ] as const).map(([field, label]) => (
                      <div key={field} className={field === 'street' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
                        <label htmlFor={`qr-contact-${field}`} className={labelClass}>{label}</label>
                        <input
                          id={`qr-contact-${field}`}
                          value={forms.contact[field]}
                          onChange={(e) => updateForm('contact', { [field]: e.target.value })}
                          className={`${fieldClass} w-full`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className={labelClass}>Website</p>
                  <div className="space-y-1">
                    <label htmlFor="qr-contact-website" className={labelClass}>{t.types.contact.websiteLabel}</label>
                    <input
                      id="qr-contact-website"
                      type="url"
                      value={forms.contact.website}
                      onChange={(e) => updateForm('contact', { website: e.target.value })}
                      onBlur={() => markTouched('website')}
                      placeholder="https://example.com"
                      aria-invalid={Boolean(getFieldError('website'))}
                      aria-describedby={getFieldError('website') ? 'qr-contact-website-error' : undefined}
                      className={`${fieldClass} w-full`}
                    />
                    <FieldError id="qr-contact-website-error" message={getFieldError('website')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:pl-6 lg:border-l lg:border-ink/10 lg:sticky lg:top-28">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 rounded-xl bg-white">
              <div ref={svgRef} role="img" aria-label={t.previewAriaLabel}>
                <QRCodeSVG
                  value={qrValue || PLACEHOLDER_QR_VALUE}
                  size={150}
                  bgColor={style.bgColor}
                  fgColor={style.fgColor}
                  level={style.level}
                />
              </div>
              {/* Offscreen, higher-resolution render used only for PNG download / clipboard copy. */}
              {qrValue && (
                <div className="hidden">
                  <QRCodeCanvas ref={canvasRef} value={qrValue} size={512} bgColor={style.bgColor} fgColor={style.fgColor} level={style.level} />
                </div>
              )}
            </div>
            {!qrValue && (
              <p className="text-center text-[11px] text-secondary-text/70 px-3">
                {fillPlaceholders(t.previewEmptyHintTyped, { type: t.types[activeType].label })}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!qrValue}
              className="w-full py-2.5 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure text-sm"
            >
              <Download size={15} aria-hidden="true" />
              {t.downloadPngButton}
            </button>
            <div className={`grid gap-2.5 ${clipboardSupported ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!qrValue}
                className="w-full py-2 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure text-xs"
              >
                <Download size={13} aria-hidden="true" />
                {t.downloadSvgButton}
              </button>
              {clipboardSupported && (
                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={!qrValue}
                  className="w-full py-2 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure text-xs"
                >
                  {copied ? <Check size={13} aria-hidden="true" className="text-green-400" /> : <Copy size={13} aria-hidden="true" />}
                  {copied ? t.copiedButton : t.copyImageButton}
                </button>
              )}
            </div>
            <BuyMeACoffee
              variant="blockSm"
              label={t.buyMeCoffee}
              modalHeading={t.upiModalHeading}
              modalBody={t.upiModalBody}
              closeLabel={t.closeAriaLabel}
              titleId="qr-upi-modal-heading"
            />
          </div>

          <div className="pt-5 border-t border-ink/10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-secondary-text uppercase tracking-widest">{t.customizeHeading}</p>
              <div className="flex items-center gap-2">
                {QR_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={preset.id}
                    onClick={() => setStyle({ ...style, fgColor: preset.fgColor, bgColor: preset.bgColor })}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      style.fgColor === preset.fgColor && style.bgColor === preset.bgColor ? 'border-accent-blue' : 'border-ink/10'
                    }`}
                    style={{ backgroundColor: preset.fgColor }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="qr-fg-color" className="sr-only">{t.foregroundLabel}</label>
                <input
                  id="qr-fg-color"
                  type="color"
                  value={style.fgColor}
                  onChange={(e) => setStyle({ ...style, fgColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-ink/10 bg-transparent cursor-pointer shrink-0"
                />
                <input
                  aria-label={t.foregroundLabel}
                  value={style.fgColor}
                  onChange={(e) => setStyle({ ...style, fgColor: e.target.value })}
                  className={`${fieldClass} w-full min-w-0 text-xs px-2 py-1.5`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="qr-bg-color" className="sr-only">{t.backgroundLabel}</label>
                <input
                  id="qr-bg-color"
                  type="color"
                  value={style.bgColor}
                  onChange={(e) => setStyle({ ...style, bgColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-ink/10 bg-transparent cursor-pointer shrink-0"
                />
                <input
                  aria-label={t.backgroundLabel}
                  value={style.bgColor}
                  onChange={(e) => setStyle({ ...style, bgColor: e.target.value })}
                  className={`${fieldClass} w-full min-w-0 text-xs px-2 py-1.5`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
