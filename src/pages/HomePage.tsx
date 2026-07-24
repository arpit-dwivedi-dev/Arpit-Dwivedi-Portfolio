import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { FeaturedProject } from '../components/FeaturedProject';
import { About } from '../components/AboutTech';
import { Team, Process } from '../components/TeamProcess';
import { Services, Projects } from '../components/ExperienceProjects';
import { DevOpsArchitecture, Clients, Contact, Footer } from '../components/AchievementsContact';
import { motion, useScroll, useSpring } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

export const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { content } = useLanguage();
  const { navLinks } = content;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent-blue z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* Scroll Indicator Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-label={`Go to ${link.name}`}
              title={link.name}
              className="group p-2 -m-2 flex items-center justify-center"
            >
              <span className="w-2 h-2 rounded-full bg-ink/20 group-hover:bg-accent-blue transition-all group-hover:scale-150" aria-hidden="true" />
            </a>
          ))}
      </div>

      <Navbar />

      <main id="main-content">
        <Hero />
        <FeaturedProject />
        <About />
        <Team />
        <Services />
        <Projects />
        <DevOpsArchitecture />
        <Clients />
        <Process />
        <Contact />
      </main>

      <Footer />

      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
