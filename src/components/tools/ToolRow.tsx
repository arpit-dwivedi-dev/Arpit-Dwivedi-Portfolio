import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '../ui/Reveal';
import { STAGES } from './toolStages';
import { type ToolDefinition, getToolCategory, toolTitle, toolLead, toolNote } from '../../tools/registry';

export interface ToolRowProps {
  tool: ToolDefinition;
  /** Position in the visible list, already zero-padded ("01"). */
  number: string;
  /** The tool's category title, rendered as the row's one tag. */
  categoryLabel: string;
  /** False on a category page, where every row would otherwise repeat the
   *  page's own h1 back at the reader. */
  showCategory?: boolean;
  href: string;
  /** Label ahead of the build note — content.toolsPage.buildNoteLabel. */
  noteLabel: string;
  /** content.toolsPage.openLabel. */
  openLabel: string;
  /** Stagger position within the band. */
  index?: number;
  /** The band's own border draws the first row's top edge; without this the
   *  two hairlines stack and read as a thicker, brighter rule than the ones
   *  between the rows below it. */
  first?: boolean;
}

/**
 * One bay of the tools index.
 *
 * This replaces ToolCard, which was a rounded card in a four-up grid: an icon,
 * a blurb and an arrow. The card grid was the wrong shape for this page twice
 * over — it said nothing about the tools being real working software (the one
 * claim the page exists to make), and a four-up grid of equal-height cards
 * stops working the moment there are more than about eight of them.
 *
 * A row instead: the tool's name at display size, a short lead, the build note
 * from the registry (the "make the thinking visible" line that until now was
 * stored and never rendered anywhere), and the tool's own output fragment on
 * the right. Rows keep their shape at twenty tools; bays do not.
 */
export const ToolRow = ({
  tool,
  number,
  categoryLabel,
  showCategory = true,
  href,
  noteLabel,
  openLabel,
  index = 0,
  first = false,
}: ToolRowProps) => {
  const Stage = STAGES[tool.id];
  const note = toolNote(tool);

  return (
    <Reveal as="li" index={index} className={first ? undefined : 'border-t border-hairline'}>
      {/* Explicit row/column placement above lg rather than nesting, so ONE
          DOM order gives both layouts. Reading order is name -> lead -> note
          -> stage -> "Open", which is the order that makes sense on a phone
          (see the preview, then take the action); above lg the stage moves
          into its own column and spans both rows, which is what puts every
          stage's top edge on the same line as its tool name. */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid lg:grid-cols-[2.5rem_minmax(0,1fr)_16.25rem] lg:grid-rows-[1fr_auto] gap-y-4 lg:gap-x-8 items-start px-5 sm:px-6 py-7 sm:py-8 hover:bg-ink/[0.02] transition-colors"
      >
        <span className="hidden lg:block lg:col-start-1 lg:row-start-1 font-mono text-[0.6875rem] tracking-wider text-secondary-text pt-2">
          {number}
        </span>

        <div className="lg:col-start-2 lg:row-start-1 flex flex-col min-w-0">
          <div className="flex items-baseline gap-2.5 pb-2.5">
            {/* Below lg the number sits beside the name instead of in a column
                of its own — a 40px gutter is a lot of a 390px screen to spend
                on two digits. */}
            <span className="lg:hidden font-mono text-[0.6875rem] tracking-wider text-secondary-text">{number}</span>
            <h2 className="t-ds text-ink group-hover:text-accent-blue transition-colors">{toolTitle(tool)}</h2>
          </div>

          <p className="text-sm text-secondary-text leading-relaxed max-w-[58ch]">{toolLead(tool)}</p>

          {note && (
            <p className="pt-3 text-[0.8125rem] text-secondary-text leading-relaxed max-w-[62ch]">
              {/* Violet, not cyan: cyan is reserved site-wide for things that
                  are actually running, and a build note is a remark. */}
              <span className="t-label text-[0.5625rem] text-accent-purple-text mr-2">{noteLabel}</span>
              {note}
            </p>
          )}
        </div>

        {Stage && (
          <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 w-full min-h-[152px] flex items-center justify-center rounded-[3px] bg-bg-pure border border-hairline border-t-lit p-3.5">
            <Stage />
          </div>
        )}

        <div className="lg:col-start-2 lg:row-start-2 flex items-center gap-4 lg:pt-5">
          {showCategory && (
            <span className="t-label text-[0.5625rem] text-secondary-text border border-hairline rounded-[2px] px-1.5 py-1">
              {categoryLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink group-hover:text-accent-blue transition-colors">
            {openLabel}
            <ArrowUpRight
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              aria-hidden="true"
            />
          </span>
        </div>
      </a>
    </Reveal>
  );
};

interface ToolIndexBandProps {
  tools: ToolDefinition[];
  /** Route prefix the rows link under, e.g. "/tools". */
  basePath: string;
  noteLabel: string;
  openLabel: string;
  /** Passed through to every row — see ToolRowProps.showCategory. */
  showCategory?: boolean;
}

/**
 * The band the rows sit in — one continuous surface, full-bleed, with the
 * hairlines only ever BETWEEN rows (each row draws its own top edge except the
 * first; the band's border draws the outer ones).
 *
 * Shared by ToolsPage and ToolCategoryPage so the two listings cannot drift.
 */
export const ToolIndexBand = ({ tools, basePath, noteLabel, openLabel, showCategory = true }: ToolIndexBandProps) => (
  <Reveal from="none" className="surface border-x-0 rounded-none">
    <ul className="max-w-7xl mx-auto">
      {tools.map((tool, idx) => (
        <ToolRow
          key={tool.id}
          tool={tool}
          index={idx}
          first={idx === 0}
          number={String(idx + 1).padStart(2, '0')}
          categoryLabel={getToolCategory(tool.category)?.title ?? tool.category}
          showCategory={showCategory}
          href={`${basePath}/${tool.category}/${tool.path}`}
          noteLabel={noteLabel}
          openLabel={openLabel}
        />
      ))}
    </ul>
  </Reveal>
);
