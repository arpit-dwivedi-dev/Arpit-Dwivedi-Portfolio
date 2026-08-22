import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { ProjectIndexBand, type ProjectRowLabels } from '../components/projects/ProjectRow';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { Reveal } from '../components/ui/Reveal';
import { SectionRule } from '../components/ui/SectionRule';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * The projects index.
 *
 * What this replaced: a hero-ish header block above two three-up grids of
 * rounded cards — the treatment the rest of the site dropped during the
 * modernization. It opens like every other page now (a labelled rule, a
 * left-aligned display headline) and lists the work as a ledger. See
 * components/projects/ProjectRow.tsx for why rows rather than cards.
 *
 * The delivered/concept split is the whole reason this page is shaped the way
 * it is, and it is a CONTENT rule, not a styling preference — see
 * positioning.md and the founder's explicit instruction that unpaid,
 * never-adopted demo work gets its own clearly-labeled bucket. Three separate
 * things enforce it here rather than one heading:
 *
 *   1. The header states the two counts as data, with the site's live/pending
 *      indicator pair — filled cyan dot for delivered, hollow ring for concept
 *      — which is the same distinction NowNext draws between shipped and not.
 *   2. Delivered work rides the lit `.surface` slab; concept work sits on the
 *      bare page ground, so they are two bands at a glance, not one list with
 *      a subheading somewhere in the middle.
 *   3. The concept band opens with the disclosure, in violet, ABOVE the rows —
 *      not underneath them where a scanner would meet the work first.
 *
 * A visitor who reads nothing but the dots still cannot come away thinking
 * there are two clients.
 */
export const ProjectsPage = () => {
  const { content } = useLanguage();
  const { projects, projectsSection: t } = content;

  const deliveredProjects = projects.filter((project) => project.status !== 'demo');
  const demoProjects = projects.filter((project) => project.status === 'demo');

  const labels: ProjectRowLabels = {
    buildNoteLabel: t.buildNoteLabel,
    statusLabel: t.statusLabel,
    openLive: t.openLive,
    openDemo: t.openDemo,
    openRepo: t.openRepo,
    demoTag: t.demoTag,
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content">
        <section className="page-light relative pt-[72px]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-12">
            <Breadcrumbs
              className="mb-6 sm:mb-7"
              items={[{ name: content.nav.breadcrumbHome, href: '/' }, { name: t.breadcrumb }]}
            />

            <SectionRule label={t.label} />

            <Reveal className="pt-6 sm:pt-7">
              <h1 className="t-dxl text-ink max-w-[11ch]">
                {t.pageTitle} <span className="text-gradient">{t.pageTitleAccent}</span>
              </h1>
              <p className="pt-5 text-secondary-text leading-relaxed max-w-[52ch]">{t.pageDescription}</p>
            </Reveal>

            {/* The counts, stated once as data. This is the honest headline of
                the page — one delivered project and one that was never adopted
                — so it is not left to be inferred from two section headings
                the reader meets several screens apart. */}
            <Reveal from="none" className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-9 gap-y-3">
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_2px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
                />
                <span className="t-label text-accent-blue">
                  {t.deliveredCount.replace('{count}', String(deliveredProjects.length))}
                </span>
              </span>
              <span className="flex items-center gap-2.5">
                {/* Hollow, unfilled, unlit — the visual opposite of the dot
                    above rather than the same shape in another colour. */}
                <span aria-hidden="true" className="w-2 h-2 rounded-full border border-secondary-text/70" />
                <span className="t-label text-secondary-text">
                  {t.demoCount.replace('{count}', String(demoProjects.length))}
                </span>
              </span>
            </Reveal>
          </div>
        </section>

        {deliveredProjects.length > 0 && (
          <>
            <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-6 sm:pb-7">
              <SectionRule
                label={t.deliveredHeading}
                trailing={
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
                    />
                    <span className="t-label text-[0.5625rem] text-accent-blue">{t.deliveredStatus}</span>
                  </span>
                }
              />
            </div>
            <ProjectIndexBand projects={deliveredProjects} labels={labels} ground="surface" />
          </>
        )}

        {demoProjects.length > 0 && (
          <>
            <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-7">
              <SectionRule
                label={t.demoHeading}
                trailing={
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full border border-secondary-text/70" />
                    <span className="t-label text-[0.5625rem] text-secondary-text">{t.demoStatus}</span>
                  </span>
                }
              />

              {/* The disclosure sits ABOVE the rows on purpose. Underneath, it
                  is a footnote to work the reader has already taken as a
                  portfolio entry. */}
              <Reveal className="pt-6 pl-3.5 border-l border-accent-purple-text/45">
                <p className="text-[0.8125rem] text-secondary-text leading-relaxed max-w-[74ch]">
                  <span className="t-label text-[0.5625rem] text-accent-purple-text mr-2">{t.demoNoticeLabel}</span>
                  {t.demoIntro}
                </p>
              </Reveal>
            </div>
            <ProjectIndexBand projects={demoProjects} labels={labels} prefix="C" ground="page" />
          </>
        )}

        {/* Phase 7 internal-linking fix: no forward path existed from proof to
            services — a dead end in the free tools -> proof -> services ->
            contact priority path. */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-24">
          <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-7">
            <div>
              <p className="t-label text-secondary-text pb-4">{t.ctaLabel}</p>
              <p className="t-ds text-ink max-w-[24ch]">{t.ctaText}</p>
            </div>
            <Link
              to="/services"
              className="group shrink-0 inline-flex items-center justify-center gap-2.5 h-13 px-7 bg-ink text-bg-pure font-semibold rounded-[3px] hover:bg-accent-blue transition-colors"
            >
              {t.ctaButton}
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};
