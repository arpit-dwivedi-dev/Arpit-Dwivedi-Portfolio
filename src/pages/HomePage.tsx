import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

// Only the nav entries that are actually in-page anchors on this route —
// "Projects", "Free Tools" and "Blog" point at separate pages, not homepage
// sections, so they'd never light up and had nothing to scroll-spy against.
const SCROLL_SPY_HASHES = ['#home', '#about', '#experience', '#contact'];

export const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { content } = useLanguage();
  const { navLinks, homeProjectsNote } = content;
  const projectsHref = '/projects';
  const dotLinks = navLinks.filter((link) => SCROLL_SPY_HASHES.includes(link.href));
  const [activeHash, setActiveHash] = useState(dotLinks[0]?.href ?? '#home');

  // Drives the dot rail below: without this it was just a column of dots
  // that linked somewhere but never showed where "somewhere" was.
  useEffect(() => {
    const sections = dotLinks
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveHash(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: '-40% 0px -50% 0px' },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent-blue z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* Scroll-spy dot rail — highlights whichever homepage section is in view */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4">
          {dotLinks.map((link) => {
            const isActive = activeHash === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-label={`Go to ${link.name}`}
                aria-current={isActive ? 'true' : undefined}
                title={link.name}
                className="group p-2 -m-2 flex items-center justify-center"
              >
                <span
                  className={`rounded-full transition-all ${
                    isActive ? 'w-2.5 h-2.5 bg-accent-blue' : 'w-2 h-2 bg-ink/20 group-hover:bg-accent-blue group-hover:scale-150'
                  }`}
                  aria-hidden="true"
                />
              </a>
            );
          })}
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

        {/* Low-key proof line, not a section — positioning.md's PORTFOLIO
            rule allows either a modest /work-style page or "a single
            low-key line further down" instead of homepage prominence.
            /projects (kept as the URL, not a new /work page — see Phase 3
            SEO notes) holds the full delivered/demo breakdown. Wrapped in a
            bordered pill rather than left bare: unstyled, it rendered as a
            floating line of text in a large empty gap and read as a broken
            component rather than an intentional aside. */}
        <div className="max-w-xl mx-auto pb-24 px-6">
          <p className="text-center text-secondary-text text-sm rounded-2xl border border-ink/5 bg-bg-secondary/60 px-6 py-4">
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
