import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ToolIndexBand } from '../components/tools/ToolRow';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { Reveal } from '../components/ui/Reveal';
import { SectionRule } from '../components/ui/SectionRule';
import { useLanguage } from '../i18n/LanguageContext';
import {
  TOOLS,
  TOOL_CATEGORIES,
  getToolsByCategory,
  categoryTitle,
  categoryDescription,
  toolTitle,
  toolDescription,
  toolLead,
} from '../tools/registry';

/**
 * The tools index.
 *
 * What this replaced: a centered eyebrow pill above a centered gradient
 * headline above a four-up grid of rounded cards — the treatment the rest of
 * the site dropped during the modernization, still sitting on the one page
 * whose entire job is to make the tools look real.
 *
 * Now it opens like every other section on the site (a labelled rule, a
 * left-aligned display headline), states its three facts once instead of
 * repeating "no signup" in four card blurbs, and lists the tools as a ledger:
 * one full-bleed row each, carrying the tool's own output fragment and the
 * build note from the registry. See components/tools/ToolRow.tsx for why rows
 * rather than cards.
 *
 * Filtering is URL-backed on purpose. `?q=` already had to work — it backs the
 * WebSite SearchAction in index.html's JSON-LD, and that schema is only honest
 * if this page reads and applies it — and `?category=` follows the same rule so
 * a filtered view can be linked, shared and reached with the back button. The
 * category TABS filter in place rather than navigating, and the crawlable links
 * to the category pages live in the "browse by category" ledger at the foot of
 * the page, where they can carry a description and a count instead of being a
 * bare pill.
 */
