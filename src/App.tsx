import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { HomePage } from './pages/HomePage';
import { ScrollToHash } from './components/ScrollToHash';
import { WhatsAppButton } from './components/WhatsAppButton';
// Chat launcher disabled for now — the backing bot isn't running, so the
// bubble opened onto a dead assistant. Re-enable with the import + <ChatBot />
// below once the service is live again.
// import { ChatBot } from './components/ChatBot';
import { Analytics } from './components/Analytics';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';

// The DBML builder is a full-screen IDE-like tool with its own dark chrome
// and a bottom-right minimap — the site-wide WhatsApp/ChatBot bubbles float
// on top of that canvas and collide with it, so they're suppressed there.
const FULL_SCREEN_TOOL_PATHS = ['/tools/developer/dbml-diagram-builder'];
/**
 * True once the page footer is on screen.
 *
 * The floating WhatsApp and chat launchers live in the bottom-right corner,
 * which is exactly where the footer's own links sit at the end of every page —
 * they were painting on top of them. The previous fix was 8rem of extra
 * footer padding below md, which left a band of dead space on mobile and did
 * nothing at desktop widths, where the collision also happened. Getting out
 * of the way when the footer arrives fixes both without reserving empty
 * space that exists only to be avoided.
 */
const useFooterInView = () => {
  const [inView, setInView] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) {
      setInView(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      // Trigger a little early, so the launchers are gone before they
      // overlap rather than fading out on top of the first link they reach.
      rootMargin: '0px 0px 40px 0px',
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [location.pathname]);

  return inView;
};

