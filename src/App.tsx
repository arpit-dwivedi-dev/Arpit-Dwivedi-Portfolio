import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ScrollToHash } from './components/ScrollToHash';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Analytics } from './components/Analytics';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';

// A plain <a> here can't reach useLanguage() — this component sits inside
// LanguageProvider so it's the one that translates the skip link.
const SkipLink = () => {
  const { content } = useLanguage();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent-blue focus:text-bg-pure focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
    >
      {content.nav.skipToMainContent}
    </a>
  );
};

// Code-split off the main bundle — not needed for the home page's LCP.
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() =>
  import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
);
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })));
const EditorialPolicyPage = lazy(() =>
  import('./pages/legal/EditorialPolicyPage').then((m) => ({ default: m.EditorialPolicyPage })),
);
const ToolsPage = lazy(() => import('./pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const ToolCategoryPage = lazy(() =>
  import('./pages/ToolCategoryPage').then((m) => ({ default: m.ToolCategoryPage })),
);
const GoogleMapsScraperPage = lazy(() =>
  import('./pages/tools/GoogleMapsScraperPage').then((m) => ({ default: m.GoogleMapsScraperPage })),
);
const InvoiceGeneratorPage = lazy(() =>
  import('./pages/tools/InvoiceGeneratorPage').then((m) => ({ default: m.InvoiceGeneratorPage })),
);
const QRCodeGeneratorPage = lazy(() =>
  import('./pages/tools/QRCodeGeneratorPage').then((m) => ({ default: m.QRCodeGeneratorPage })),
);
const QRRedirectPage = lazy(() =>
  import('./pages/tools/QRRedirectPage').then((m) => ({ default: m.QRRedirectPage })),
);
const GuidesPage = lazy(() => import('./pages/GuidesPage').then((m) => ({ default: m.GuidesPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then((m) => ({ default: m.GuidePage })));

// A null Suspense fallback means a direct visit to a lazy route (shared link,
// bookmark) paints nothing — not even the navbar — until the chunk downloads
// and parses, inflating that route's LCP. This skeleton reserves the same
// top spacing as the real pages so something paints immediately.
const ToolRouteFallback = () => (
  <div className="min-h-screen bg-bg-pure pt-28 px-6">
    <div className="max-w-7xl mx-auto animate-pulse space-y-6">
      <div className="h-8 w-48 bg-ink/5 rounded-lg" />
      <div className="h-24 w-full bg-ink/5 rounded-2xl" />
    </div>
  </div>
);

const lazyRoute = (Component: ComponentType) => (
  <Suspense fallback={<ToolRouteFallback />}>
    <Component />
  </Suspense>
);

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ThemeProvider>
      <Router basename={basename}>
        <LanguageProvider>
          <SkipLink />
          <ScrollToHash />
          <Analytics />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hi" element={<HomePage />} />

            <Route path="/projects" element={lazyRoute(ProjectsPage)} />
            <Route path="/hi/projects" element={lazyRoute(ProjectsPage)} />

            <Route path="/about" element={lazyRoute(AboutPage)} />
            <Route path="/hi/about" element={lazyRoute(AboutPage)} />

            <Route path="/services" element={lazyRoute(ServicesPage)} />
            <Route path="/hi/services" element={lazyRoute(ServicesPage)} />

            <Route path="/contact" element={lazyRoute(ContactPage)} />
            <Route path="/hi/contact" element={lazyRoute(ContactPage)} />

            <Route path="/privacy-policy" element={lazyRoute(PrivacyPolicyPage)} />
            <Route path="/hi/privacy-policy" element={lazyRoute(PrivacyPolicyPage)} />

            <Route path="/terms" element={lazyRoute(TermsPage)} />
            <Route path="/hi/terms" element={lazyRoute(TermsPage)} />

            <Route path="/editorial-policy" element={lazyRoute(EditorialPolicyPage)} />
            <Route path="/hi/editorial-policy" element={lazyRoute(EditorialPolicyPage)} />

            {/* /tools replaces /free-tools — see redirects below */}
            <Route path="/tools" element={lazyRoute(ToolsPage)} />
            <Route path="/hi/tools" element={lazyRoute(ToolsPage)} />
            <Route path="/tools/:category" element={lazyRoute(ToolCategoryPage)} />
            <Route path="/hi/tools/:category" element={lazyRoute(ToolCategoryPage)} />
            <Route path="/tools/lead-generation/google-maps-business-finder" element={lazyRoute(GoogleMapsScraperPage)} />
            <Route path="/hi/tools/lead-generation/google-maps-business-finder" element={lazyRoute(GoogleMapsScraperPage)} />
            <Route path="/tools/generators/invoice-generator" element={lazyRoute(InvoiceGeneratorPage)} />
            <Route path="/hi/tools/generators/invoice-generator" element={lazyRoute(InvoiceGeneratorPage)} />
            <Route path="/tools/generators/qr-code-generator" element={lazyRoute(QRCodeGeneratorPage)} />
            <Route path="/hi/tools/generators/qr-code-generator" element={lazyRoute(QRCodeGeneratorPage)} />
            {/* Not a content page — the smart-redirect target embedded inside
               Multi-URL / dual-platform App QR codes. See QRRedirectPage. */}
            <Route path="/tools/generators/qr-code-generator/go" element={lazyRoute(QRRedirectPage)} />
            <Route path="/hi/tools/generators/qr-code-generator/go" element={lazyRoute(QRRedirectPage)} />

            {/* English-only content hub — original guides written in-house
               (not scraped from competitors) covering invoicing topics for
               SEO/GEO. No Hindi routes yet; low priority next to the tool
               itself, and 5 Hindi long-form articles is its own project. */}
            <Route path="/guides" element={lazyRoute(GuidesPage)} />
            <Route path="/guides/:slug" element={lazyRoute(GuidePage)} />

            {/* Legacy /free-tools URLs — redirect rather than 404 now that a
               handful of these may already be indexed or bookmarked. A true
               server-level 301 should replace this once the production
               hosting layer is confirmed (see SEO audit, §1/§4). */}
            <Route path="/free-tools" element={<Navigate to="/tools" replace />} />
            <Route path="/hi/free-tools" element={<Navigate to="/hi/tools" replace />} />
            <Route
              path="/free-tools/google-maps-scraper"
              element={<Navigate to="/tools/lead-generation/google-maps-business-finder" replace />}
            />
            <Route
              path="/hi/free-tools/google-maps-scraper"
              element={<Navigate to="/hi/tools/lead-generation/google-maps-business-finder" replace />}
            />

            {/* Safety net for any unmatched URL (dead link, typo, stale
               bookmark) — without this, React Router renders nothing and
               the visitor sees a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <WhatsAppButton />
        </LanguageProvider>
      </Router>
    </ThemeProvider>
  );
}
