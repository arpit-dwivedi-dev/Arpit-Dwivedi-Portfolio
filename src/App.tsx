import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ScrollToHash } from './components/ScrollToHash';
import { WhatsAppButton } from './components/WhatsAppButton';

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <Router basename={basename}>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
      <WhatsAppButton />
    </Router>
  );
}
