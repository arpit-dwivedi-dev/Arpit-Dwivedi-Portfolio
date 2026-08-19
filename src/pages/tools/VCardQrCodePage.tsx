import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { SupportPrompt } from '../../components/tools/BuyMeACoffee';
import { Footer } from '../../components/AchievementsContact';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { JsonLd } from '../../components/seo/JsonLd';
import { QrCodeGeneratorWidget } from '../../tools/qrCodeGenerator/QrCodeGeneratorWidget';
import { TOOLS, getToolCategory, categoryTitle, toolTitle } from '../../tools/registry';

const TOOL = TOOLS.find((t) => t.id === 'qr-code-generator')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const HUB_HREF = `/tools/${TOOL.category}/${TOOL.path}`;

const FAQ_ITEMS = [
  {
    question: 'What is a vCard QR code?',
    answer:
      "A vCard QR code encodes a contact card (vCard/VCF format) directly in the QR code itself — name, phone, email, company, and more. When someone scans it, their phone reads that contact data straight out of the code, without visiting a website.",
  },
  {
    question: 'What information can a vCard QR code contain?',
    answer:
      'This tool supports a name prefix, first and last name, organization, job title, mobile number, email, a street/city/region/postcode/country address, and a website URL — the same fields the vCard (VCF) format supports for a simple contact card.',
  },
  {
    question: 'Will it work on iPhone and Android?',
    answer:
      "Both iPhone and Android camera apps can read a vCard QR code and offer to add it as a contact — but the exact prompt varies by phone, camera app, and OS version. Some show an \"Add Contact\" screen immediately; others open the card as a file first.",
  },
  {
    question: 'Can I use it on a business card?',
    answer:
      'Yes — download the QR code as a PNG or SVG and print it on a business card, name badge, table tent, or conference lanyard. SVG stays sharp at any print size, which is useful for small card printing.',
  },
  {
    question: 'Does it expire?',
    answer:
      'No. The QR code encodes your contact details directly — there is no link, account, or subscription behind it, so it keeps working for as long as the printed or displayed code is legible.',
  },
];

export const VCardQrCodePage = () => {
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
              backLabel={`Back to ${toolTitle(TOOL)}`}
              items={[
                { name: 'Home', href: '/', className: 'hidden sm:flex' },
                { name: 'Tools', href: '/tools', className: 'hidden sm:flex' },
                { name: categoryTitle(TOOL_CATEGORY), href: `/tools/${TOOL.category}`, className: 'hidden sm:flex' },
                { name: toolTitle(TOOL), href: HUB_HREF },
                { name: 'vCard / Contact QR Code' },
              ]}
            />

            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">Free Tool</span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gradient">vCard / Contact QR Code Generator</h1>
              <p className="text-secondary-text text-sm max-w-xl mx-auto">
                Create a QR code that lets someone save your contact information — no app, signup, or typing required on their end.
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
              <strong className="text-ink">No server, no storage.</strong> Your contact details are encoded directly into the QR code in your
              browser — nothing you type here is ever uploaded or saved.
            </p>
          </motion.div>

          <QrCodeGeneratorWidget initialType="contact" lockToType="contact" toolId="vcard-qr-code-landing" />

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
          name: 'vCard QR Code Generator',
          url: 'https://101techlabs.com/vcard-qr-code',
          description:
            "Create a QR code that saves your contact details to someone's phone. Add your name, phone, email, company, and address — free and no signup.",
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
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">How vCard QR Codes Work</h2>
          <p className="text-secondary-text leading-relaxed">
            A vCard (short for "virtual card", also called a VCF file) is a small text format built specifically to hold contact details — name,
            phone, email, company, and address. This tool packs that data directly into the QR code itself, rather than pointing to a web page.
            When a phone's camera scans it, it recognizes the vCard format and offers to add the person as a new contact — no browser or internet
            connection needed at scan time. That's the key difference from a URL QR code, which only opens a link and depends on the destination
            page still being online.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">What Information Can Be Included</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-secondary-text">
            {[
              'Name prefix, first name, and last name',
              'Organization and job title',
              'Mobile phone number',
              'Email address',
              'Street address, city, region, postcode, and country',
              'Website URL',
            ].map((item) => (
              <li key={item} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Where to Use a Contact QR Code</h2>
          <ul className="space-y-2 text-secondary-text list-disc list-inside">
            <li>Printed business cards</li>
            <li>Digital business cards shared on a phone screen</li>
            <li>Name badges at conferences and trade shows</li>
            <li>Networking event handouts and table tents</li>
            <li>Email signatures</li>
            <li>Marketing material like flyers or brochures</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">vCard QR vs Profile/Link QR</h2>
          <p className="text-secondary-text leading-relaxed">
            A vCard QR code embeds contact fields directly, so the receiving phone can offer to save them as a new contact immediately, even
            offline. A profile or link QR code (like the URL type on our main{' '}
            <Link to={HUB_HREF} className="text-accent-blue hover:underline">
              QR Code Generator
            </Link>
            ) instead opens a web page — useful for a full digital profile, portfolio, or social links, but it requires an internet connection
            and doesn't save anything to the phone's contacts on its own.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Mobile Save Behavior</h2>
          <p className="text-secondary-text leading-relaxed">
            Most modern iPhone and Android camera apps recognize a vCard QR code and show an add-to-contacts screen after scanning. The exact
            flow varies by device, camera app, and OS version — some third-party QR scanner apps may instead open or download the vCard as a
            file rather than prompting to save it directly. It doesn't always look identical across every phone, and it isn't guaranteed to save
            automatically without any user action.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Usage Tips</h2>
          <ol className="space-y-2 text-secondary-text list-decimal list-inside">
            <li>Fill in at least a name, phone, email, or company so the code has something to save.</li>
            <li>Test the QR code with your own phone's camera before printing it anywhere.</li>
            <li>Download as SVG if you're printing small (business cards, badges) — it stays sharp at any size.</li>
            <li>Keep foreground/background contrast high so the code scans reliably.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">FAQ</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{item.question}</h3>
                <p className="text-secondary-text text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <SupportPrompt copy={{ closeLabel: 'Close' }} titleId="vcard-qr-support-prompt-heading" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