export const ToolsPage = () => {
  const { content } = useLanguage();
  const t = content.toolsPage;
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = '/tools';
  const query = searchParams.get('q') ?? '';
  const activeCategory = searchParams.get('category') ?? '';

  // The field holds its own copy of the search text, and that copy — not the
  // URL param — is what the field renders and what the list filters on.
  //
  // Driving a controlled input straight off `searchParams` (which is what this
  // page used to do) loses characters: setSearchParams is a router navigation,
  // so between two fast keystrokes the input's value snaps back to the param
  // that has not updated yet. Typing "postman" landed "psmn" in the URL.
  const [draft, setDraft] = useState(query);
  // The last value this page itself put in the URL, so the sync effect below
  // can tell its own debounced write apart from a real outside change.
  const lastWritten = useRef(query);

  // The one writer for both params, so setting the search can never drop the
  // active category tab and picking a tab can never drop text the debounce
  // below has not flushed yet.
  const writeParams = useCallback(
    (q: string, category: string) => {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (category) params.category = category;
      lastWritten.current = q;
      // `replace` so a phrase typed one letter at a time does not turn into
      // nine entries in the back button's history.
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mirror the field into `?q=` on a short debounce.
  useEffect(() => {
    if (draft === query) return;
    const id = window.setTimeout(() => writeParams(draft, activeCategory), 220);
    return () => window.clearTimeout(id);
  }, [draft, query, activeCategory, writeParams]);

  // The URL moved on its own — a deep link, the back button, the JSON-LD
  // SearchAction landing on /tools?q=... — so adopt it.
  useEffect(() => {
    if (query === lastWritten.current) return;
    lastWritten.current = query;
    setDraft(query);
  }, [query]);

  const visible = useMemo(() => TOOLS.filter((tool) => !tool.hidden), []);

  // Categories are only worth their own listed/linked page once they hold a
  // tool — an empty category page is thin content, not a topical hub.
  const populatedCategories = useMemo(
    () => TOOL_CATEGORIES.filter((category) => getToolsByCategory(category.slug).length > 0),
    [],
  );

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return visible.filter((tool) => {
      if (activeCategory && tool.category !== activeCategory) return false;
      if (!q) return true;
      // The full description is matched as well as the short lead the row
      // renders, so a search for a word that only survives in the long form
      // ("Postman", "auto-layout") still finds its tool.
      return (
        toolTitle(tool).toLowerCase().includes(q) ||
        toolLead(tool).toLowerCase().includes(q) ||
        toolDescription(tool).toLowerCase().includes(q)
      );
    });
  }, [visible, draft, activeCategory]);

  const tabs = [
    { slug: '', label: t.allCategories, count: visible.length },
    ...populatedCategories.map((category) => ({
      slug: category.slug,
      label: categoryTitle(category),
      count: getToolsByCategory(category.slug).length,
    })),
  ];

  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content">
        <section className="page-light relative pt-[72px]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16">
            <Breadcrumbs
              className="mb-6 sm:mb-7"
              items={[{ name: content.nav.breadcrumbHome, href: '/' }, { name: t.breadcrumb }]}
            />

            <SectionRule
              label={t.ruleLabel}
              trailing={
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
                  />
                  <span className="t-label text-[0.5625rem] text-accent-blue">
                    {t.liveCount.replace('{count}', String(visible.length))}
                  </span>
                </span>
              }
            />

            <Reveal className="pt-6 sm:pt-7">
              <h1 className="t-dxl text-ink max-w-[16ch]">
                {t.titleStart}
                <br />
                {t.titleAccent}
              </h1>
              <p className="pt-5 text-secondary-text leading-relaxed max-w-[52ch]">{t.description}</p>
            </Reveal>

            {/* The three claims every tool here shares, stated once as a
                ledger band. They used to be repeated inside each card's blurb
                ("no signup, no server, your data stays on your device"), which
                is how the same sentence ended up on the page four times. */}
            <Reveal
              from="none"
              className="mt-9 sm:mt-11 grid grid-cols-1 sm:grid-cols-3 border-y border-hairline border-t-lit"
            >
              {t.facts.map((fact, idx) => (
                <div
                  key={fact.label}
                  className={`py-4 ${idx > 0 ? 'border-t sm:border-t-0 sm:border-l border-hairline sm:pl-6' : ''}`}
                >
                  <div className="t-label text-ink pb-1.5">{fact.label}</div>
                  <div className="text-[0.8125rem] text-secondary-text leading-relaxed">{fact.text}</div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-10 sm:pt-12">
          <Reveal from="none" className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="w-full md:w-80 md:shrink-0 flex items-center gap-2.5 h-11 px-3.5 rounded-[3px] bg-ink/[0.03] border border-hairline border-t-lit focus-within:border-accent-blue transition-colors"
            >
              <Search size={16} className="shrink-0 text-secondary-text" aria-hidden="true" />
              <label htmlFor="tools-search" className="sr-only">
                {t.searchAriaLabel}
              </label>
              <input
                id="tools-search"
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-sm text-ink placeholder:text-secondary-text focus:outline-none"
              />
              {draft && (
                <button
                  type="button"
                  aria-label={t.clearSearchAriaLabel}
                  onClick={() => setDraft('')}
                  className="-mr-2 shrink-0 w-8 h-11 flex items-center justify-center text-secondary-text hover:text-ink transition-colors"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </form>

            {/* Tabs, not pills: the active one carries a cyan rule under it.
                Each is 44px tall even though the label is 11px — the tap
                target is the whole height, not the text. */}
            {/* Wraps rather than scrolling: a horizontal scroller with no
                affordance just cuts the last tab off mid-word, and the list
                grows one entry per category that gains its first tool. */}
            <div role="group" aria-label={t.categoriesAriaLabel} className="flex flex-wrap items-end gap-x-6 gap-y-1">
              {tabs.map((tab) => {
                const active = tab.slug === activeCategory;
                return (
                  <button
                    key={tab.slug || 'all'}
                    type="button"
                    onClick={() => writeParams(draft, tab.slug)}
                    aria-pressed={active}
                    className="group/tab shrink-0 h-11 flex flex-col items-center justify-end gap-1.5"
                  >
                    <span className="inline-flex items-baseline gap-1.5">
                      <span
                        className={`t-label transition-colors ${active ? 'text-ink' : 'text-secondary-text group-hover/tab:text-ink'}`}
                      >
                        {tab.label}
                      </span>
                      <span className={`font-mono text-[0.625rem] ${active ? 'text-accent-blue' : 'text-secondary-text'}`}>
                        {tab.count}
                      </span>
                    </span>
                    <span aria-hidden="true" className={`h-px w-full ${active ? 'bg-accent-blue' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>
          </Reveal>

          <p className="pt-3.5 t-label tracking-[0.08em] text-secondary-text md:text-right" aria-live="polite">
            {t.resultCount.replace('{count}', String(filtered.length)).replace('{total}', String(visible.length))}
          </p>
        </div>

        <div className="pt-6 sm:pt-7">
          {filtered.length > 0 ? (
            <ToolIndexBand
              tools={filtered}
              basePath={basePath}
              noteLabel={t.buildNoteLabel}
              openLabel={t.openLabel}
            />
          ) : (
            /* A designed no-match state rather than one centered sentence: it
               names what IS here and gives the one action that gets you back
               to it, inside the same band the rows would have filled. */
            <Reveal from="none" className="surface border-x-0 rounded-none">
              <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 flex flex-col items-start gap-4">
                <span className="t-label text-secondary-text">{t.noResultsLabel}</span>
                <p className="t-ds text-ink max-w-[30ch]">{t.noToolsMatch.replace('{query}', draft)}</p>
                <p className="text-sm text-secondary-text leading-relaxed max-w-[56ch]">
                  {t.noToolsMatchBody.replace('{total}', String(visible.length))}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    writeParams('', '');
                  }}
                  className="mt-2 h-11 px-4 inline-flex items-center rounded-[3px] text-sm font-semibold text-bg-pure bg-ink hover:bg-accent-blue transition-colors"
                >
                  {t.clearSearch}
                </button>
              </div>
            </Reveal>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-24">
          <SectionRule label={t.categoriesHeading} />
          <ul className="pt-1">
            {populatedCategories.map((category, idx) => {
              const count = getToolsByCategory(category.slug).length;
              const countLabel = count === 1 ? t.categoryToolCountOne : t.categoryToolCount;
              return (
                <Reveal as="li" key={category.slug} index={idx} className="border-b border-hairline">
                  <Link
                    to={`${basePath}/${category.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-8 py-6"
                  >
                    <span className="flex flex-col gap-2">
                      <span className="t-dm text-ink group-hover:text-accent-blue transition-colors">
                        {categoryTitle(category)}
                      </span>
                      <span className="text-sm text-secondary-text leading-relaxed max-w-[64ch]">
                        {categoryDescription(category)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-3.5 shrink-0">
                      <span className="t-label tracking-[0.08em] text-secondary-text">
                        {countLabel.replace('{count}', String(count))}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 transition-all"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
};
