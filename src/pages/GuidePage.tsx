import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { JsonLd } from '../components/seo/JsonLd';
import { useLanguage } from '../i18n/LanguageContext';
import { getGuideBySlug, getRelatedGuides } from '../content/guides/data';
import { guideDetailContent as t } from '../content/guides/pageContent';

const SITE_ORIGIN = 'https://101techlabs.com';

export const GuidePage = () => {
  const { lang, content } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuideBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Unknown slug — send to the guides index rather than rendering an empty
  // shell that could get indexed as its own thin page.
  if (!guide) {
    return <Navigate to="/guides" replace />;
  }

  const related = getRelatedGuides(guide);
  const url = `${SITE_ORIGIN}/guides/${guide.slug}`;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

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
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{guide.category}</span>
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
            <p className="text-ink font-medium">{t.ctaText}</p>
            <Link
              to="/tools/generators/invoice-generator"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
            >
              {t.ctaButton}
            </Link>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-2xl font-bold tracking-tight text-ink mb-4">{t.relatedHeading}</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={`/guides/${r.slug}`}
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
