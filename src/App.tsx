import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ScrollToHash } from './components/ScrollToHash';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Analytics } from './components/Analytics';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';

// Code-split off the main bundle — not needed for the home page's LCP.
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const FreeToolsPage = lazy(() => import('./pages/FreeToolsPage').then((m) => ({ default: m.FreeToolsPage })));
const GoogleMapsScraperPage = lazy(() =>
  import('./pages/tools/GoogleMapsScraperPage').then((m) => ({ default: m.GoogleMapsScraperPage })),
);

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

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ThemeProvider>
      <Router basename={basename}>
        <LanguageProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent-blue focus:text-bg-pure focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
          >
            Skip to main content
          </a>
          <ScrollToHash />
          <Analytics />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hi" element={<HomePage />} />
            <Route
              path="/projects"
              element={
                <Suspense fallback={null}>
                  <ProjectsPage />
                </Suspense>
              }
            />
            <Route
              path="/hi/projects"
              element={
                <Suspense fallback={null}>
                  <ProjectsPage />
                </Suspense>
              }
            />
            <Route
              path="/free-tools"
              element={
                <Suspense fallback={<ToolRouteFallback />}>
                  <FreeToolsPage />
                </Suspense>
              }
            />
            <Route
              path="/hi/free-tools"
              element={
                <Suspense fallback={<ToolRouteFallback />}>
                  <FreeToolsPage />
                </Suspense>
              }
            />
            <Route
              path="/free-tools/google-maps-scraper"
              element={
                <Suspense fallback={<ToolRouteFallback />}>
                  <GoogleMapsScraperPage />
                </Suspense>
              }
            />
            <Route
              path="/hi/free-tools/google-maps-scraper"
              element={
                <Suspense fallback={<ToolRouteFallback />}>
                  <GoogleMapsScraperPage />
                </Suspense>
              }
            />
          </Routes>
          <WhatsAppButton />
        </LanguageProvider>
      </Router>
    </ThemeProvider>
  );
}
