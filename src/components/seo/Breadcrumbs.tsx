import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { JsonLd } from './JsonLd';

// Fixed rather than window.location.origin — this also runs during the
// build-time prerender pass (see scripts/prerender.mjs), served from
// http://localhost, and the baked-in schema must point at the real domain.
const SITE_ORIGIN = 'https://101techlabs.com';

export interface BreadcrumbItem {
  name: string;
  /** Omit on the last item — it renders as the current page, not a link. */
  href?: string;
  /** Extra classes on this item's <li> (and its leading separator) — e.g. `hidden sm:flex` to collapse mid-trail crumbs on mobile. */
  className?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** When set, renders a leading back-arrow item linking here, ahead of the rest of the trail. */
  backHref?: string;
  backLabel?: string;
}

// Renders the visible trail and its BreadcrumbList schema from the same
// data — the two can never drift out of sync because there's only one list.
// The back arrow (when present) is a navigation affordance only, not part of
// the schema's itemListElement, since it duplicates the very next crumb.
export const Breadcrumbs = ({ items, className = '', backHref, backLabel = 'Back' }: BreadcrumbsProps) => {
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
      {/* Hidden below sm — on mobile the crumb trail (plus the back arrow)
          just eats vertical space above the fold; the schema above still
          carries the trail for search engines regardless of visibility. */}
      <ol className="hidden sm:flex flex-wrap items-center gap-1.5 text-xs font-mono text-secondary-text">
        {backHref && (
          <li className="flex items-center gap-1.5">
            <Link
              to={backHref}
              aria-label={backLabel}
              className="inline-flex items-center gap-1 hover:text-accent-blue transition-colors group"
            >
              <ArrowLeft size={12} aria-hidden="true" className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <ChevronRight size={12} aria-hidden="true" className="text-secondary-text/50 shrink-0" />
          </li>
        )}
        {items.map((item, idx) => (
          <li key={item.name} className={`items-center gap-1.5 ${item.className ?? 'flex'}`}>
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
