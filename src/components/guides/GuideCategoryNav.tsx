import { Link } from 'react-router-dom';
import type { GuideCategoryWithCount } from '../../content/guides/categories';

interface GuideCategoryNavProps {
  categories: GuideCategoryWithCount[];
  ariaLabel: string;
  className?: string;
}

// Real, crawlable links into each /guides/{category} landing page — not a
// client-side filter toggle. Used on both the /guides hub (all categories)
// and each category page (sibling categories), so the category pill markup
// lives in exactly one place.
export const GuideCategoryNav = ({ categories, ariaLabel, className = '' }: GuideCategoryNavProps) => (
  <nav aria-label={ariaLabel} className={`flex flex-wrap justify-center gap-2 ${className}`}>
    {categories.map((category) => (
      <Link
        key={category.slug}
        to={`/guides/${category.slug}`}
        title={category.description}
        className="px-4 py-2 rounded-full text-sm font-bold bg-bg-secondary text-secondary-text border border-ink/5 hover:text-ink hover:border-accent-blue/30 transition-colors"
      >
        {category.title} <span className="opacity-70">({category.count})</span>
      </Link>
    ))}
  </nav>
);
