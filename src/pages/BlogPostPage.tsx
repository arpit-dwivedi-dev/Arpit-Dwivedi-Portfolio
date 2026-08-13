import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { JsonLd } from '../components/seo/JsonLd';
import { useLanguage } from '../i18n/LanguageContext';
import { getBlogPostBySlug, getRelatedBlogPosts } from '../content/blog/data';
import { blogDetailContent as t } from '../content/blog/pageContent';

const SITE_ORIGIN = 'https://101techlabs.com';

export const BlogPostPage = () => {
  const { lang, content } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Unknown slug — send to the blog index rather than rendering an empty
  // shell that could get indexed as its own thin page.
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const related = getRelatedBlogPosts(post);
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.description,
          datePublished: post.publishedDate,
          dateModified: post.updatedDate,
          author: { '@id': `${SITE_ORIGIN}/#organization` },
          publisher: { '@id': `${SITE_ORIGIN}/#organization` },
          mainEntityOfPage: url,
          inLanguage: 'en',
        }}
      />
      {post.faq.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: post.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }}
        />
      )}

      <main id="main-content" className="pt-32 pb-24">
        <article className="max-w-3xl mx-auto px-6">
          <Breadcrumbs
            className="mb-8"
            items={[
              { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/' },
              { name: t.breadcrumbLabel, href: '/blog' },
              { name: post.title },
            ]}
          />

          <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{post.category}</span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-secondary-text text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" />
                {post.readTimeMinutes} {t.readTimeSuffix}
              </span>
              <span>{t.updatedPrefix} {new Date(post.updatedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </motion.header>

          <div className="space-y-4 mb-12 text-secondary-text leading-relaxed">
            {post.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          <div className="space-y-12">
            {post.sections.map((section) => (
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

          {post.comparisonTable && (
            <section className="mt-14 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="text-left py-3 pr-4 font-bold text-ink"></th>
                    <th className="text-left py-3 px-4 font-bold text-ink">{post.comparisonTable.columnA}</th>
                    <th className="text-left py-3 px-4 font-bold text-ink">{post.comparisonTable.columnB}</th>
                  </tr>
                </thead>
                <tbody>
                  {post.comparisonTable.rows.map((row) => (
                    <tr key={row.label} className="border-b border-ink/5">
                      <td className="py-3 pr-4 text-secondary-text font-medium whitespace-nowrap">{row.label}</td>
                      <td className="py-3 px-4 text-secondary-text">{row.a}</td>
                      <td className="py-3 px-4 text-secondary-text">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight text-ink mb-4">{t.faqHeading}</h2>
            <div className="space-y-4">
              {post.faq.map((item) => (
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
              to="/contact"
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
                      to={`/blog/${r.slug}`}
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
