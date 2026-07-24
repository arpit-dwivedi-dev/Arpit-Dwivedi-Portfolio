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
          </Routes>
          <WhatsAppButton />
        </LanguageProvider>
      </Router>
    </ThemeProvider>
  );
}
