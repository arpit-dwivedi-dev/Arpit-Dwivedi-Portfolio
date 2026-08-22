import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { GuideCategoryWithCount } from '../../content/guides/categories';
import { Reveal } from '../ui/Reveal';

interface GuideTopicSlabProps {
  categories: GuideCategoryWithCount[];
  ariaLabel: string;
  /** guidesIndexContent.guideCount / guideCountOne, both carrying `{count}`. */
  countLabel: string;
  countLabelOne: string;
  /** guidesIndexContent.browseCategoryLabel, carrying `{category}`. */
  browseLabel: string;
  /** The one topic whose status dot is filled and lit. Everything else gets a
   *  hollow ring — see the comment on the dot below. */
  highlightSlug?: string;
}

/**
 * The topics slab — real, crawlable links into each /guides/{category} landing
 * page, one bay per topic on a single full-bleed surface.
 *
 * This replaces GuideCategoryNav, a centered row of rounded pills. Pills gave
 * every topic the same two words and a count, which is the least a link into a
 * 40-guide landing page could say; a bay has room for the category's own
 * description, which was already written and stored (see GUIDE_CATEGORIES) and
 * until now only ever surfaced as a `title` tooltip.
 *
 * Same vocabulary as the home page's NowNext slab: equal-weight bays divided by
 * hairlines, and all of the difference between them carried by the status dot.
 */
const COLUMNS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

/**
 * Hairlines BETWEEN bays only — never on the slab's outer edges, which the
 * band's own border already draws. Written per index rather than as nth-child
 * variants for the same reason the tool rack's are (see FreeToolsShowcase):
 * the divider that belongs on a bay changes with the column count.
 */
const bayDividers = (i: number) => [i > 0 ? 'border-t border-hairline' : '', 'md:border-t-0', i > 0 ? 'md:border-l md:border-hairline' : ''].filter(Boolean).join(' ');

export const GuideTopicSlab = ({
  categories,
  ariaLabel,
  countLabel,
  countLabelOne,
  browseLabel,
  highlightSlug,
}: GuideTopicSlabProps) => (
  <Reveal from="none" className="surface border-x-0 rounded-none">
    <nav aria-label={ariaLabel} className={`max-w-7xl mx-auto grid grid-cols-1 ${COLUMNS[categories.length] ?? 'md:grid-cols-3'}`}>
      {categories.map((category, idx) => {
        const lit = category.slug === highlightSlug;
        const label = (category.count === 1 ? countLabelOne : countLabel).replace('{count}', String(category.count));
        return (
          <Link
            key={category.slug}
            to={`/guides/${category.slug}`}
            className={`group flex flex-col px-5 sm:px-6 py-8 md:py-10 hover:bg-ink/[0.02] transition-colors ${bayDividers(idx)}`}
          >
            <span className={`t-label flex items-center gap-2.5 pb-5 ${lit ? 'text-accent-blue' : 'text-secondary-text'}`}>
              {lit ? (
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_2px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
                />
              ) : (
                /* Hollow, unfilled, unlit — the visual opposite of the dot
                   above rather than the same shape in another colour. */
                <span aria-hidden="true" className="w-2 h-2 rounded-full border border-secondary-text/70" />
              )}
              {label}
            </span>

            <h2 className="t-ds text-ink pb-4 group-hover:text-accent-blue transition-colors">{category.title}</h2>

            <p className="text-secondary-text leading-relaxed max-w-[34ch] text-[0.9375rem]">{category.description}</p>

            <span className="mt-7 md:mt-auto md:pt-9 inline-flex items-center gap-2 h-11 text-sm font-semibold text-ink border-b border-accent-blue/40 self-start group-hover:border-accent-blue group-hover:text-accent-blue transition-colors">
              {browseLabel.replace('{category}', category.title)}
              <ArrowRight size={15} aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </nav>
  </Reveal>
);
