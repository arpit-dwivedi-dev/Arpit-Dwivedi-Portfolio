import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronDown, Crown, Download, Info, Loader2, Mail, MapPin, Star, X } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { Select } from '../../components/ui/Select';
import { BuyMeACoffee } from '../../components/tools/BuyMeACoffee';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { useLanguage } from '../../i18n/LanguageContext';
import { trackEvent } from '../../monitoring';
import { useMapsScraper, MAX_RESULTS_PER_SEARCH, MAX_SEARCHES_PER_SESSION } from '../../tools/googleMapsScraper/useMapsScraper';
import { isLiveMode } from '../../tools/googleMapsScraper/dataSource';
import { toCsv, downloadCsv, toJson, downloadJson, toExcel, downloadExcel } from '../../lib/csv';
import { TOOLS, getToolCategory, getRelatedTools, categoryTitle, toolTitle, toolDescription } from '../../tools/registry';

const TOOL = TOOLS.find((t) => t.id === 'google-maps-business-finder')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const RELATED_TOOLS = getRelatedTools(TOOL);

// Replaces the {maxResults}/{maxSearches}/{category}/{n}/{used}/{max}
// placeholders used in metadata.json/hi.ts so translated copy can still
// reference live, numeric values.
const fillPlaceholders = (text: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), text);

const CONTACT_EMAIL = '101techlabs@gmail.com';

const CSV_COLUMNS = [
  { key: 'name' as const, label: 'Business' },
  { key: 'address' as const, label: 'Address' },
  { key: 'phone' as const, label: 'Phone' },
  { key: 'website' as const, label: 'Website' },
  { key: 'rating' as const, label: 'Rating' },
  { key: 'hours' as const, label: 'Hours' },
];

