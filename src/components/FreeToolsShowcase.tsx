import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { TOOLS, toolTitle, toolDescription } from '../tools/registry';
import { Reveal } from './ui/Reveal';
import { SectionRule } from './ui/SectionRule';
import { STAGES } from './tools/toolStages';

/**
 * The Workbench — the site's signature section.
 *
 * This was four rounded cards in a 2x2 grid, each with an icon, a blurb and a
 * "why it's built this way" footnote. The differentiator this shop actually
 * has is that the free tools are real working software, and a card grid is the
 * one layout that communicates none of that.
 *
 * So the section is a single instrument rack instead: one continuous surface,
 * four bays divided by hairlines, and inside each bay a live fragment of the
 * tool itself. A bay with nothing concrete to show falls back to a plain one
 * (see the `stage` lookup), because the whole section works best when each
 * tool has a recognizable artifact instead of a generic illustration.
 *
 * This is also the only place on the site that spends cyan across a whole
 * band. Everywhere else it is reserved for focus and live state, which is
 * what makes it mean something here.
 */


/**
 * Hairlines BETWEEN bays only — never on the rack's outer edges, which the
 * band's own border already draws. Written out per index rather than as
 * nth-child variants because the divider that belongs on a bay changes with
 * the column count (1 / 2 / 4), and the responsive nth-child soup that
 * expresses that is unreadable and quietly wrong at one breakpoint.
 */
const bayDividers = (i: number) =>
  [
    'border-hairline',
    // 1 column: a rule above every bay but the first.
    i > 0 ? 'border-t' : '',
    // 2 columns: rule left of the right-hand bay, above the second row.
    'sm:border-t-0',
    i % 2 === 1 ? 'sm:border-l' : '',
    i >= 2 ? 'sm:border-t' : '',
    // 4 columns: one rule left of every bay but the first.
    'xl:border-t-0',
    i > 0 ? 'xl:border-l' : 'xl:border-l-0',
  ]
    .filter(Boolean)
    .join(' ');

export const FreeTools = () => {
  const { content } = useLanguage();
  const t = content.freeToolsSection;
  const visibleTools = TOOLS.filter((tool) => !tool.hidden);

  return (
    <section className="relative pt-24 sm:pt-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <SectionRule
          label="Four tools · free · no signup"
          trailing={
            <span className="hidden sm:flex items-center gap-2 whitespace-nowrap">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
              />
              <span className="t-label text-[0.5625rem] text-accent-blue">Running on this page</span>
            </span>
          }
        />
        <Reveal className="pt-6 pb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-16">
          <h2 className="t-dl text-ink max-w-[20ch]">
            {t.title} {t.titleAccent}
          </h2>
          <p className="text-secondary-text leading-relaxed max-w-[44ch] lg:pb-1.5">{t.description}</p>
        </Reveal>
      </div>

      <Reveal from="none" className="surface border-x-0 rounded-none">
        {/* auto-rows-fr so the two-column layout's rows are equal height too.
            Without it row 2 sized to its own content and sat 21px taller than
            row 1, which is correct grid behaviour but reads as the same
            mismatched-height problem the rack was built to fix. */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 auto-rows-fr">
          {visibleTools.map((tool, idx) => {
            const Stage = STAGES[tool.id];
            return (
              <Reveal key={tool.id} index={idx} className={`h-full ${bayDividers(idx)}`}>
                <a
                  href={`/tools/${tool.category}/${tool.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group h-full flex flex-col px-5 sm:px-6 py-8 hover:bg-ink/[0.02] transition-colors"
                >
                  {/* Reserves two lines whether the title needs them or not.
                      "DBML Diagram Builder" wraps at four columns while the
                      others do not, which pushed that bay's whole stack down
                      relative to its neighbours. */}
                  <div className="flex items-baseline gap-2.5 pb-2 xl:min-h-[3.05rem]">
                    <span className="font-mono text-[0.6875rem] text-secondary-text tracking-wider">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="t-dm text-[1.0625rem] text-ink group-hover:text-accent-blue transition-colors">
                      {toolTitle(tool)}
                    </h3>
                  </div>
                  {/* grow, so the slack from four differing description lengths
                      collects ABOVE the stage rather than below it. The stages
                      are the row's visual anchor: bays are equal height, and
                      the stage and link below it are fixed, so growing here is
                      what puts every stage's top edge on the same line. */}
                  <p className="grow text-[0.8125rem] text-secondary-text leading-relaxed pb-5">{toolDescription(tool)}</p>

                  {Stage && (
                    <div className="min-h-[180px] flex items-center justify-center rounded-[3px] bg-bg-pure border border-hairline border-t-lit p-3.5">
                      <Stage />
                    </div>
                  )}

                  <span className="pt-6 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink group-hover:text-accent-blue transition-colors">
                    Open
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </Reveal>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-10">
        <Reveal>
          <Link
            to="/tools"
            className="group inline-flex items-center gap-2 h-11 text-sm font-semibold text-ink border-b border-accent-blue/40 hover:border-accent-blue hover:text-accent-blue transition-colors"
          >
            {t.viewAll}
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};
