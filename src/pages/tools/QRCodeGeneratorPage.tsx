import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { SupportPrompt } from '../../components/tools/BuyMeACoffee';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { useLanguage } from '../../i18n/LanguageContext';
import { trackEvent } from '../../monitoring';
import { QrCodeGeneratorWidget } from '../../tools/qrCodeGenerator/QrCodeGeneratorWidget';
import { TOOLS, getToolCategory, getRelatedTools, categoryTitle, toolTitle, toolDescription } from '../../tools/registry';
import { getGuideBySlug } from '../../content/guides/data';
import { guidePath } from '../../content/guides/categories';

const TOOL = TOOLS.find((t) => t.id === 'qr-code-generator')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const RELATED_TOOLS = getRelatedTools(TOOL);
const QR_GUIDE = getGuideBySlug('how-to-make-a-qr-code');

const fillPlaceholders = (text: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), text);

export const QRCodeGeneratorPage = () => {
  const { lang, content } = useLanguage();
  const t = content.qrCodeGeneratorTool;
  const toolsBase = lang === 'hi' ? '/hi/tools' : '/tools';
  const categoryHref = `${toolsBase}/${TOOL.category}`;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqItems = t.faq;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-28 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-3">
            <Breadcrumbs
              className="mb-2"
              backHref={categoryHref}
              backLabel={fillPlaceholders(t.backTo, { category: categoryTitle(TOOL_CATEGORY, lang) })}
              items={[
                { name: content.nav.breadcrumbHome, href: lang === 'hi' ? '/hi' : '/', className: 'hidden sm:flex' },
                { name: content.toolsPage.breadcrumb, href: toolsBase, className: 'hidden sm:flex' },
                { name: categoryTitle(TOOL_CATEGORY, lang), href: categoryHref },
                { name: toolTitle(TOOL, lang) },
              ]}
            />

            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">{t.freeToolLabel}</span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gradient">{toolTitle(TOOL, lang)}</h1>
              {QR_GUIDE && (
                <Link
                  to={lang === 'hi' ? '/hi' : guidePath(QR_GUIDE)}
                  className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium text-secondary-text hover:text-accent-blue transition-colors"
                >
                  <BookOpen size={13} aria-hidden="true" />
                  Guide
                </Link>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-3"
          >
            <p className="text-xs text-secondary-text leading-snug">
              <strong className="text-ink">{t.privacyNoteLead}</strong> {t.privacyNote}
            </p>
          </motion.div>

          <QrCodeGeneratorWidget initialType="url" toolId={TOOL.id} />

          {lang !== 'hi' && (
            <p className="text-secondary-text text-xs mt-3">
              Need a QR code specifically for sharing contact details? Use our{' '}
              <Link to="/vcard-qr-code" className="text-accent-blue hover:underline">
                vCard QR Code Generator
              </Link>
              . Creating one for a restaurant or café menu? See our{' '}
              <Link to="/menu-qr-code" className="text-accent-blue hover:underline">
                Menu QR Code Generator
              </Link>
              . Need to share WiFi access? Use our{' '}
              <Link to="/wifi-qr-code" className="text-accent-blue hover:underline">
                WiFi QR Code Generator
              </Link>
              .
            </p>
          )}
        </div>
      </main>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: toolTitle(TOOL, lang),
          url: `https://101techlabs.com${categoryHref}/${TOOL.path}`,
          description: toolDescription(TOOL, lang),
          inLanguage: lang,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          provider: { '@id': 'https://101techlabs.com/#organization' },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.howItWorksTitle}</h2>
          <ol className="space-y-2 text-secondary-text list-decimal list-inside">
            {t.howItWorksSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>

        {lang !== 'hi' && (
          <div className="p-6 rounded-2xl bg-bg-secondary border border-ink/5">
            <span className="text-accent-blue font-mono uppercase tracking-widest text-[10px] block mb-2">{t.judgmentHeading}</span>
            <p className="text-secondary-text text-sm leading-relaxed">{t.judgmentText}</p>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.featuresTitle}</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-secondary-text">
            {t.features.map((feature) => (
              <li key={feature} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">{feature}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.useCasesTitle}</h2>
          <ul className="space-y-2 text-secondary-text list-disc list-inside">
            {t.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{t.advantagesTitle}</h2>
            <ul className="space-y-2 text-secondary-text list-disc list-inside">
              {t.advantages.map((advantage) => <li key={advantage}>{advantage}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{t.limitationsTitle}</h2>
            <ul className="space-y-2 text-secondary-text list-disc list-inside">
              {t.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.faqTitle}</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.question} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{item.question}</h3>
                <p className="text-secondary-text text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {QR_GUIDE && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Guides</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              <li>
                <Link
                  to={lang === 'hi' ? '/hi' : guidePath(QR_GUIDE)}
                  className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                >
                  <span className="font-bold text-ink">{QR_GUIDE.title}</span>
                  <p className="text-secondary-text text-sm mt-1">{QR_GUIDE.description}</p>
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">{t.relatedToolsTitle}</h2>
          {RELATED_TOOLS.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {RELATED_TOOLS.map((related) => (
                <li key={related.id}>
                  <Link
                    to={`${toolsBase}/${related.category}/${related.path}`}
                    className="block p-4 rounded-2xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-colors"
                  >
                    <span className="font-bold text-ink">{toolTitle(related, lang)}</span>
                    <p className="text-secondary-text text-sm mt-1">{toolDescription(related, lang)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary-text text-sm">
              {fillPlaceholders(t.moreComingSoon, { category: categoryTitle(TOOL_CATEGORY, lang).toLowerCase() })}{' '}
              <Link to={toolsBase} className="text-accent-blue hover:underline">{t.browseAllTools}</Link>.
            </p>
          )}
        </div>

        <div className="p-6 rounded-3xl glass border-ink/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-ink font-medium">{t.crmCta}</p>
          <Link
            to={`${lang === 'hi' ? '/hi/contact' : '/contact'}?source=${TOOL.id}`}
            onClick={() => trackEvent('tool_to_contact_click', { tool_name: TOOL.id })}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
          >
            {t.talkToUs}
          </Link>
        </div>
      </section>

      <Footer />

      <SupportPrompt
        copy={{ closeLabel: t.closeAriaLabel }}
        titleId="qr-support-prompt-heading"
      />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
