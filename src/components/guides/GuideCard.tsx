import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import type { Guide } from '../../content/guides/types';
import { guideCategoryTitle, guidePath } from '../../content/guides/categories';
import { Reveal } from '../ui/Reveal';

interface GuideCardProps {
  guide: Guide;
  index: number;
  readTimeSuffix: string;
  /** Hidden on a category page, where every card already shares the same
   *  category — the label would just repeat the page's own heading. */
  showCategory?: boolean;
}

export const GuideCard = ({ guide, index, readTimeSuffix, showCategory = true }: GuideCardProps) => (
  <Reveal index={index}>
    <Link
      to={guidePath(guide)}
      className="group p-6 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full"
    >
      <div className={`flex items-center gap-3 mb-3 ${showCategory ? 'justify-between' : 'justify-end'}`}>
        {showCategory && (
          <span className="text-xs font-mono text-accent-blue uppercase tracking-widest">{guideCategoryTitle(guide.category)}</span>
        )}
        <ArrowUpRight size={16} className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-ink mb-2 group-hover:text-accent-blue transition-colors">{guide.title}</h2>
      <p className="text-secondary-text text-sm leading-relaxed flex-grow mb-3">{guide.description}</p>
      <span className="inline-flex items-center gap-1.5 text-xs text-secondary-text">
        <Clock size={12} aria-hidden="true" />
        {guide.readTimeMinutes} {readTimeSuffix}
      </span>
    </Link>
  </Reveal>
);
