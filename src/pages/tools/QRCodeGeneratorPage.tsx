import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Coffee,
  Copy,
  Download,
  FileText,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Share2,
  Shuffle,
  Smartphone,
  Text,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { FaDiscord, FaFacebook, FaInstagram, FaLinkedin, FaSpotify, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { useLanguage } from '../../i18n/LanguageContext';
import { trackEvent } from '../../monitoring';
import { useQrCodeGenerator } from '../../tools/qrCodeGenerator/useQrCodeGenerator';
import { downloadCanvasAsPng, downloadSvgElement, copyCanvasToClipboard } from '../../tools/qrCodeGenerator/download';
import { QR_COLOR_PRESETS, SOCIAL_PLATFORMS } from '../../tools/qrCodeGenerator/types';
import type { QrTypeId } from '../../tools/qrCodeGenerator/types';
import { TOOLS, getToolCategory, getRelatedTools, categoryTitle, toolTitle, toolDescription } from '../../tools/registry';
import { getGuideBySlug } from '../../content/guides/data';
import { guidePath } from '../../content/guides/categories';

const TOOL = TOOLS.find((t) => t.id === 'qr-code-generator')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const RELATED_TOOLS = getRelatedTools(TOOL);
const QR_GUIDE = getGuideBySlug('how-to-make-a-qr-code');

// Fixed production origin (matches the pattern in JsonLd/Breadcrumbs/LanguageContext) —
// this is embedded directly into generated QR codes, so it must always resolve to the
// real domain regardless of where the page happens to be running.
const SITE_ORIGIN = 'https://101techlabs.com';
const REDIRECT_PAGE_URL = `${SITE_ORIGIN}/tools/generators/qr-code-generator/go`;

// Shown in the preview before the user has typed anything, so the panel
// never looks broken/empty on first load — never used for downloads/copy,
// which stay gated on the real qrValue.
const PLACEHOLDER_QR_VALUE = 'https://101techlabs.com/';

const UPI_ID = 'marpit697.ad@ybl';
const UPI_NUMBER = '7071520965';
const UPI_PAYEE_NAME = 'Arpit Dwivedi';
const UPI_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&cu=INR`;

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
  app: Smartphone,
  sms: MessageSquare,
  email: Mail,
  phone: Phone,
  social: Share2,
};

const QR_TYPE_ORDER: QrTypeId[] = ['url', 'pdf', 'multiUrl', 'contact', 'text', 'app', 'sms', 'email', 'phone', 'social'];

const fillPlaceholders = (text: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), text);

const fieldClass =
  'bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2 text-[15px] text-ink placeholder:text-secondary-text/60 focus:outline-none transition-colors';

const labelClass = 'text-[11px] font-mono text-secondary-text uppercase tracking-widest';

export const QRCodeGeneratorPage = () => {
  const { lang, content } = useLanguage();
  const t = content.qrCodeGeneratorTool;
  const toolsBase = lang === 'hi' ? '/hi/tools' : '/tools';
  const categoryHref = `${toolsBase}/${TOOL.category}`;

  const { activeType, setActiveType, forms, updateForm, style, setStyle, qrValue } = useQrCodeGenerator(REDIRECT_PAGE_URL);

  const svgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'upi' | 'number' | null>(null);

  const handleCopyUpi = (field: 'upi' | 'number', value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setClipboardSupported(Boolean(navigator.clipboard?.write && typeof ClipboardItem !== 'undefined'));
  }, []);

  const handleDownloadPng = () => {
    if (!qrValue || !canvasRef.current) return;
    trackEvent('tool_used', { tool_name: TOOL.id, action: 'download_png', qr_type: activeType });
    downloadCanvasAsPng(canvasRef.current, 'qr-code.png');
  };

  const handleDownloadSvg = () => {
    if (!qrValue) return;
    const svgEl = svgRef.current?.querySelector('svg');
    if (svgEl) {
      trackEvent('tool_used', { tool_name: TOOL.id, action: 'download_svg', qr_type: activeType });
      downloadSvgElement(svgEl, 'qr-code.svg');
    }
  };

  const handleCopyImage = async () => {
    if (!qrValue || !canvasRef.current) return;
    const ok = await copyCanvasToClipboard(canvasRef.current);
    if (ok) {
      trackEvent('tool_used', { tool_name: TOOL.id, action: 'copy', qr_type: activeType });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const activePlatform = SOCIAL_PLATFORMS.find((p) => p.id === forms.social.platform) ?? SOCIAL_PLATFORMS[0];
  const faqItems = t.faq;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-28 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-3">
            <Breadcrumbs
              className="mb-2"
              backHref={categoryHref}
              backLabel={fillPlaceholders(t.backTo, { category: categoryTitle(TOOL_CATEGORY, lang) })}
              items={[
                { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/', className: 'hidden sm:flex' },
                { name: content.toolsPage.breadcrumb, href: toolsBase, className: 'hidden sm:flex' },
                { name: categoryTitle(TOOL_CATEGORY, lang), href: categoryHref },
                { name: toolTitle(TOOL, lang) },
              ]}
            />

            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">{t.freeToolLabel}</span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gradient">{toolTitle(TOOL, lang)}</h1>
              {QR_GUIDE && (
                <Link
                  to={lang === 'hi' ? '/hi' : guidePath(QR_GUIDE)}
                  className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium text-secondary-text hover:text-accent-blue transition-colors"
                >
                  <BookOpen size={13} aria-hidden="true" />
                  Guide
                </Link>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-3"
          >
            <p className="text-xs text-secondary-text leading-snug">
              <strong className="text-ink">{t.privacyNoteLead}</strong> {t.privacyNote}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-6 rounded-3xl bg-bg-secondary border border-ink/5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label={t.typeTabsAriaLabel}>
                {QR_TYPE_ORDER.map((type) => {
                  const Icon = QR_TYPE_ICONS[type];
                  const isActive = type === activeType;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveType(type)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isActive ? 'bg-accent-blue text-bg-pure' : 'bg-ink/5 text-secondary-text hover:text-ink hover:bg-ink/10'
                      }`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {t.types[type].label}
                    </button>
                  );
                })}
              </div>

              <h2 className="text-base font-bold text-ink mb-1">{t.types[activeType].heading}</h2>
              <p className="text-secondary-text text-sm mb-4">{t.types[activeType].description}</p>

              {activeType === 'url' && (
                <div className="space-y-1">
                  <label htmlFor="qr-url" className="sr-only">{t.types.url.fieldLabel}</label>
                  <input
                    id="qr-url"
                    value={forms.url.value}
                    onChange={(e) => updateForm('url', { value: e.target.value })}
                    placeholder={t.types.url.placeholder}
                    className={`${fieldClass} w-full`}
                  />
                </div>
              )}

              {activeType === 'pdf' && (
                <div className="space-y-2">
                  <label htmlFor="qr-pdf" className="sr-only">{t.types.pdf.fieldLabel}</label>
                  <input
                    id="qr-pdf"
                    value={forms.pdf.value}
                    onChange={(e) => updateForm('pdf', { value: e.target.value })}
                    placeholder={t.types.pdf.placeholder}
                    className={`${fieldClass} w-full`}
                  />
                  <p className="text-secondary-text text-xs">{t.types.pdf.helpNote}</p>
                </div>
              )}

              {activeType === 'text' && (
                <div className="space-y-1">
                  <label htmlFor="qr-text" className={labelClass}>{t.types.text.fieldLabel}</label>
                  <textarea
                    id="qr-text"
                    value={forms.text.value}
                    onChange={(e) => updateForm('text', { value: e.target.value })}
                    placeholder={t.types.text.placeholder}
                    rows={5}
                    className={`${fieldClass} w-full resize-none`}
                  />
                </div>
              )}

              {activeType === 'phone' && (
                <div className="space-y-1">
                  <label htmlFor="qr-phone" className={labelClass}>{t.types.phone.phoneLabel}</label>
                  <input
                    id="qr-phone"
                    type="tel"
                    value={forms.phone.phone}
                    onChange={(e) => updateForm('phone', { phone: e.target.value })}
                    placeholder={t.types.phone.phonePlaceholder}
                    className={`${fieldClass} w-full`}
                  />
                </div>
              )}

              {activeType === 'sms' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="qr-sms-phone" className={labelClass}>{t.types.sms.phoneLabel}</label>
                    <input
                      id="qr-sms-phone"
                      type="tel"
                      value={forms.sms.phone}
                      onChange={(e) => updateForm('sms', { phone: e.target.value })}
                      placeholder={t.types.sms.phonePlaceholder}
                      className={`${fieldClass} w-full`}
                    />
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
                    <label htmlFor="qr-email-to" className={labelClass}>{t.types.email.toLabel}</label>
                    <input
                      id="qr-email-to"
                      type="email"
                      value={forms.email.to}
                      onChange={(e) => updateForm('email', { to: e.target.value })}
                      placeholder={t.types.email.toPlaceholder}
                      className={`${fieldClass} w-full`}
                    />
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
                    <label htmlFor="qr-social-url" className={labelClass}>{t.types.social.urlLabel}</label>
                    <input
                      id="qr-social-url"
                      value={forms.social.value}
                      onChange={(e) => updateForm('social', { value: e.target.value })}
                      placeholder={activePlatform.placeholder}
                      className={`${fieldClass} w-full`}
                    />
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
                      placeholder={t.types.app.iosPlaceholder}
                      className={`${fieldClass} w-full`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="qr-app-android" className={labelClass}>{t.types.app.androidLabel}</label>
                    <input
                      id="qr-app-android"
                      value={forms.app.android}
                      onChange={(e) => updateForm('app', { android: e.target.value })}
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
                        placeholder={fillPlaceholders(t.types.multiUrl.urlFieldLabel, { index: String(index + 1) })}
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
                  <p className="text-secondary-text text-xs">{t.types.multiUrl.minUrlsNote}</p>
                </div>
              )}

              {activeType === 'contact' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(
                    [
                      ['prefix', t.types.contact.prefixLabel],
                      ['firstName', t.types.contact.firstNameLabel],
                      ['lastName', t.types.contact.lastNameLabel],
                      ['organization', t.types.contact.organizationLabel],
                      ['title', t.types.contact.titleLabel],
                      ['email', t.types.contact.emailLabel],
                      ['mobile', t.types.contact.mobileLabel],
                      ['homePhone', t.types.contact.homePhoneLabel],
                      ['fax', t.types.contact.faxLabel],
                      ['street', t.types.contact.streetLabel],
                      ['city', t.types.contact.cityLabel],
                      ['region', t.types.contact.regionLabel],
                      ['postcode', t.types.contact.postcodeLabel],
                      ['country', t.types.contact.countryLabel],
                      ['website', t.types.contact.websiteLabel],
                    ] as const
                  ).map(([field, label]) => (
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
              )}
            </div>

            <div className="space-y-6 lg:pl-6 lg:border-l lg:border-ink/10 lg:sticky lg:top-28">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-white">
                  <div ref={svgRef}>
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
                {!qrValue && <p className="text-center text-[11px] text-secondary-text/70 px-3">{t.previewEmptyHint}</p>}
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
                <button
                  type="button"
                  onClick={() => setUpiModalOpen(true)}
                  className="w-full py-2 bg-[#FFDD00]/10 text-[#FFDD00] font-bold rounded-xl hover:bg-[#FFDD00]/20 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure text-xs"
                >
                  <Coffee size={14} aria-hidden="true" />
                  {t.buyMeCoffee}
                </button>
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
        </div>
      </main>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: toolTitle(TOOL, lang),
          url: `https://101techlabs.com${categoryHref}/${TOOL.path}`,
          description: toolDescription(TOOL, lang),
          inLanguage: lang,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          provider: { '@id': 'https://101techlabs.com/#organization' },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.howItWorksTitle}</h2>
          <ol className="space-y-2 text-secondary-text list-decimal list-inside">
            {t.howItWorksSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>

        {lang !== 'hi' && (
          <div className="p-6 rounded-2xl bg-bg-secondary border border-ink/5">
            <span className="text-accent-blue font-mono uppercase tracking-widest text-[10px] block mb-2">{t.judgmentHeading}</span>
            <p className="text-secondary-text text-sm leading-relaxed">{t.judgmentText}</p>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.featuresTitle}</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-secondary-text">
            {t.features.map((feature) => (
              <li key={feature} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">{feature}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.useCasesTitle}</h2>
          <ul className="space-y-2 text-secondary-text list-disc list-inside">
            {t.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{t.advantagesTitle}</h2>
            <ul className="space-y-2 text-secondary-text list-disc list-inside">
              {t.advantages.map((advantage) => <li key={advantage}>{advantage}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{t.limitationsTitle}</h2>
            <ul className="space-y-2 text-secondary-text list-disc list-inside">
              {t.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.faqTitle}</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.question} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{item.question}</h3>
                <p className="text-secondary-text text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {QR_GUIDE && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Guides</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              <li>
                <Link
                  to={lang === 'hi' ? '/hi' : guidePath(QR_GUIDE)}
                  className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                >
                  <span className="font-bold text-ink">{QR_GUIDE.title}</span>
                  <p className="text-secondary-text text-sm mt-1">{QR_GUIDE.description}</p>
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.relatedToolsTitle}</h2>
          {RELATED_TOOLS.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {RELATED_TOOLS.map((related) => (
                <li key={related.id}>
                  <Link
                    to={`${toolsBase}/${related.category}/${related.path}`}
                    className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                  >
                    <span className="font-bold text-ink">{toolTitle(related, lang)}</span>
                    <p className="text-secondary-text text-sm mt-1">{toolDescription(related, lang)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary-text text-sm">
              {fillPlaceholders(t.moreComingSoon, { category: categoryTitle(TOOL_CATEGORY, lang).toLowerCase() })}{' '}
              <Link to={toolsBase} className="text-accent-blue hover:underline">{t.browseAllTools}</Link>.
            </p>
          )}
        </div>

        <div className="p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-ink font-medium">{t.crmCta}</p>
          <Link
            to={`${lang === 'hi' ? '/hi/contact' : '/contact'}?source=${TOOL.id}`}
            onClick={() => trackEvent('tool_to_contact_click', { tool_name: TOOL.id })}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
          >
            {t.talkToUs}
          </Link>
        </div>
      </section>

      <Footer />

      <AnimatePresence>
        {upiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setUpiModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="qr-upi-modal-heading"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-bg-secondary border border-ink/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="qr-upi-modal-heading" className="text-lg font-bold text-ink flex items-center gap-2">
                  <Coffee size={18} className="text-[#FFDD00]" aria-hidden="true" />
                  {t.upiModalHeading}
                </h3>
                <button
                  type="button"
                  onClick={() => setUpiModalOpen(false)}
                  aria-label={t.closeAriaLabel}
                  className="p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-secondary-text mb-4">{t.upiModalBody}</p>

              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-white">
                  <QRCodeSVG value={UPI_LINK} size={180} bgColor="#ffffff" fgColor="#000000" level="M" includeMargin={false} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/5">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-secondary-text">{t.upiIdLabel}</p>
                    <p className="text-sm font-bold text-ink truncate">{UPI_ID}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi('upi', UPI_ID)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-all"
                  >
                    {copiedField === 'upi' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copiedField === 'upi' ? t.copiedButton : t.copyButton}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/5">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-secondary-text">{t.upiNumberLabel}</p>
                    <p className="text-sm font-bold text-ink truncate">{UPI_NUMBER}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi('number', UPI_NUMBER)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-all"
                  >
                    {copiedField === 'number' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copiedField === 'number' ? t.copiedButton : t.copyButton}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
