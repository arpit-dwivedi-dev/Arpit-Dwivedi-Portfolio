import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { SupportPrompt } from '../../components/tools/BuyMeACoffee';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { QrCodeGeneratorWidget } from '../../tools/qrCodeGenerator/QrCodeGeneratorWidget';
import {
  MENU_FORMAT_COMPARISON,
  MENU_QR_FAQ,
  MENU_QR_HOW_IT_WORKS_STEPS,
  MENU_QR_PLACEMENT_IDEAS,
  MENU_QR_PRINT_TIPS,
} from '../../tools/qrCodeGenerator/menuLandingContent';
import { TOOLS, getToolCategory, categoryTitle, toolTitle } from '../../tools/registry';

const TOOL = TOOLS.find((t) => t.id === 'qr-code-generator')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const HUB_HREF = `/tools/${TOOL.category}/${TOOL.path}`;
const PAGE_URL = 'https://101techlabs.com/menu-qr-code';

// Dedicated landing page for the "menu QR code" intent cluster. It owns the
// page chrome and the restaurant-specific copy only — the generator itself is
// the same shared QrCodeGeneratorWidget the hub renders, locked to the
// existing `menu` QR type, so there is exactly one encoder, one validator,
// and one export path across the whole site.
export const MenuQrCodePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-28 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-3">
            <Breadcrumbs
              className="mb-2"
              backHref={HUB_HREF}
              backLabel={`Back to ${toolTitle(TOOL, 'en')}`}
              items={[
                { name: 'Home', href: '/', className: 'hidden sm:flex' },
                { name: 'Tools', href: '/tools', className: 'hidden sm:flex' },
                { name: categoryTitle(TOOL_CATEGORY, 'en'), href: `/tools/${TOOL.category}`, className: 'hidden sm:flex' },
                { name: toolTitle(TOOL, 'en'), href: HUB_HREF },
                { name: 'Menu QR Code' },
              ]}
            />

            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">Free Tool</span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gradient">Menu QR Code Generator</h1>
              <p className="text-secondary-text text-sm max-w-xl mx-auto">
                Turn your menu link into a QR code customers can scan — for your restaurant, café, bar, or takeaway.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mb-3"
          >
            <p className="text-xs text-secondary-text leading-snug">
              <strong className="text-ink">No server, no signup.</strong> Your menu link is encoded into the QR code in your browser — nothing
              you paste here is uploaded, stored, or shortened.
            </p>
          </motion.div>

          <QrCodeGeneratorWidget initialType="menu" lockToType="menu" toolId="menu-qr-code-landing" />

          <p className="text-secondary-text text-xs mt-3">
            Need a different QR code type? Try the full{' '}
            <Link to={HUB_HREF} className="text-accent-blue hover:underline">
              QR Code Generator
            </Link>
            .
          </p>
        </div>
      </main>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Menu QR Code Generator',
          url: PAGE_URL,
          description:
            'Turn your PDF or webpage menu into a scannable QR code for tables, signs, or receipts. Free, no signup, and most phone cameras scan it without an app.',
          inLanguage: 'en',
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
          mainEntity: MENU_QR_FAQ.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">How Menu QR Codes Work</h2>
          <ol className="space-y-2 text-secondary-text list-decimal list-inside">
            {MENU_QR_HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-secondary-text leading-relaxed mt-4">
            That is the whole mechanism. The code is a printed copy of your menu's web address, so the menu itself lives wherever you already
            host it — this tool never sees it, stores it, or sits in the middle of a scan.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">PDF Menu vs Webpage Menu</h2>
          <p className="text-secondary-text leading-relaxed mb-5">
            Either works. The QR code holds a link in both cases — it does not contain the PDF or the page itself — so the real decision is
            about the destination your customers land on.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {MENU_FORMAT_COMPARISON.map((option) => (
              <div key={option.format} className="p-5 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{option.format}</h3>
                <p className="text-secondary-text text-sm mb-3">{option.summary}</p>
                <ul className="space-y-2 text-secondary-text text-sm list-disc list-inside">
                  {option.advantages.map((advantage) => (
                    <li key={advantage}>{advantage}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-secondary-text leading-relaxed mt-5">
            The practical difference shows up later, when the menu changes. A webpage you edit in place keeps the same URL, so the code you
            already printed still resolves. A PDF re-uploaded under a new filename gets a new URL, and the old printed code will keep opening
            the old file — replace the PDF at the exact same address if you want the existing codes to follow it.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Where to Place a Menu QR Code</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-secondary-text">
            {MENU_QR_PLACEMENT_IDEAS.map((idea) => (
              <li key={idea} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                {idea}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Printing and Scanability Tips</h2>
          <ul className="space-y-2 text-secondary-text list-disc list-inside">
            {MENU_QR_PRINT_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="text-secondary-text leading-relaxed mt-4">
            There is no single size that is right everywhere — a code read from arm's length across a table and one read from outside a window
            have very different requirements. Print a proof at the size you plan to use, scan it from where customers will actually stand, and
            adjust before committing to a print run.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">No App Required</h2>
          <p className="text-secondary-text leading-relaxed">
            Most current iPhones and Android phones detect a QR code straight from the camera app and offer to open the link, so a customer
            usually just points and taps. Some older or restricted devices still need a QR scanner app, and a few camera apps show the link
            differently before opening it — the exact prompt varies by phone and OS version. Either way, what opens is your menu link in the
            phone's browser. Nothing gets installed, and there is no ordering system, account, or restaurant integration involved.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">FAQ</h2>
          <div className="space-y-4">
            {MENU_QR_FAQ.map((item) => (
              <div key={item.question} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{item.question}</h3>
                <p className="text-secondary-text text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <SupportPrompt copy={{ closeLabel: 'Close' }} titleId="menu-qr-support-prompt-heading" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
