import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Check,
  Download,
  FileDown,
  History as HistoryIcon,
  ImagePlus,
  Plus,
  Save,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { BuyMeACoffee, SupportPrompt } from '../../components/tools/BuyMeACoffee';
import { notifyToolUsed } from '../../components/tools/supportPrompt';
import { Footer } from '../../components/AchievementsContact';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { useLanguage } from '../../i18n/LanguageContext';
import { trackEvent } from '../../monitoring';
import { useInvoiceGenerator } from '../../tools/invoiceGenerator/useInvoiceGenerator';
import { listInvoices, deleteInvoice } from '../../tools/invoiceGenerator/storage';
import { downloadInvoicePdf, shareInvoicePdf } from '../../tools/invoiceGenerator/pdf';
import { CURRENCIES, getCurrencySymbol } from '../../tools/invoiceGenerator/types';
import type { InvoiceData } from '../../tools/invoiceGenerator/types';
import { TOOLS, getToolCategory, getRelatedTools, categoryTitle, toolTitle, toolDescription } from '../../tools/registry';
import { getGuideBySlug } from '../../content/guides/data';
import { guidePath } from '../../content/guides/categories';
import { guideDetailContent } from '../../content/guides/pageContent';

const TOOL = TOOLS.find((t) => t.id === 'invoice-generator')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const RELATED_TOOLS = getRelatedTools(TOOL);

// Curated rather than pulled from every guide's relatedSlugs — this is the
// tool page, so the picks lean toward guides someone filling out an invoice
// right now would actually want (terms, numbering, getting paid), not a
// generic "everything" list. Guides are English-only (see App.tsx route
// comment), so this section only renders for lang === 'en'.
const RELATED_GUIDE_SLUGS = [
  'how-to-make-an-invoice',
  'invoice-payment-terms',
  'invoice-number-guide',
  'how-to-get-paid-faster',
  'accept-online-payments',
  'quote-vs-invoice',
] as const;
const RELATED_GUIDES = RELATED_GUIDE_SLUGS.map((slug) => getGuideBySlug(slug)!).filter(Boolean);

// A hard client-side cap, not a real storage-quota check — most browsers
// give localStorage 5-10MB total, and a base64 logo triggers ~33% overhead
// on top of file size, so we keep this well under that ceiling to leave
// room for years of saved invoices in the same origin.
const MAX_LOGO_BYTES = 700_000;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const fillPlaceholders = (text: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), text);

const fieldClass =
  'bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-2 text-[15px] text-ink placeholder:text-secondary-text/60 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0';

const labelClass = 'text-[11px] font-mono text-secondary-text uppercase tracking-widest';

// Summary-row number fields (discount %, tax %, shipping, amount paid) sit in a
// tight inline layout, so a fixed width truncates larger values. Size them to
// the value's own length instead, within sane min/max bounds for mobile.
const summaryFieldWidth = (value: number, minChars = 3) =>
  `calc(${Math.min(Math.max(minChars, String(value).length + 2), 12)}ch + 1.75rem)`;

