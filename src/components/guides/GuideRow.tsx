import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import type { Guide } from '../../content/guides/types';
import { guideCategoryTitle, guidePath } from '../../content/guides/categories';
import { Reveal } from '../ui/Reveal';

interface GuideRowProps {
  guide: Guide;
  /** Position in the visible list, already zero-padded ("01"). */
  number: string;
  /** False on a category page, where every row would otherwise repeat the
   *  page's own h1 back at the reader. */
  showCategory?: boolean;
  readTimeSuffix: string;
  /** guidesIndexContent.readLabel. */
  readLabel: string;
  /** Stagger position within the band. */
  index?: number;
  /** The band's own border draws the first row's top edge; without this the
   *  two hairlines stack and read as a thicker rule than the ones between the
   *  rows below it. */
  first?: boolean;
}

/**
 * One row of the guides index.
 *
 * This replaces GuideCard, which was a rounded card in a two-column grid. The
 * grid was the wrong shape for this page for the same reason ToolCard's was
 * (see components/tools/ToolRow.tsx): with 51 guides it produced 26 rows of
 * paired cards whose heights never matched, and it spent the widest thing on
 * the page — the title — on the narrowest column available.
 *
 * A row instead, in the same ledger vocabulary as the tools index: number,
 * title at t-ds, the one thing the guide answers, then the category tag and
 * the read time. Rows keep their shape at 51; cards stopped working around 8.
 */
export const GuideRow = ({
  guide,
  number,
  showCategory = true,
  readTimeSuffix,
  readLabel,
  index = 0,
  first = false,
}: GuideRowProps) => (
  <Reveal as="li" index={index} className={first ? undefined : 'border-t border-hairline'}>
    {/* Explicit row/column placement above lg rather than nesting, so ONE DOM
        order gives both layouts: below lg the read time drops under the title
        beside the category tag, above lg it moves into its own right-hand
        column so every row's read time sits on one line. */}
    <Link
      to={guidePath(guide)}
      className="group grid lg:grid-cols-[2.5rem_minmax(0,1fr)_11.875rem] gap-y-2.5 lg:gap-x-8 items-start px-5 sm:px-6 py-6 sm:py-7 hover:bg-ink/[0.02] transition-colors"
    >
      <span className="hidden lg:block lg:col-start-1 font-mono text-[0.6875rem] tracking-wider text-secondary-text pt-2">
        {number}
      </span>

      <div className="lg:col-start-2 flex flex-col min-w-0">
        {/* Below lg the number sits in a 1.625rem column beside the title
            rather than inline: a baseline flex row left lines 2-3 of a wrapped
            title hanging back underneath the number instead of indenting with
            line 1, so the number stopped reading as a column at all. */}
        <div className="grid grid-cols-[1.625rem_minmax(0,1fr)] lg:grid-cols-1 gap-x-2.5 pb-2.5">
          <span className="lg:hidden font-mono text-[0.6875rem] tracking-wider text-secondary-text pt-1.5">
            {number}
          </span>
          <h2 className="t-ds text-ink group-hover:text-accent-blue transition-colors">{guide.title}</h2>
        </div>

        <p className="text-sm text-secondary-text leading-relaxed max-w-[62ch]">{guide.description}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 pt-4">
          {showCategory && (
            <span className="t-label text-[0.5625rem] text-secondary-text border border-hairline rounded-[2px] px-1.5 py-1">
              {guideCategoryTitle(guide.category)}
            </span>
          )}
          <span className="lg:hidden inline-flex items-center gap-1.5 font-mono text-xs text-secondary-text">
            <Clock size={12} aria-hidden="true" />
            {guide.readTimeMinutes} {readTimeSuffix}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink group-hover:text-accent-blue transition-colors">
            {readLabel}
            <ArrowUpRight
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      <span className="hidden lg:inline-flex lg:col-start-3 items-center justify-end gap-2 font-mono text-xs text-secondary-text pt-1.5">
        <Clock size={13} aria-hidden="true" />
        {guide.readTimeMinutes} {readTimeSuffix}
      </span>
    </Link>
  </Reveal>
);

interface GuideIndexBandProps {
  guides: Guide[];
  readTimeSuffix: string;
  readLabel: string;
  /** Passed through to every row — see GuideRowProps.showCategory. */
  showCategory?: boolean;
}

/** How many rows take part in the arrival stagger — see the call site below. */
const STAGGER_LIMIT = 8;

/**
 * The band the rows sit in — one continuous surface, full-bleed, with the
 * hairlines only ever BETWEEN rows (each row draws its own top edge except the
 * first; the band's border draws the outer ones).
 *
 * Shared by GuidesPage and GuideCategoryPage so the two listings cannot drift.
 */
export const GuideIndexBand = ({ guides, readTimeSuffix, readLabel, showCategory = true }: GuideIndexBandProps) => (
  <Reveal from="none" className="surface border-x-0 rounded-none">
    <ul className="max-w-7xl mx-auto">
      {guides.map((guide, idx) => (
        <GuideRow
          key={guide.slug}
          guide={guide}
          /* Only the first screenful staggers. Reveal multiplies index by 60ms,
             so passing the real index would give row 51 a three-second delay
             AFTER it scrolls into view — the stagger exists to make one arrival
             read as a group, and rows reached by scrolling arrive on their own. */
          index={idx < STAGGER_LIMIT ? idx : 0}
          first={idx === 0}
          number={String(idx + 1).padStart(2, '0')}
          showCategory={showCategory}
          readTimeSuffix={readTimeSuffix}
          readLabel={readLabel}
        />
      ))}
    </ul>
  </Reveal>
);
