import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Info, Loader2, MapPin, Star } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/AchievementsContact';
import { AdSlot } from '../../components/ads/AdSlot';
import { Select } from '../../components/ui/Select';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMapsScraper, MAX_RESULTS_PER_SEARCH, MAX_SEARCHES_PER_SESSION } from '../../tools/googleMapsScraper/useMapsScraper';
import { toCsv, downloadCsv } from '../../lib/csv';

const RESULT_COUNT_OPTIONS = [5, 10, 20].map((n) => ({ value: String(n), label: `${n} results` }));

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
    error,
    run,
    cancel,
    searchesUsed,
    remainingSearches,
    sessionLimitReached,
    targetCount,
  } = useMapsScraper();

  const [query, setQuery] = useState('');
  const [count, setCount] = useState('10');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(query, Number(count));
  };

  const handleExport = () => {
    if (!results.length) return;
    downloadCsv(`google-maps-results-${Date.now()}.csv`, toCsv(results, CSV_COLUMNS));
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
            <Link
              to={backHref}
              className="inline-flex items-center gap-2 text-secondary-text hover:text-ink transition-colors group mb-4 text-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Free Tools
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-1 block">Free Tool</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Google Maps <span className="text-gradient">Scraper</span>
                </h2>
              </div>
              <p className="text-secondary-text max-w-md text-sm">
                Name, address, phone, website, rating, and hours off a Google Maps search — into a table you can export.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-6 lg:shrink-0"
          >
            <Info size={16} className="text-accent-blue shrink-0" aria-hidden="true" />
            <p className="text-xs md:text-sm text-secondary-text leading-relaxed">
              <strong className="text-ink">Demo mode</strong> — sample data below, not live Google Maps results. Once a backend is
              connected, real requests stay low-volume: throttled, capped at {MAX_RESULTS_PER_SEARCH} rows/search and{' '}
              {MAX_SEARCHES_PER_SESSION} searches/session.
            </p>
          </motion.div>

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
                  placeholder="e.g. coffee shops in Austin, TX"
                  disabled={running || sessionLimitReached}
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
                  onChange={setCount}
                  options={RESULT_COUNT_OPTIONS}
                  disabled={running || sessionLimitReached}
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
                  disabled={sessionLimitReached}
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
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-ink/5 shrink-0">
                <h3 id="maps-results-heading" className="flex items-center gap-2 text-lg font-bold text-ink">
                  Results
                  <span className="px-2 py-0.5 rounded-full bg-ink/10 text-secondary-text text-xs font-mono">{results.length}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!results.length}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-ink/5 text-ink text-sm font-bold hover:bg-ink/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-pure"
                >
                  <Download size={16} aria-hidden="true" />
                  Export CSV
                </button>
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

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