export const InvoiceGeneratorPage = () => {
  const { lang, content } = useLanguage();
  const t = content.invoiceGeneratorTool;
  const toolsBase = lang === 'hi' ? '/hi/tools' : '/tools';
  const categoryHref = `${toolsBase}/${TOOL.category}`;

  const { invoice, totals, savedAt, update, updateItem, addItem, removeItem, loadInvoice, newInvoice, save, saveAsDefault } =
    useInvoiceGenerator();

  const [history, setHistory] = useState<InvoiceData[]>(() => listInvoices());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [defaultSavedAt, setDefaultSavedAt] = useState<number | null>(null);
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const symbol = getCurrencySymbol(invoice.currency);

  const [sharing, setSharing] = useState(false);
  const [shareEmailed, setShareEmailed] = useState(false);

  const handleDownload = () => {
    trackEvent('tool_used', { tool_name: TOOL.id, action: 'download' });
    downloadInvoicePdf(invoice);
    notifyToolUsed();
  };

  const handleShare = async () => {
    setSharing(true);
    trackEvent('tool_used', { tool_name: TOOL.id, action: 'share' });
    try {
      const outcome = await shareInvoicePdf(invoice);
      notifyToolUsed();
      if (outcome === 'emailed') {
        setShareEmailed(true);
        setTimeout(() => setShareEmailed(false), 2000);
      }
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const refreshHistory = () => setHistory(listInvoices());

  useEffect(() => {
    if (historyOpen) refreshHistory();
  }, [historyOpen]);

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(true);
      return;
    }
    setLogoError(false);
    const dataUrl = await readFileAsDataUrl(file);
    update('logoDataUrl', dataUrl);
  };

  const handleSave = () => {
    save();
    refreshHistory();
  };

  const handleSaveDefault = () => {
    saveAsDefault();
    setDefaultSavedAt(Date.now());
    setTimeout(() => setDefaultSavedAt(null), 2000);
  };

  const handleLoadHistoryEntry = (entry: InvoiceData) => {
    loadInvoice(entry);
    setHistoryOpen(false);
  };

  const handleDeleteHistoryEntry = (id: string) => {
    deleteInvoice(id);
    refreshHistory();
  };

  const currencyOptions = CURRENCIES.map((c) => ({ value: c.code, label: c.label }));

  const faqItems = t.faq;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
            <Breadcrumbs
              className="mb-3"
              backHref={categoryHref}
              backLabel={fillPlaceholders(t.backTo, { category: categoryTitle(TOOL_CATEGORY, lang) })}
              items={[
                { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/', className: 'hidden sm:flex' },
                { name: content.toolsPage.breadcrumb, href: toolsBase, className: 'hidden sm:flex' },
                { name: categoryTitle(TOOL_CATEGORY, lang), href: categoryHref },
                { name: toolTitle(TOOL, lang) },
              ]}
            />

            <div className="flex flex-col items-center text-center gap-1.5">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">{t.freeToolLabel}</span>
              <div className="w-full flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
                <span aria-hidden="true" className="hidden sm:block" />
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gradient">{toolTitle(TOOL, lang)}</h1>
                <Link
                  to={lang === 'hi' ? '/hi' : '/guides'}
                  className="sm:justify-self-end shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 border border-ink/10 transition-all text-sm whitespace-nowrap"
                >
                  <FileDown size={15} aria-hidden="true" />
                  {t.guidesCtaButton}
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-4"
          >
            <p className="text-xs text-secondary-text leading-snug">
              <strong className="text-ink">{t.privacyNoteLead}</strong> {t.privacyNote}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* The invoice sheet itself doubles as the editor — every field
                below is what ends up in the downloaded PDF, so there's no
                separate live-preview pane to keep in sync. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-3xl bg-bg-secondary border border-ink/5"
            >
              <div className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-6 mb-8">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="sr-only"
                    id="invoice-logo-input"
                  />
                  {invoice.logoDataUrl ? (
                    <div className="relative w-28 h-20 group">
                      <img src={invoice.logoDataUrl} alt={t.logoAlt} className="w-full h-full object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={() => update('logoDataUrl', undefined)}
                        aria-label={t.removeLogoLabel}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-ink/10 text-secondary-text opacity-0 group-hover:opacity-100 hover:text-ink transition-opacity"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-28 h-20 rounded-xl border border-dashed border-ink/15 hover:border-accent-blue/40 flex flex-col items-center justify-center gap-1 text-secondary-text hover:text-accent-blue transition-colors text-xs"
                    >
                      <ImagePlus size={18} aria-hidden="true" />
                      {t.logoUploadLabel}
                    </button>
                  )}
                  {logoError && <p role="alert" className="text-red-400 light:text-red-600 text-xs mt-2 max-w-[200px]">{t.logoTooLarge}</p>}
                </div>

                <div className="w-full max-w-[220px] sm:w-44 sm:ml-auto">
                  <label htmlFor="invoice-title" className="sr-only">{t.invoiceHeading}</label>
                  <input
                    id="invoice-title"
                    value={invoice.invoiceTitle}
                    onChange={(e) => update('invoiceTitle', e.target.value)}
                    placeholder={t.invoiceHeading}
                    className="w-full bg-ink/[0.03] border border-ink/10 hover:border-ink/20 focus:border-accent-blue focus:bg-ink/5 rounded-lg px-3 py-1 text-center sm:text-right text-2xl sm:text-3xl font-bold tracking-tight text-ink placeholder:text-secondary-text/60 focus:outline-none transition-colors mb-2"
                  />
                  <div className="flex items-center justify-center sm:justify-end gap-2">
                    <label htmlFor="invoice-number" className="sr-only">{t.invoiceNumberLabel}</label>
                    <span className="text-secondary-text text-sm shrink-0">#</span>
                    <input
                      id="invoice-number"
                      value={invoice.invoiceNumber}
                      onChange={(e) => update('invoiceNumber', e.target.value)}
                      className={`${fieldClass} text-right w-0 flex-1`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <label htmlFor="invoice-from" className={labelClass}>{t.fromLabel}</label>
                  <textarea
                    id="invoice-from"
                    value={invoice.fromAddress}
                    onChange={(e) => update('fromAddress', e.target.value)}
                    placeholder={t.fromPlaceholder}
                    rows={3}
                    className={`${fieldClass} w-full resize-none`}
                  />
                </div>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 content-start">
                  {[
                    { key: 'date' as const, label: t.dateLabel, type: 'date' },
                    { key: 'dueDate' as const, label: t.dueDateLabel, type: 'date' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1 min-w-0">
                      <label htmlFor={`invoice-${field.key}`} className={labelClass}>{field.label}</label>
                      <input
                        id={`invoice-${field.key}`}
                        type={field.type}
                        value={invoice[field.key]}
                        onChange={(e) => update(field.key, e.target.value)}
                        className={`${fieldClass} w-full min-w-0`}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label htmlFor="invoice-payment-terms" className={labelClass}>{t.paymentTermsLabel}</label>
                    <input
                      id="invoice-payment-terms"
                      value={invoice.paymentTerms}
                      onChange={(e) => update('paymentTerms', e.target.value)}
                      placeholder={t.paymentTermsPlaceholder}
                      className={`${fieldClass} w-full`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="invoice-po-number" className={labelClass}>{t.poNumberLabel}</label>
                    <input
                      id="invoice-po-number"
                      value={invoice.poNumber}
                      onChange={(e) => update('poNumber', e.target.value)}
                      className={`${fieldClass} w-full`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <label htmlFor="invoice-bill-to" className={labelClass}>{t.billToLabel}</label>
                  <textarea
                    id="invoice-bill-to"
                    value={invoice.billTo}
                    onChange={(e) => update('billTo', e.target.value)}
                    placeholder={t.billToPlaceholder}
                    rows={3}
                    className={`${fieldClass} w-full resize-none`}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="invoice-ship-to" className={labelClass}>
                    {t.shipToLabel} <span className="normal-case text-secondary-text/70">{t.optionalLabel}</span>
                  </label>
                  <textarea
                    id="invoice-ship-to"
                    value={invoice.shipTo}
                    onChange={(e) => update('shipTo', e.target.value)}
                    placeholder={t.shipToPlaceholder}
                    rows={3}
                    className={`${fieldClass} w-full resize-none`}
                  />
                </div>
              </div>

              <div className="mb-8">
                {/* Card layout on mobile so every field is visible without scrolling;
                    the table layout (sm+) has room for all columns side by side. */}
                <div className="sm:hidden space-y-3">
                  {invoice.items.map((item, index) => (
                    <div key={item.id} className="p-3 rounded-xl bg-ink/[0.02] border border-ink/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={labelClass}>
                          {t.itemHeader} {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={invoice.items.length <= 1}
                          aria-label={t.removeLineItemLabel}
                          className="p-1.5 rounded-lg text-secondary-text hover:text-red-400 disabled:opacity-30 disabled:hover:text-secondary-text transition-colors"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder={t.itemPlaceholder}
                        className={`${fieldClass} w-full`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label htmlFor={`item-qty-${item.id}`} className={labelClass}>{t.quantityHeader}</label>
                          <input
                            id={`item-qty-${item.id}`}
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                            className={`${fieldClass} w-full`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`item-rate-${item.id}`} className={labelClass}>{t.rateHeader}</label>
                          <input
                            id={`item-rate-${item.id}`}
                            type="number"
                            min={0}
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) || 0 })}
                            className={`${fieldClass} w-full`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-ink/10">
                        <span className={labelClass}>{t.amountHeader}</span>
                        <span className="text-ink font-medium">
                          {symbol}
                          {(item.quantity * item.rate).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <table className="w-full text-sm hidden sm:table">
                  <thead>
                    <tr className="border-b border-ink/10 text-left">
                      <th className={`${labelClass} pb-2 font-normal`}>{t.itemHeader}</th>
                      <th className={`${labelClass} pb-2 font-normal text-right w-20`}>{t.quantityHeader}</th>
                      <th className={`${labelClass} pb-2 font-normal text-right w-28`}>{t.rateHeader}</th>
                      <th className={`${labelClass} pb-2 font-normal text-right w-28`}>{t.amountHeader}</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-ink/5">
                        <td className="py-1 pr-3">
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder={t.itemPlaceholder}
                            className={`${fieldClass} w-full`}
                          />
                        </td>
                        <td className="py-1 px-1.5">
                          <input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                            className={`${fieldClass} w-full text-right`}
                          />
                        </td>
                        <td className="py-1 px-1.5">
                          <input
                            type="number"
                            min={0}
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) || 0 })}
                            className={`${fieldClass} w-full text-right`}
                          />
                        </td>
                        <td className="py-1 text-right text-ink pl-1.5 pr-2">
                          {symbol}
                          {(item.quantity * item.rate).toFixed(2)}
                        </td>
                        <td className="py-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={invoice.items.length <= 1}
                            aria-label={t.removeLineItemLabel}
                            className="p-1.5 rounded-lg text-secondary-text hover:text-red-400 disabled:opacity-30 disabled:hover:text-secondary-text transition-colors"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-ink/15 hover:border-accent-blue/40 text-secondary-text hover:text-accent-blue transition-colors text-sm inline-flex items-center justify-center gap-2"
                >
                  <Plus size={14} aria-hidden="true" />
                  {t.addLineItemButton}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="invoice-notes" className={labelClass}>{t.notesLabel}</label>
                    <textarea
                      id="invoice-notes"
                      value={invoice.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      placeholder={t.notesPlaceholder}
                      rows={3}
                      className={`${fieldClass} w-full resize-none`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="invoice-terms" className={labelClass}>{t.termsLabel}</label>
                    <textarea
                      id="invoice-terms"
                      value={invoice.terms}
                      onChange={(e) => update('terms', e.target.value)}
                      placeholder={t.termsPlaceholder}
                      rows={3}
                      className={`${fieldClass} w-full resize-none`}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-text">{t.subtotalLabel}</span>
                    <span className="text-ink font-medium">{symbol}{totals.subtotal.toFixed(2)}</span>
                  </div>

                  {invoice.discountEnabled ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-secondary-text">{t.discountLabel}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-4 shrink-0" aria-hidden="true" />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={invoice.discountPercent}
                          onChange={(e) => update('discountPercent', Number(e.target.value) || 0)}
                          style={{ width: summaryFieldWidth(invoice.discountPercent) }}
                          className={`${fieldClass} text-right shrink-0 min-w-0`}
                        />
                        <span className="w-4 shrink-0 text-secondary-text text-center">%</span>
                        <button
                          type="button"
                          onClick={() => update('discountEnabled', false)}
                          aria-label={t.removeLabel}
                          className="w-5 shrink-0 flex items-center justify-center text-secondary-text hover:text-red-400"
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => update('discountEnabled', true)} className="text-accent-blue hover:underline text-xs">
                      {t.addDiscountButton}
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-secondary-text">{t.taxLabel}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-4 shrink-0" aria-hidden="true" />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={invoice.taxPercent}
                        onChange={(e) => update('taxPercent', Number(e.target.value) || 0)}
                        style={{ width: summaryFieldWidth(invoice.taxPercent) }}
                        className={`${fieldClass} text-right shrink-0 min-w-0`}
                      />
                      <span className="w-4 shrink-0 text-secondary-text text-center">%</span>
                      <span className="w-5 shrink-0" aria-hidden="true" />
                    </div>
                  </div>

                  {invoice.shippingEnabled ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-secondary-text">{t.shippingLabel}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-4 shrink-0 text-secondary-text text-center">{symbol}</span>
                        <input
                          type="number"
                          min={0}
                          value={invoice.shippingAmount}
                          onChange={(e) => update('shippingAmount', Number(e.target.value) || 0)}
                          style={{ width: summaryFieldWidth(invoice.shippingAmount, 4) }}
                          className={`${fieldClass} text-right shrink-0 min-w-0`}
                        />
                        <span className="w-4 shrink-0" aria-hidden="true" />
                        <button
                          type="button"
                          onClick={() => update('shippingEnabled', false)}
                          aria-label={t.removeLabel}
                          className="w-5 shrink-0 flex items-center justify-center text-secondary-text hover:text-red-400"
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => update('shippingEnabled', true)} className="text-accent-blue hover:underline text-xs">
                      {t.addShippingButton}
                    </button>
                  )}

                  <div className="pt-2 mt-1 border-t border-ink/10 flex items-center justify-between">
                    <span className="text-ink font-bold">{t.totalLabel}</span>
                    <span className="text-ink font-bold">{symbol}{totals.total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-secondary-text">{t.amountPaidLabel}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-4 shrink-0 text-secondary-text text-center">{symbol}</span>
                      <input
                        type="number"
                        min={0}
                        value={invoice.amountPaid}
                        onChange={(e) => update('amountPaid', Number(e.target.value) || 0)}
                        style={{ width: summaryFieldWidth(invoice.amountPaid, 4) }}
                        className={`${fieldClass} text-right shrink-0 min-w-0`}
                      />
                      <span className="w-4 shrink-0" aria-hidden="true" />
                      <span className="w-5 shrink-0" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink/10 flex items-center justify-between">
                    <span className="text-ink font-bold text-base">{t.balanceDueLabel}</span>
                    <span className="text-accent-blue font-bold text-base">{symbol}{totals.balanceDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-3xl glass border-ink/10 space-y-3 lg:sticky lg:top-28"
            >
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
              >
                <Download size={16} aria-hidden="true" />
                {t.downloadPdfButton}
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="w-full py-3 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
              >
                {shareEmailed ? <Check size={16} aria-hidden="true" className="text-green-400" /> : <Share2 size={16} aria-hidden="true" />}
                {shareEmailed ? t.shareEmailedButton : t.shareButton}
              </button>

              <BuyMeACoffee
                label={t.buyMeCoffee}
                modalHeading={t.upiModalHeading}
                modalBody={t.upiModalBody}
                closeLabel={t.closeAriaLabel}
              />

              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
              >
                {savedAt ? <Check size={16} aria-hidden="true" className="text-green-400" /> : <Save size={16} aria-hidden="true" />}
                {savedAt ? t.savedButton : t.saveButton}
              </button>

              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="w-full py-2.5 text-secondary-text hover:text-ink text-sm font-medium rounded-xl hover:bg-ink/5 transition-all flex items-center justify-center gap-2"
              >
                <HistoryIcon size={15} aria-hidden="true" />
                {fillPlaceholders(t.historyButton, { count: String(history.length) })}
              </button>

              <button
                type="button"
                onClick={newInvoice}
                className="w-full py-2.5 text-secondary-text hover:text-ink text-sm font-medium rounded-xl hover:bg-ink/5 transition-all"
              >
                {t.newInvoiceButton}
              </button>

              <div className="pt-3 border-t border-ink/10 space-y-3">
                <p className="text-xs font-mono text-secondary-text uppercase tracking-widest">{t.settingsHeading}</p>
                <div className="space-y-1">
                  <label htmlFor="invoice-currency" className={labelClass}>{t.currencyLabel}</label>
                  <Select id="invoice-currency" value={invoice.currency} onChange={(value) => update('currency', value)} options={currencyOptions} />
                </div>
                <button
                  type="button"
                  onClick={handleSaveDefault}
                  className="w-full text-left text-accent-blue hover:underline text-xs inline-flex items-center gap-1.5"
                >
                  {defaultSavedAt ? <Check size={12} aria-hidden="true" /> : null}
                  {defaultSavedAt ? t.savedDefaultConfirmation : t.saveDefaultButton}
                </button>
              </div>
            </motion.div>
          </div>
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

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-14">
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

        <div className="p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-ink font-medium mb-1">{t.guidesCtaHeading}</p>
            <p className="text-secondary-text text-sm">{t.guidesCtaBody}</p>
          </div>
          <Link
            to={lang === 'hi' ? '/hi' : '/guides'}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all"
          >
            <FileDown size={16} aria-hidden="true" />
            {t.guidesCtaButton}
          </Link>
        </div>

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

        {lang !== 'hi' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{guideDetailContent.relatedHeading}</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {RELATED_GUIDES.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    to={guidePath(guide)}
                    className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                  >
                    <span className="font-bold text-ink">{guide.title}</span>
                    <p className="text-secondary-text text-sm mt-1">{guide.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

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
        {historyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setHistoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-history-heading"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-bg-secondary border border-ink/10 p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="invoice-history-heading" className="text-lg font-bold text-ink">{t.historyHeading}</h3>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  aria-label={t.closeAriaLabel}
                  className="p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {history.length === 0 ? (
                <p className="text-secondary-text text-sm">{t.historyEmpty}</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-ink/5">
                      <button type="button" onClick={() => handleLoadHistoryEntry(entry)} className="text-left min-w-0 flex-1">
                        <p className="text-ink font-medium truncate">
                          {t.invoiceHeading} #{entry.invoiceNumber || '—'} {entry.billTo ? `— ${entry.billTo.split('\n')[0]}` : ''}
                        </p>
                        <p className="text-secondary-text text-xs">
                          {new Date(entry.updatedAt).toLocaleDateString()} · {getCurrencySymbol(entry.currency)}
                          {entry.items.reduce((sum, i) => sum + i.quantity * i.rate, 0).toFixed(2)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryEntry(entry.id)}
                        aria-label={t.historyDeleteButton}
                        className="p-2 rounded-lg text-secondary-text hover:text-red-400 hover:bg-ink/10 transition-colors shrink-0"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-secondary-text text-xs mt-4 pt-4 border-t border-ink/10">{t.historyStorageNote}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SupportPrompt copy={{ closeLabel: t.closeAriaLabel }} titleId="invoice-support-prompt-heading" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
