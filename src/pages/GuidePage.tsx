import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { JsonLd } from '../components/seo/JsonLd';
import { useLanguage } from '../i18n/LanguageContext';
import { getGuideBySlug, getGuideRedirectTarget, getRelatedGuides } from '../content/guides/data';
import { guideCategoryTitle, guidePath } from '../content/guides/categories';
import { guideDetailContent as t } from '../content/guides/pageContent';

const SITE_ORIGIN = 'https://101techlabs.com';

// Rendered at /guides/:category/:slug. The category segment is part of the
// canonical URL (see guidePath) but isn't otherwise used to look up the
// guide — slugs are unique on their own — it's only checked so a guide
// never renders under a category it doesn't belong to (e.g.
// /guides/qr-code/how-to-make-an-invoice must not show the invoice guide).
export const GuidePage = () => {
  const { lang, content } = useLanguage();
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const guide = slug ? getGuideBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Baked into the static HTML by the Puppeteer prerender pass (see
  // scripts/prerender.mjs) — same appendChild/cleanup pattern as
  // QRRedirectPage's robots tag, scoped to this component rather than
  // upserted globally in LanguageContext so it can never leak onto an
  // unrelated route via a stale DOM node.
  useEffect(() => {
    if (!guide?.noindex) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, follow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [guide]);

  // Unknown slug, or a real slug under the wrong category — send to the
  // guides index rather than rendering an empty shell (or the wrong
  // article) that could get indexed as its own thin/duplicate page. A slug
  // retired by content consolidation (see GUIDE_REDIRECTS) instead sends
  // the visitor straight to the article its content was merged into.
  if (!guide || guide.category !== category) {
    if (!guide) {
      const redirectTarget = slug ? getGuideRedirectTarget(slug) : undefined;
      if (redirectTarget) return <Navigate to={guidePath(redirectTarget)} replace />;
    }
    return <Navigate to="/guides" replace />;
  }

  const related = getRelatedGuides(guide);
  const url = `${SITE_ORIGIN}${guidePath(guide)}`;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      {!guide.noindex && (
        <>
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: guide.title,
              description: guide.description,
              datePublished: guide.publishedDate,
              dateModified: guide.updatedDate,
              author: { '@id': `${SITE_ORIGIN}/#founder` },
              publisher: { '@id': `${SITE_ORIGIN}/#organization` },
              mainEntityOfPage: url,
              inLanguage: 'en',
            }}
          />
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: guide.faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            }}
          />
        </>
      )}

      <main id="main-content" className="pt-32 pb-24">
        <article className="max-w-3xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[
              { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' },
              { name: t.breadcrumbLabel, href: '/guides' },
              { name: guide.title },
            ]}
          />

          <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{guideCategoryTitle(guide.category)}</span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{guide.title}</h1>
            <div className="flex items-center gap-4 text-secondary-text text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" />
                {guide.readTimeMinutes} {t.readTimeSuffix}
              </span>
              <span>{t.updatedPrefix} {new Date(guide.updatedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </motion.header>

          <div className="space-y-4 mb-12 text-secondary-text leading-relaxed">
            {guide.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          <div className="space-y-12">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold tracking-tight text-ink mb-4">{section.heading}</h2>
                <div className="space-y-4 text-secondary-text leading-relaxed">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets && (
                    <ul className="space-y-2 list-disc list-inside pt-1">
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight text-ink mb-4">{t.faqHeading}</h2>
            <div className="space-y-4">
              {guide.faq.map((item) => (
                <div key={item.question} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                  <h3 className="font-bold text-ink mb-1">{item.question}</h3>
                  <p className="text-secondary-text text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-14 p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-ink font-medium">{guide.ctaText ?? t.ctaText}</p>
            <Link
              to={guide.ctaToolHref ?? '/tools/generators/invoice-generator'}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
            >
              {guide.ctaToolLabel ?? t.ctaButton}
            </Link>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-2xl font-bold tracking-tight text-ink mb-4">{t.relatedHeading}</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={guidePath(r)}
                      className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                    >
                      <span className="font-bold text-ink">{r.title}</span>
                      <p className="text-secondary-text text-sm mt-1">{r.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
