import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { HomeJsonLd } from '../components/seo/HomeJsonLd';
import { Hero } from '../components/Hero';
import { NowNext } from '../components/NowNext';
import { FreeTools } from '../components/FreeToolsShowcase';
import { About } from '../components/AboutTech';
import { Team, Process } from '../components/TeamProcess';
import { WhyChooseUs, FAQ } from '../components/TrustSections';
import { Services } from '../components/ExperienceProjects';
import { DevOpsArchitecture, Contact, Footer } from '../components/AchievementsContact';

// The dot rail's own list, no longer derived from navLinks. It used to filter
// the nav by a hash allow-list, which meant the rail silently lost entries
// whenever the nav changed — and the nav no longer carries #home or #contact
// at all. These are the homepage's real section anchors, in page order.
const RAIL_SECTIONS = [
  { id: 'home', label: 'Top' },
  { id: 'next', label: 'Now / Next' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Services' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

export const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const [activeId, setActiveId] = useState(RAIL_SECTIONS[0].id);

  useEffect(() => {
    const sections = RAIL_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -50% 0px' },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-accent-blue z-[60] origin-left"
        style={{ scaleX }}
        aria-hidden="true"
      />

      {/* Section rail. This was an unlabelled column of near-invisible dots —
          it told you a position you already knew and never said what it
          pointed at. It now carries the section name at all times (there is
          room for it at xl and up, which is the only width it renders at),
          and the active row is the one thing in it drawn in the accent. */}
      <nav
        aria-label="Sections"
        // 2xl, not xl: the content column maxes out at 1280px, so at 1440 the
        // margin beside it is 80px and the labelled rail landed on top of the
        // hero terminal. It only has room from 1536px up.
        className="fixed right-10 top-1/2 -translate-y-1/2 z-40 hidden 2xl:block"
      >
        <ul className="list-none flex flex-col gap-1">
          {RAIL_SECTIONS.map((section) => {
            const isActive = activeId === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className="group flex items-center justify-end gap-3 py-1.5"
                >
                  <span
                    className={`t-label text-[0.5625rem] transition-colors ${
                      isActive ? 'text-accent-blue' : 'text-secondary-text group-hover:text-secondary-text'
                    }`}
                  >
                    {section.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-px transition-all ${
                      isActive ? 'w-6 bg-accent-blue' : 'w-3 bg-secondary-text/30 group-hover:w-5 group-hover:bg-secondary-text'
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <Navbar />
      <HomeJsonLd />

      <main id="main-content">
        <Hero />
        <NowNext />
        <FreeTools />
        <About />
        <Services />
        <WhyChooseUs />
        <Team />
        <DevOpsArchitecture />
        <Process />
        <FAQ />
        <Contact />
      </main>

      <Footer />
    </div>
  );
};
