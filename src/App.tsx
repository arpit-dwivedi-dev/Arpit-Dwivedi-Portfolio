import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ScrollToHash } from './components/ScrollToHash';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Analytics } from './components/Analytics';
import { LanguageProvider } from './i18n/LanguageContext';

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
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
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/hi/projects" element={<ProjectsPage />} />
        </Routes>
        <WhatsAppButton />
      </LanguageProvider>
    </Router>
  );
}
