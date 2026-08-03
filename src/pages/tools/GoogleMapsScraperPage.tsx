import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Coffee, Copy, Crown, Download, Info, Loader2, Mail, MapPin, Star, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { AdSlot } from '../../components/ads/AdSlot';
import { Select } from '../../components/ui/Select';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMapsScraper, MAX_RESULTS_PER_SEARCH, MAX_SEARCHES_PER_SESSION } from '../../tools/googleMapsScraper/useMapsScraper';
import { isLiveMode } from '../../tools/googleMapsScraper/dataSource';
import { toCsv, downloadCsv, toJson, downloadJson, toExcel, downloadExcel } from '../../lib/csv';

const RESULT_COUNT_OPTIONS = [
  ...[5, 10, 15].map((n) => ({ value: String(n), label: `${n} results` })),
  { value: 'more', label: 'More (Premium)' },
];

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
  const { lang } = useLanguage();
  const backHref = lang === 'hi' ? '/hi/free-tools' : '/free-tools';
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
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'upi' | 'number' | null>(null);

  const UPI_ID = 'marpit697.ad@ybl';
  const UPI_NUMBER = '7071520965';
  const UPI_PAYEE_NAME = 'Arpit Dwivedi';
  const UPI_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&cu=INR`;

  const handleCopy = (field: 'upi' | 'number', value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
  };

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
    ? `Searching — ${results.length} of ${targetCount} results loaded`
    : results.length > 0
      ? `${results.length} result${results.length === 1 ? '' : 's'} loaded`
      : '';

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-28 pb-16 lg:pb-6 lg:h-dvh">
        <div className="max-w-7xl mx-auto px-6 w-full lg:h-full lg:flex lg:flex-col lg:min-h-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 lg:shrink-0">
            {/* <Link
              to={backHref}
              className="inline-flex items-center gap-2 text-secondary-text hover:text-ink transition-colors group mb-4 text-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Free Tools
            </Link> */}

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {/* <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-1 block">Free Tool</span> */}
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Google Maps <span className="text-gradient">Business Finder</span>
                </h2>
              </div>
              <p className="text-secondary-text max-w-md text-sm">
                Find businesses on Google Maps and pull their name, address, phone, website, rating, and hours — into a table you can export.
              </p>
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
                  Search
                </label>
                <input
                  id="maps-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. coffee shops"
                  disabled={running || stopping || sessionLimitReached}
                  aria-describedby="session-status"
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maps-location" className="text-xs font-mono text-secondary-text uppercase tracking-widest">
                  Location <span className="normal-case text-secondary-text/70">(optional)</span>
                </label>
                <input
                  id="maps-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  disabled={running || stopping || sessionLimitReached}
                  aria-describedby="session-status"
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure transition-colors disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maps-count" className="text-xs font-mono text-secondary-text uppercase tracking-widest">
                  Results
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
                  options={RESULT_COUNT_OPTIONS}
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
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={stopping || sessionLimitReached}
                  aria-describedby="session-status"
                  className="w-full py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
                >
                  Run search
                </button>
              )}

              <p id="session-status" role="status" aria-live="polite" className="text-xs font-mono text-secondary-text text-center">
                {searchesUsed}/{MAX_SEARCHES_PER_SESSION} searches used this session
                {sessionLimitReached && ' — refresh to reset'}
              </p>

              {error && (
                <p role="alert" className="text-red-400 light:text-red-600 text-sm">
                  {error}
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
                  Results
                  <span className="px-2 py-0.5 rounded-full bg-ink/10 text-secondary-text text-xs font-mono">{results.length}</span>
                </h3>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setUpiModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#FFDD00]/10 text-[#FFDD00] text-sm font-bold hover:bg-[#FFDD00]/20 transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
                  >
                    <Coffee size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Buy me a coffee</span>
                  </button>
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
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {exportMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-bg-secondary border border-ink/10 shadow-xl overflow-hidden z-10"
                      >
                        {(
                          [
                            { format: 'csv' as const, label: 'CSV (.csv)' },
                            { format: 'excel' as const, label: 'Excel (.xls)' },
                            { format: 'json' as const, label: 'JSON (.json)' },
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
                  aria-label="Search progress"
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
                    Nothing yet — run a search to see results here.
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

      <div className="max-w-7xl mx-auto px-6">
        <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_SCRAPER} className="my-10" />
      </div>

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
              aria-labelledby="upi-modal-heading"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-bg-secondary border border-ink/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="upi-modal-heading" className="text-lg font-bold text-ink flex items-center gap-2">
                  <Coffee size={18} className="text-[#FFDD00]" aria-hidden="true" />
                  Buy me a coffee
                </h3>
                <button
                  type="button"
                  onClick={() => setUpiModalOpen(false)}
                  aria-label="Close"
                  className="p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-secondary-text mb-4">
                Scan the QR or use the UPI details below. Thank you for the support!
              </p>

              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-white">
                  <QRCodeSVG value={UPI_LINK} size={180} bgColor="#ffffff" fgColor="#000000" level="M" includeMargin={false} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/5">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-secondary-text">UPI ID</p>
                    <p className="text-sm font-bold text-ink truncate">{UPI_ID}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('upi', UPI_ID)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-all"
                  >
                    {copiedField === 'upi' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copiedField === 'upi' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/5">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-secondary-text">UPI Number</p>
                    <p className="text-sm font-bold text-ink truncate">{UPI_NUMBER}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('number', UPI_NUMBER)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-all"
                  >
                    {copiedField === 'number' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copiedField === 'number' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  Go Premium
                </h3>
                <button
                  type="button"
                  onClick={() => setPremiumModalOpen(false)}
                  aria-label="Close"
                  className="p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-secondary-text mb-4">
                Need more than 15 results per search? That's available on our premium plan — reach out and we'll set you up.
              </p>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Google Maps Scraper — Premium access')}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
              >
                <Mail size={16} aria-hidden="true" />
                Contact us
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
