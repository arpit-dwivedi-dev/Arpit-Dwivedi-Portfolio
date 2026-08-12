import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ProjectCard } from '../components/ProjectCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';

export const ProjectsPage = () => {
  const { lang, content } = useLanguage();
  const { projects, projectsSection } = content;
  const homeHref = lang === 'hi' ? '/hi' : '/';
  // Delivered and demo/concept work are never blended into one grid — see
  // positioning.md and the founder's explicit instruction that unpaid,
  // never-adopted demo work gets its own clearly-labeled bucket.
  const deliveredProjects = projects.filter((project) => project.status !== 'demo');
  const demoProjects = projects.filter((project) => project.status === 'demo');

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
            <Breadcrumbs
              className="mb-8"
              backHref={homeHref}
              backLabel={projectsSection.backToHome}
              items={[{ name: content.nav.breadcrumbHome, href: homeHref }, { name: projectsSection.pageTitleAccent }]}
            />

            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left">
              <div>
                <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{projectsSection.label}</span>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{projectsSection.pageTitle} <span className="text-gradient">{projectsSection.pageTitleAccent}</span></h1>
              </div>
              <p className="text-secondary-text max-w-md text-right hidden md:block text-lg">
                {projectsSection.pageDescription}
              </p>
            </div>
          </motion.div>

          {deliveredProjects.length > 0 && (
            <div className="mb-16">
              <h2 className="text-xl font-bold text-ink mb-6">{projectsSection.deliveredHeading}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {deliveredProjects.map((project, idx) => (
                  <ProjectCard key={project.title} project={project} index={idx} />
                ))}
              </div>
            </div>
          )}

          {demoProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-ink mb-2">{projectsSection.demoHeading}</h2>
              <p className="text-secondary-text text-sm max-w-2xl mb-6">{projectsSection.demoIntro}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {demoProjects.map((project, idx) => (
                  <ProjectCard key={project.title} project={project} index={idx} />
                ))}
              </div>
            </div>
          )}
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
