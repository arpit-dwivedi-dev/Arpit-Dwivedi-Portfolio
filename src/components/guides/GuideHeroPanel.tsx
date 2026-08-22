import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Guide } from '../../content/guides/types';
import { guideCategoryTitle, guidePath } from '../../content/guides/categories';
import { guideDetailContent } from '../../content/guides/pageContent';

interface GuideHeroPanelProps {
  guide: Guide;
  readTimeSuffix: string;
  /** guidesIndexContent.heroPanelTocLabel. */
  tocLabel: string;
  /** guidesIndexContent.heroPanelToolLabel. */
  toolLabel: string;
}

/**
 * The hero artifact: one real guide, shown as the shape of a guide.
 *
 * The home hero's right-hand column is the interactive terminal — the site's
 * one "this is real working software, not a screenshot" move. This is the
 * guides page's equivalent claim, so it plays the same role in the same
 * position: rather than describing what the guides are like, it shows one, and
 * ends where every guide ends — in the tool the guide is about.
 *
 * Every value here is read off the Guide record (path, category, title, read
 * time, its section headings, its own CTA), so the panel cannot drift from the
 * article it previews. Nothing is hardcoded but the chrome.
 */
export const GuideHeroPanel = ({ guide, readTimeSuffix, tocLabel, toolLabel }: GuideHeroPanelProps) => (
  <div className="flex flex-col">
    <Link
      to={guidePath(guide)}
      className="group surface-raised rounded-[3px] overflow-hidden hover:border-accent-blue/30 transition-colors"
    >
      <div className="flex items-center gap-3 h-10 px-4 border-b border-hairline bg-ink/[0.03]">
        <span className="font-mono text-[0.6875rem] text-secondary-text truncate min-w-0">{guidePath(guide)}</span>
        <span className="font-mono text-[0.6875rem] text-secondary-text shrink-0 ml-auto">
          {guide.readTimeMinutes} {readTimeSuffix}
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        <div>
          <span className="t-label text-[0.5625rem] text-accent-blue block pb-2">
            {guideCategoryTitle(guide.category)}
          </span>
          <span className="t-dm text-[1.1875rem] text-ink block group-hover:text-accent-blue transition-colors">
            {guide.title}
          </span>
        </div>

        {/* The guide's real section headings. A guide's own outline is the most
            honest possible answer to "what's in these" — and it is the thing a
            card excerpt could never show. */}
        <div className="flex flex-col gap-2.5 pt-1">
          <span className="t-label text-[0.5625rem] text-secondary-text">{tocLabel}</span>
          <ul className="flex flex-col gap-2">
            {guide.sections.slice(0, 4).map((section, idx) => (
              <li key={section.heading} className="flex items-baseline gap-2.5 min-w-0">
                <span className="font-mono text-[0.625rem] text-secondary-text shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-[0.8125rem] text-secondary-text leading-snug truncate">{section.heading}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Where the guide lands. Violet, not cyan: cyan is reserved site-wide
            for things that are actually running, and this is a destination. */}
        <div className="flex items-center gap-3 rounded-[3px] bg-bg-pure border border-hairline border-t-lit px-3.5 py-3">
          <span className="t-label text-[0.5625rem] text-accent-purple-text shrink-0">
            {toolLabel}
          </span>
          <span className="text-[0.8125rem] text-ink truncate min-w-0">
            {guide.ctaToolLabel ?? guideDetailContent.ctaButton}
          </span>
          <ArrowUpRight
            size={14}
            className="ml-auto shrink-0 text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  </div>
);
