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
  WIFI_QR_FAQ,
  WIFI_QR_HOW_IT_WORKS_STEPS,
  WIFI_QR_PLACEMENT_IDEAS,
  WIFI_QR_PRINT_TIPS,
  WIFI_SECURITY_TYPES,
} from '../../tools/qrCodeGenerator/wifiLandingContent';
import { TOOLS, getToolCategory, categoryTitle, toolTitle } from '../../tools/registry';

const TOOL = TOOLS.find((t) => t.id === 'qr-code-generator')!;
const TOOL_CATEGORY = getToolCategory(TOOL.category)!;
const HUB_HREF = `/tools/${TOOL.category}/${TOOL.path}`;
const PAGE_URL = 'https://101techlabs.com/wifi-qr-code';

// Dedicated landing page for the "wifi qr code" intent cluster. It owns the
// page chrome and the network-specific copy only — the generator itself is
// the same shared QrCodeGeneratorWidget the hub renders, locked to the
// existing `wifi` QR type, so there is exactly one encoder, one validator,
// and one export path across the whole site.
export const WifiQrCodePage = () => {
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
                { name: 'WiFi QR Code' },
              ]}
            />

            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase block">Free Tool</span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gradient">WiFi QR Code Generator</h1>
              <p className="text-secondary-text text-sm max-w-xl mx-auto">
                Create a QR code for your WiFi network so guests or team members can connect without typing the password.
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
              <strong className="text-ink">No server, no storage.</strong> Your network name and password are encoded directly into the QR code
              in your browser — nothing you type here is ever uploaded or saved.
            </p>
          </motion.div>

          <QrCodeGeneratorWidget initialType="wifi" lockToType="wifi" toolId="wifi-qr-code-landing" />

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
          name: 'WiFi QR Code Generator',
          url: PAGE_URL,
          description:
            'Generate a QR code for your WiFi network so guests can connect without typing the password. Free, works in your browser, and downloads as PNG or SVG.',
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
          mainEntity: WIFI_QR_FAQ.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">How WiFi QR Codes Work</h2>
          <ol className="space-y-2 text-secondary-text list-decimal list-inside">
            {WIFI_QR_HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">What Information Is Encoded</h2>
          <p className="text-secondary-text leading-relaxed">
            The QR code holds your network name (SSID), security type, password, and hidden-network flag in a standard WIFI: payload — the same
            format most QR-based WiFi tools use. It represents your WiFi connection details, not a secure password vault; anyone who can scan or
            otherwise read the code gets the same information you typed in.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">WPA, WEP, and Open Networks</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {WIFI_SECURITY_TYPES.map((option) => (
              <div key={option.type} className="p-5 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{option.type}</h3>
                <p className="text-secondary-text text-sm">{option.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Hidden WiFi Networks</h2>
          <p className="text-secondary-text leading-relaxed">
            Turning on the hidden-network option tells a scanning device that the network doesn't broadcast its name publicly, so it knows to
            connect by name instead of picking it from a visible list. The toggle only describes that property — it doesn't hide the network
            itself. Only enable it if the network is actually configured as hidden on the router; otherwise leave it off.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Security Considerations</h2>
          <p className="text-secondary-text leading-relaxed mb-4">
            A WiFi QR code can reveal your network credentials to anyone who scans it — the QR format is a convenient encoding, not a
            password-protection mechanism. Think about who will see a printed code before you place it: a café guest network, an Airbnb welcome
            book, a waiting room, an office, or an event all put the code somewhere strangers can point a camera at it.
          </p>
          <p className="text-secondary-text leading-relaxed">
            Use a separate guest network when sharing access publicly, rather than your main household or office WiFi. A QR code does not make
            the password secret from someone who can scan it — it just saves them from typing it in by hand.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Where to Use a WiFi QR Code</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-secondary-text">
            {WIFI_QR_PLACEMENT_IDEAS.map((idea) => (
              <li key={idea} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                {idea}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Printing and Testing Tips</h2>
          <ul className="space-y-2 text-secondary-text list-disc list-inside">
            {WIFI_QR_PRINT_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">FAQ</h2>
          <div className="space-y-4">
            {WIFI_QR_FAQ.map((item) => (
              <div key={item.question} className="p-4 rounded-2xl bg-bg-secondary border border-ink/5">
                <h3 className="font-bold text-ink mb-1">{item.question}</h3>
                <p className="text-secondary-text text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <SupportPrompt copy={{ closeLabel: 'Close' }} titleId="wifi-qr-support-prompt-heading" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
