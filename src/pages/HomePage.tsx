import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { HomeJsonLd } from '../components/seo/HomeJsonLd';
import { Hero } from '../components/Hero';
import { FreeTools } from '../components/FreeToolsShowcase';
import { About } from '../components/AboutTech';
import { Team, Process } from '../components/TeamProcess';
import { WhyChooseUs, FAQ } from '../components/TrustSections';
import { Services } from '../components/ExperienceProjects';
import { DevOpsArchitecture, Contact, Footer } from '../components/AchievementsContact';
import { motion, useScroll, useSpring } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

export const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { lang, content } = useLanguage();
  const { navLinks, homeProjectsNote } = content;
  const projectsHref = lang === 'hi' ? '/hi/projects' : '/projects';

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
      <HomeJsonLd />

      <main id="main-content">
        <Hero />
        <FreeTools />
        <About />
        <Services />
        <WhyChooseUs />
        <Team />

        {/* Single low-key line, not a section — positioning.md's PORTFOLIO
            rule allows either a modest /work-style page or "a single
            low-key line further down" instead of homepage prominence.
            /projects (kept as the URL, not a new /work page — see Phase 3
            SEO notes) holds the full delivered/demo breakdown. */}
        <div className="text-center pb-24 px-6">
          <p className="text-secondary-text text-sm">
            {homeProjectsNote.text}{' '}
            <Link to={projectsHref} className="text-accent-blue hover:text-ink transition-colors font-medium">
              {homeProjectsNote.linkLabel}
            </Link>
          </p>
        </div>

        <DevOpsArchitecture />
        <Process />
        <FAQ />
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
