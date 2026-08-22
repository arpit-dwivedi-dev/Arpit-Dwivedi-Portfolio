import { ArrowUpRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import type { ReactNode } from 'react';
import { Reveal } from '../ui/Reveal';
import { PROJECT_STAGES } from './projectStages';
import type { Project } from '../../i18n/types';

/** The strings a row renders, lifted out of content.projectsSection. */
export interface ProjectRowLabels {
  buildNoteLabel: string;
  statusLabel: string;
  openLive: string;
  openDemo: string;
  openRepo: string;
  demoTag: string;
}

interface ProjectRowProps {
  project: Project;
  /** Position in the visible list, already prefixed ("01", "C1"). */
  number: string;
  labels: ProjectRowLabels;
  /** Stagger position within the band. */
  index?: number;
  /** The band's own border draws the first row's top edge; without this the
   *  two hairlines stack and read as a thicker rule than the ones between. */
  first?: boolean;
}

/**
 * One entry of the projects ledger.
 *
 * This replaces ProjectCard — a rounded-3xl card with a blurred glow behind it
 * and two icon buttons floating above the title, in a three-up grid. That was
 * the treatment the rest of the site dropped during the modernization, and it
 * was actively bad for this page in one specific way: a grid makes every cell
 * look like a peer, and the single hardest content rule here is that delivered
 * client work and unpaid never-adopted concept work must NOT read as peers.
 *
 * A row can carry that distinction in its own body — see the two callers in
 * ProjectsPage, which put delivered work on the lit `.surface` slab and concept
 * work on the bare page ground. Within a row it shows up as: no cyan anywhere
 * on a demo, a muted title, and the "never adopted" tag sitting immediately
 * after the title rather than in a corner badge a reader can skip.
 *
 * The grid is deliberately the same as ToolRow's (`2.5rem | 1fr | 16.25rem`),
 * so a project row and a tool row share a spine on a site where a visitor sees
 * both listings.
 */
export const ProjectRow = ({ project, number, labels, index = 0, first = false }: ProjectRowProps) => {
  const isDemo = project.status === 'demo';
  const Stage = project.stage ? PROJECT_STAGES[project.stage] : undefined;
  const repoHref = project.github ? `https://github.com/${project.github}` : undefined;
  const primaryHref = project.link ?? repoHref;
  const openLabel = project.link ? (isDemo ? labels.openDemo : labels.openLive) : labels.openRepo;

  // A demo's note is its real status, and it is the one line on the row that
  // must not read as a footnote — so it gets the "Status" label rather than
  // "Build note", and the tag above repeats it in three words.
  const noteLabel = isDemo ? labels.statusLabel : labels.buildNoteLabel;

  const body = (
    <>
      <span className="hidden lg:block lg:col-start-1 lg:row-start-1 font-mono text-[0.6875rem] tracking-wider text-secondary-text pt-2">
        {number}
      </span>

      <div className="lg:col-start-2 lg:row-start-1 flex flex-col min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-2 pb-2.5">
          <span className="lg:hidden font-mono text-[0.6875rem] tracking-wider text-secondary-text">{number}</span>
          <h3
            className={`t-ds transition-colors ${
              isDemo ? 'text-ink/80' : 'text-ink group-hover:text-accent-blue'
            }`}
          >
            {project.title}
          </h3>
          {isDemo && (
            <span className="t-label text-[0.5625rem] text-accent-purple-text border border-accent-purple-text/35 rounded-[2px] px-1.5 py-1">
              {labels.demoTag}
            </span>
          )}
        </div>

        {project.subtitle && (
          <p className="font-mono text-[0.6875rem] text-secondary-text pb-3">{project.subtitle}</p>
        )}

        <p className="text-sm text-secondary-text leading-relaxed max-w-[58ch]">{project.description}</p>

        {project.note && (
          <p className="pt-3 text-[0.8125rem] text-secondary-text leading-relaxed max-w-[62ch]">
            {/* Violet, not cyan: cyan is reserved site-wide for things that
                are actually running, and this line is a remark about one. */}
            <span className="t-label text-[0.5625rem] text-accent-purple-text mr-2">{noteLabel}</span>
            {project.note}
          </p>
        )}

        {project.metrics && project.metrics.length > 0 && (
          <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-5">
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <dd className="t-dm text-ink">{metric.value}</dd>
                <dt className="t-label text-[0.5625rem] text-secondary-text pt-1">{metric.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>

      {Stage && (
        <div
          className={`lg:col-start-3 lg:row-start-1 lg:row-span-2 w-full min-h-[152px] flex items-center justify-center rounded-[3px] border border-hairline border-t-lit p-3.5 ${
            // A demo row sits on the page ground, so its stage cannot also be
            // bg-pure — the panel would have no edge of its own to show.
            isDemo ? 'bg-bg-secondary' : 'bg-bg-pure'
          }`}
        >
          <Stage />
        </div>
      )}

      <div className="lg:col-start-2 lg:row-start-2 flex flex-wrap items-center gap-x-4 gap-y-3 lg:pt-5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="t-label text-[0.5625rem] text-secondary-text border border-hairline rounded-[2px] px-1.5 py-1"
          >
            {tag}
          </span>
        ))}

        <span className="grow" />

        {repoHref && project.link && (
          // Only a second link needs its own anchor; when the repo IS the
          // primary link the row's own anchor already points there.
          <a
            href={repoHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-secondary-text hover:text-accent-blue transition-colors"
          >
            <FaGithub size={14} aria-hidden="true" />
            {labels.openRepo}
          </a>
        )}

        {primaryHref && (
          <span
            className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold transition-colors ${
              isDemo ? 'text-secondary-text group-hover:text-ink' : 'text-ink group-hover:text-accent-blue'
            }`}
          >
            {openLabel}
            <ArrowUpRight
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              aria-hidden="true"
            />
          </span>
        )}
      </div>
    </>
  );

  const grid =
    'group grid lg:grid-cols-[2.5rem_minmax(0,1fr)_16.25rem] lg:grid-rows-[1fr_auto] gap-y-4 lg:gap-x-8 items-start px-5 sm:px-6 py-7 sm:py-8';

  return (
    <Reveal as="li" index={index} className={first ? undefined : 'border-t border-hairline'}>
      {primaryHref ? (
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${grid} hover:bg-ink/[0.02] transition-colors`}
        >
          {body}
        </a>
      ) : (
        <div className={grid}>{body}</div>
      )}
    </Reveal>
  );
};

interface ProjectIndexBandProps {
  projects: Project[];
  labels: ProjectRowLabels;
  /** Row number prefix — "01, 02…" for delivered, "C1, C2…" for concepts. */
  prefix?: string;
  /** Delivered work rides the lit surface slab; concept work sits on the bare
   *  page ground so the two never read as one list. */
  ground?: 'surface' | 'page';
  children?: ReactNode;
}

/**
 * The band the rows sit in — one continuous full-bleed slab, hairlines only
 * ever BETWEEN rows (each row draws its own top edge except the first; the
 * band's border draws the outer ones). Same construction as ToolIndexBand.
 */
export const ProjectIndexBand = ({ projects, labels, prefix = '', ground = 'surface' }: ProjectIndexBandProps) => (
  <Reveal
    from="none"
    className={
      ground === 'surface'
        ? 'surface border-x-0 rounded-none'
        : 'border-y border-hairline'
    }
  >
    <ul className="max-w-7xl mx-auto">
      {projects.map((project, idx) => (
        <ProjectRow
          key={project.title}
          project={project}
          index={idx}
          first={idx === 0}
          number={`${prefix}${prefix ? idx + 1 : String(idx + 1).padStart(2, '0')}`}
          labels={labels}
        />
      ))}
    </ul>
  </Reveal>
);
