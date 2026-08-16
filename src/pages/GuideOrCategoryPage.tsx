import { Navigate, useParams } from 'react-router-dom';
import { getGuideCategory, guidePath } from '../content/guides/categories';
import { getGuideBySlug, getGuideRedirectTarget } from '../content/guides/data';
import { GuideCategoryPage } from './GuideCategoryPage';

// /guides/:slug is the LEGACY single-segment shape — category landing pages
// (/guides/invoicing) still live here permanently, but individual guide
// articles used to (/guides/how-to-make-an-invoice, now
// /guides/invoicing/how-to-make-an-invoice). Both used to be one path
// segment, so this still resolves which one a given segment means, but an
// article match now client-side redirects to its new canonical
// /guides/:category/:slug URL instead of rendering in place — see the
// GitHub Pages hosting note on the legacy /free-tools redirects in App.tsx
// for why this can only be a client-side redirect, not a real HTTP 301.
// Category slugs are checked first and win any collision (none exist today,
// and none are expected to, but a category page is the more useful
// destination for a shared name). Anything matching neither falls back to
// the guides index, same as an unknown slug always has.
export const GuideOrCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = slug ? getGuideCategory(slug) : undefined;

  if (category) {
    return <GuideCategoryPage category={category} />;
  }

  const guide = slug ? getGuideBySlug(slug) : undefined;
  if (guide) {
    return <Navigate to={guidePath(guide)} replace />;
  }

  // Slug retired by content consolidation (e.g. the old flat
  // /guides/collect-unpaid-invoices) — send it to the merged article
  // instead of the generic /guides fallback below.
  const redirectTarget = slug ? getGuideRedirectTarget(slug) : undefined;
  if (redirectTarget) {
    return <Navigate to={guidePath(redirectTarget)} replace />;
  }

  return <Navigate to="/guides" replace />;
};