const GlobalWidgets = () => {
  const location = useLocation();
  const footerInView = useFooterInView();
  const isFullScreenTool = FULL_SCREEN_TOOL_PATHS.includes(location.pathname);
  if (isFullScreenTool) return null;
  return (
    // Opacity on an ancestor does not create a containing block for fixed
    // descendants, so the launchers keep positioning against the viewport.
    <div
      className={`transition-opacity duration-300 ${footerInView ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      aria-hidden={footerInView}
    >
      <WhatsAppButton />
      {/* <ChatBot /> */}
    </div>
  );
};

// The site used to serve a Hindi mirror under /hi/... Those routes are gone,
// but some of their URLs are indexed and bookmarked, so rather than letting
// them fall through to the catch-all (which would dump every visitor on the
// home page and lose the page they asked for), strip the prefix and send
// them to the English equivalent. A server-level 301 should replace this
// once the hosting layer supports one — same caveat as the /free-tools
// redirects below.
const HindiRedirect = () => {
  const location = useLocation();
  const target = location.pathname.replace(/^\/hi(?=\/|$)/, '') || '/';
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
};

// A plain <a> here can't reach useLanguage() — this component sits inside
// LanguageProvider so it's the one that renders the skip link.
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
const InvoiceGeneratorPage = lazy(() =>
  import('./pages/tools/InvoiceGeneratorPage').then((m) => ({ default: m.InvoiceGeneratorPage })),
);
const QRCodeGeneratorPage = lazy(() =>
  import('./pages/tools/QRCodeGeneratorPage').then((m) => ({ default: m.QRCodeGeneratorPage })),
);
const QRRedirectPage = lazy(() =>
  import('./pages/tools/QRRedirectPage').then((m) => ({ default: m.QRRedirectPage })),
);
const VCardQrCodePage = lazy(() =>
  import('./pages/tools/VCardQrCodePage').then((m) => ({ default: m.VCardQrCodePage })),
);
const MenuQrCodePage = lazy(() =>
  import('./pages/tools/MenuQrCodePage').then((m) => ({ default: m.MenuQrCodePage })),
);
const WifiQrCodePage = lazy(() =>
  import('./pages/tools/WifiQrCodePage').then((m) => ({ default: m.WifiQrCodePage })),
);
const ApiRequestBuilderPage = lazy(() =>
  import('./pages/tools/ApiRequestBuilderPage').then((m) => ({ default: m.ApiRequestBuilderPage })),
);
const DbmlDiagramBuilderPage = lazy(() =>
  import('./pages/tools/DbmlDiagramBuilderPage').then((m) => ({ default: m.DbmlDiagramBuilderPage })),
);
const GuidesPage = lazy(() => import('./pages/GuidesPage').then((m) => ({ default: m.GuidesPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then((m) => ({ default: m.GuidePage })));
// Resolves the legacy /guides/:slug shape to either a category landing page
// (rendered in place) or an individual article (redirected to its new
// /guides/:category/:slug URL) — see GuideOrCategoryPage for why this can't
// just be a route to GuidePage.
const GuideOrCategoryPage = lazy(() =>
  import('./pages/GuideOrCategoryPage').then((m) => ({ default: m.GuideOrCategoryPage })),
);
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));

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
    // reducedMotion="user" is the site-wide gate for JS-driven motion. The CSS
    // media query in index.css cannot reach anything the motion library
    // animates inline, and there are ~25 components with their own motion
    // props; this makes every one of them honour the OS setting without each
    // having to remember to call useReducedMotion. Transform and layout
    // animations are dropped to their end state while opacity is still
    // allowed, so nothing is left invisible.
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <Router basename={basename}>
        <LanguageProvider>
          <SkipLink />
          <ScrollToHash />
          <Analytics />
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/projects" element={lazyRoute(ProjectsPage)} />
            <Route path="/about" element={lazyRoute(AboutPage)} />
            <Route path="/services" element={lazyRoute(ServicesPage)} />
            <Route path="/contact" element={lazyRoute(ContactPage)} />
            <Route path="/privacy-policy" element={lazyRoute(PrivacyPolicyPage)} />
            <Route path="/terms" element={lazyRoute(TermsPage)} />
            <Route path="/editorial-policy" element={lazyRoute(EditorialPolicyPage)} />

            {/* /tools replaces /free-tools — see redirects below */}
            <Route path="/tools" element={lazyRoute(ToolsPage)} />
            <Route path="/tools/:category" element={lazyRoute(ToolCategoryPage)} />
            <Route path="/tools/generators/invoice-generator" element={lazyRoute(InvoiceGeneratorPage)} />
            <Route path="/tools/generators/qr-code-generator" element={lazyRoute(QRCodeGeneratorPage)} />
            {/* Dedicated SEO landing page for the "vCard/contact QR code"
               intent cluster — reuses the same generator engine as the hub
               above, preselected to the `contact` QR type. */}
            <Route path="/vcard-qr-code" element={lazyRoute(VCardQrCodePage)} />
            {/* Same pattern for the "menu QR code" intent cluster (restaurant
               and café menus) — the shared generator engine again, this time
               preselected and locked to the `menu` QR type. */}
            <Route path="/menu-qr-code" element={lazyRoute(MenuQrCodePage)} />
            {/* Same pattern for the "WiFi QR code" intent cluster (guest and
               team network sharing) — the shared generator engine again,
               this time preselected and locked to the `wifi` QR type. */}
            <Route path="/wifi-qr-code" element={lazyRoute(WifiQrCodePage)} />
            <Route path="/tools/developer/api-request-builder" element={lazyRoute(ApiRequestBuilderPage)} />
            <Route path="/tools/developer/dbml-diagram-builder" element={lazyRoute(DbmlDiagramBuilderPage)} />
            {/* Not a content page — the smart-redirect target embedded inside
               Multi-URL / dual-platform App QR codes. See QRRedirectPage. */}
            <Route path="/tools/generators/qr-code-generator/go" element={lazyRoute(QRRedirectPage)} />

            {/* Content hub — original guides written in-house (not scraped
               from competitors) covering how-to topics for each free tool
               (invoicing, QR codes, API testing) for SEO/GEO. Article
               canonical URLs are /guides/:category/:slug; the legacy
               single-segment /guides/:slug still resolves category landing
               pages directly and redirects old flat article URLs to their
               new canonical URL (see GuideOrCategoryPage). */}
            <Route path="/guides" element={lazyRoute(GuidesPage)} />
            <Route path="/guides/:category/:slug" element={lazyRoute(GuidePage)} />
            <Route path="/guides/:slug" element={lazyRoute(GuideOrCategoryPage)} />

            {/* Separate from /guides on purpose (Phase 3 decision,
               content-rewrite project):
               /guides stays scoped to the free tools' own how-to content;
               /blog is a curated feed of open-source engineering posts
               pulled live from dev.to and linked out to their original
               source — see src/lib/engineeringPosts.ts. No per-post detail
               route: cards redirect straight to the external article. */}
            <Route path="/blog" element={lazyRoute(BlogPage)} />

            {/* Legacy /free-tools URLs — redirect rather than 404 now that a
               handful of these may already be indexed or bookmarked. A true
               server-level 301 should replace this once the production
               hosting layer is confirmed (see SEO audit, §1/§4). */}
            <Route path="/free-tools" element={<Navigate to="/tools" replace />} />

            {/* Retired Hindi mirror — see HindiRedirect. Must stay above the
               catch-all so /hi/tools lands on /tools rather than the home
               page. Both shapes are needed: "/hi/*" does not match a bare
               "/hi" in React Router. */}
            <Route path="/hi" element={<HindiRedirect />} />
            <Route path="/hi/*" element={<HindiRedirect />} />

            {/* Safety net for any unmatched URL (dead link, typo, stale
               bookmark) — without this, React Router renders nothing and
               the visitor sees a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <GlobalWidgets />
        </LanguageProvider>
      </Router>
    </ThemeProvider>
    </MotionConfig>
  );
}
