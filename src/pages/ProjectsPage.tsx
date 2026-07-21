import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { useLanguage } from '../i18n/LanguageContext';

export const ProjectsPage = () => {
  const { lang, content } = useLanguage();
  const { projects, projectsSection } = content;
  const homeHref = lang === 'hi' ? '/hi' : '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />
      
      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <Link
              to={homeHref}
              className="inline-flex items-center gap-2 text-secondary-text hover:text-white transition-colors group mb-8"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              {projectsSection.backToHome}
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left">
              <div>
                <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{projectsSection.label}</span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{projectsSection.pageTitle} <span className="text-gradient">{projectsSection.pageTitleAccent}</span></h2>
              </div>
              <p className="text-secondary-text max-w-md text-right hidden md:block text-lg">
                {projectsSection.pageDescription}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, idx) => (
              <ProjectCard key={project.title} project={project} index={idx} />
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
