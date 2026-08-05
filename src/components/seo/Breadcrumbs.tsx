import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { JsonLd } from './JsonLd';

// Fixed rather than window.location.origin — this also runs during the
// build-time prerender pass (see scripts/prerender.mjs), served from
// http://localhost, and the baked-in schema must point at the real domain.
const SITE_ORIGIN = 'https://101techlabs.com';

export interface BreadcrumbItem {
  name: string;
  /** Omit on the last item — it renders as the current page, not a link. */
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

// Renders the visible trail and its BreadcrumbList schema from the same
// data — the two can never drift out of sync because there's only one list.
export const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_ORIGIN}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <JsonLd data={schema} />
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-secondary-text">
        {items.map((item, idx) => (
          <li key={item.name} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight size={12} aria-hidden="true" className="text-secondary-text/50 shrink-0" />}
            {item.href ? (
              <Link to={item.href} className="hover:text-accent-blue transition-colors">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