export const GoogleMapsScraperPage = () => {
  const { lang, content } = useLanguage();
  const t = content.mapsScraperTool;
  const placeholderVars = { maxResults: String(MAX_RESULTS_PER_SEARCH), maxSearches: String(MAX_SEARCHES_PER_SESSION) };
  const faqItems = t.faq.map((item) => ({ question: item.question, answer: fillPlaceholders(item.answer, placeholderVars) }));
  const resultCountOptions = [
    ...[5, 10, 15].map((n) => ({ value: String(n), label: fillPlaceholders(t.resultsOptionLabel, { n: String(n) }) })),
    { value: 'more', label: t.morePremiumOption },
  ];
  const toolsBase = lang === 'hi' ? '/hi/tools' : '/tools';
  const categoryHref = `${toolsBase}/${TOOL.category}`;
  const {
    results,
    running,
    stopping,
    error,
    run,
    cancel,
    searchesUsed,
    remainingSearches,
    sessionLimitReached,
    targetCount,
  } = useMapsScraper();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [count, setCount] = useState('10');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Only combine when both are present — an empty "what" should still hit
    // the hook's own "enter a search term" validation, not silently become
    // "in Austin, TX" with no subject.
    const combined = query.trim() && location.trim() ? `${query.trim()} in ${location.trim()}` : query.trim();
    if (combined) trackEvent('tool_used', { tool_name: TOOL.id, action: 'run' });
    run(combined, Number(count));
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (!results.length) return;
    const base = `google-maps-results-${Date.now()}`;
    if (format === 'csv') {
      downloadCsv(`${base}.csv`, toCsv(results, CSV_COLUMNS));
    } else if (format === 'json') {
      downloadJson(`${base}.json`, toJson(results, CSV_COLUMNS));
    } else {
      downloadExcel(`${base}.xls`, toExcel(results, CSV_COLUMNS));
    }
    setExportMenuOpen(false);
  };

  // Announced to screen readers via the sr-only status region below — the
  // progress bar and streamed rows are otherwise silent to assistive tech.
  const statusText = running
    ? fillPlaceholders(t.statusSearching, { loaded: String(results.length), target: String(targetCount) })
    : results.length > 0
      ? fillPlaceholders(t.statusLoaded, { count: String(results.length) })
      : '';

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-28 pb-16 lg:pb-6 lg:h-dvh">
        <div className="max-w-7xl mx-auto px-6 w-full lg:h-full lg:flex lg:flex-col lg:min-h-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 lg:shrink-0">
            <Breadcrumbs
              className="mb-6"
              backHref={categoryHref}
              backLabel={fillPlaceholders(t.backTo, { category: categoryTitle(TOOL_CATEGORY, lang) })}
              items={[
                { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' },
                { name: content.toolsPage.breadcrumb, href: toolsBase },
                { name: categoryTitle(TOOL_CATEGORY, lang), href: categoryHref },
                { name: toolTitle(TOOL, lang) },
              ]}
            />

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-1 block">{t.freeToolLabel}</span>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
                  {toolTitle(TOOL, lang)}
                </h1>
              </div>
              <p className="text-secondary-text max-w-md text-sm">{t.heroDescription}</p>
            </div>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-6 lg:shrink-0"
          >
            <Info size={16} className="text-accent-blue shrink-0" aria-hidden="true" />
            <p className="text-xs md:text-sm text-secondary-text leading-relaxed">
              {isLiveMode ? (
                <>
                  <strong className="text-ink">Heads up</strong> — this reads publicly visible Google Maps listing data at low
                  volume: throttled, capped at {MAX_RESULTS_PER_SEARCH} rows/search and {MAX_SEARCHES_PER_SESSION} searches/session.
                  It's built for quick lookups, not bulk extraction.
                </>
              ) : (
                <>
                  <strong className="text-ink">Demo mode</strong> — sample data below, not live Google Maps results. Once a backend
                  is connected, real requests stay low-volume: throttled, capped at {MAX_RESULTS_PER_SEARCH} rows/search and{' '}
                  {MAX_SEARCHES_PER_SESSION} searches/session.
                </>
              )}
            </p>
          </motion.div> */}

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start lg:items-stretch lg:flex-1 lg:min-h-0">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl glass border-ink/10 space-y-5 lg:h-full lg:overflow-y-auto"
            >
              <div className="space-y-2">
                <label htmlFor="maps-query" className="text-xs font-mono text-secondary-text uppercase tracking-widest">
                  {t.searchLabel}
                </label>
                <input
                  id="maps-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  disabled={running || stopping || sessionLimitReached}
                  aria-describedby="session-status"
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maps-location" className="text-xs font-mono text-secondary-text uppercase tracking-widest">
                  {t.locationLabel} <span className="normal-case text-secondary-text/70">{t.optionalLabel}</span>
                </label>
                <input
                  id="maps-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.locationPlaceholder}
                  disabled={running || stopping || sessionLimitReached}
                  aria-describedby="session-status"
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maps-count" className="text-xs font-mono text-secondary-text uppercase tracking-widest">
                  {t.resultsLabel}
                </label>
                <Select
                  id="maps-count"
                  value={count}
                  onChange={(value) => {
                    if (value === 'more') {
                      setPremiumModalOpen(true);
                      return;
                    }
                    setCount(value);
                  }}
                  options={resultCountOptions}
                  disabled={running || stopping || sessionLimitReached}
                  ariaDescribedBy="session-status"
                />
              </div>

              {running ? (
                <button
                  type="button"
                  onClick={cancel}
                  className="w-full py-3 bg-ink/5 text-ink font-bold rounded-xl hover:bg-ink/10 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
                >
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  {t.stopButton}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={stopping || sessionLimitReached}
                  aria-describedby="session-status"
                  className="w-full py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
                >
                  {t.runSearchButton}
                </button>
              )}

              <p id="session-status" role="status" aria-live="polite" className="text-xs font-mono text-secondary-text text-center">
                {fillPlaceholders(t.sessionStatus, { used: String(searchesUsed), max: String(MAX_SEARCHES_PER_SESSION) })}
                {sessionLimitReached && t.sessionLimitNote}
              </p>

              {error && (
                <p role="alert" className="text-red-400 light:text-red-600 text-sm">
                  {error === 'empty-query' ? t.errorEmptyQuery : t.errorFetchFailed}
                </p>
              )}
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              role="region"
              aria-labelledby="maps-results-heading"
              className="rounded-3xl bg-bg-secondary border border-ink/5 flex flex-col lg:h-full lg:min-h-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-ink/5 shrink-0">
                <h3 id="maps-results-heading" className="flex items-center gap-2 text-lg font-bold text-ink">
                  {t.resultsHeading}
                  <span className="px-2 py-0.5 rounded-full bg-ink/10 text-secondary-text text-xs font-mono">{results.length}</span>
                </h3>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <BuyMeACoffee
                    variant="pill"
                    hideLabelOnMobile
                    label={t.buyMeCoffee}
                    modalHeading={t.upiModalHeading}
                    modalBody={t.upiModalBody}
                    closeLabel={t.closeAriaLabel}
                  />
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      type="button"
                      onClick={() => setExportMenuOpen((open) => !open)}
                      disabled={!results.length}
                      aria-haspopup="menu"
                      aria-expanded={exportMenuOpen}
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-ink/5 text-ink text-sm font-bold hover:bg-ink/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
                    >
                      <Download size={16} aria-hidden="true" />
                      <span className="hidden sm:inline">{t.exportButton}</span>
                      <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {exportMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-bg-secondary border border-ink/10 shadow-xl overflow-hidden z-10"
                      >
                        {(
                          [
                            { format: 'csv' as const, label: t.exportCsv },
                            { format: 'excel' as const, label: t.exportExcel },
                            { format: 'json' as const, label: t.exportJson },
                          ]
                        ).map((opt) => (
                          <button
                            key={opt.format}
                            type="button"
                            role="menuitem"
                            onClick={() => handleExport(opt.format)}
                            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-ink/10 transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visually hidden — the visual progress bar + streamed rows have no other accessible equivalent. */}
              <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {statusText}
              </div>

              {running && (
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={targetCount}
                  aria-valuenow={results.length}
                  aria-label={t.progressAriaLabel}
                  className="h-1 bg-ink/5 overflow-hidden shrink-0"
                >
                  <motion.div
                    className="h-full w-full bg-accent-blue"
                    style={{ transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: targetCount ? results.length / targetCount : 0 }}
                    transition={{ ease: 'linear' }}
                  />
                </div>
              )}

              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto p-3" aria-busy={running}>
                {results.length === 0 && !running && (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-secondary-text text-sm gap-3 p-8">
                    <MapPin size={28} className="text-secondary-text/50" aria-hidden="true" />
                    {t.emptyState}
                  </div>
                )}

                {(results.length > 0 || running) && (
                  <ul className="space-y-2">
                    <AnimatePresence initial={false}>
                      {results.map((row) => (
                        <motion.li
                          key={row.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-ink/5 hover:bg-ink/10 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-ink truncate min-w-0 flex-1" title={row.name}>
                              {row.name}
                            </h4>
                            <span className="shrink-0 inline-flex items-center gap-1 text-sm text-ink font-medium">
                              {row.rating.toFixed(1)}
                              <Star size={12} className="text-accent-blue fill-accent-blue" aria-hidden="true" />
                            </span>
                          </div>
                          <p className="text-xs text-secondary-text mt-1 truncate" title={`${row.address} · ${row.phone}`}>
                            {row.address} · {row.phone}
                          </p>
                          <div className="flex items-center justify-between gap-3 mt-2">
                            <a
                              href={`https://${row.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={row.website}
                              className="text-xs text-accent-blue hover:text-ink transition-colors truncate min-w-0 flex-1"
                            >
                              {row.website}
                            </a>
                            <span className="text-xs text-secondary-text shrink-0 max-w-[45%] truncate" title={row.hours}>
                              {row.hours}
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>

                    {running && (
                      <li className="p-4 rounded-2xl bg-ink/5 animate-pulse" aria-hidden="true">
                        <div className="h-4 w-1/3 bg-ink/10 rounded mb-2" />
                        <div className="h-3 w-2/3 bg-ink/10 rounded" />
                      </li>
                    )}
                  </ul>
                )}
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

      <section className="max-w-4xl mx-auto px-6 py-10 sm:py-16 space-y-10 sm:space-y-14">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4 text-center sm:text-left">{t.howItWorksTitle}</h2>
          <div className="grid sm:grid-cols-[280px_1fr] gap-6 sm:gap-8 items-start">
            <img
              src="/screenshots/google-maps-business-finder.png"
              alt={t.screenshotAlt}
              width={340}
              height={512}
              loading="lazy"
              className="w-full max-w-[280px] mx-auto sm:mx-0 rounded-2xl border border-ink/10"
            />
            <ol className="space-y-2 text-secondary-text list-decimal list-inside">
              {t.howItWorksSteps.map((step) => (
                <li key={step}>{fillPlaceholders(step, placeholderVars)}</li>
              ))}
            </ol>
          </div>
        </div>

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
              {t.limitations.map((limitation) => (
                <li key={limitation}>{fillPlaceholders(limitation, placeholderVars)}</li>
              ))}
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
        {premiumModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setPremiumModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="premium-modal-heading"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-bg-secondary border border-ink/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="premium-modal-heading" className="text-lg font-bold text-ink flex items-center gap-2">
                  <Crown size={18} className="text-accent-blue" aria-hidden="true" />
                  {t.premiumModalHeading}
                </h3>
                <button
                  type="button"
                  onClick={() => setPremiumModalOpen(false)}
                  aria-label={t.closeAriaLabel}
                  className="p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-secondary-text mb-4">{t.premiumModalBody}</p>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Google Maps Scraper — Premium access')}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
              >
                <Mail size={16} aria-hidden="true" />
                {t.contactUsButton}
              </a>
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
