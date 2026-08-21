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

// The right-hand section rail was removed here, deliberately. It was the
// element on the page doing the least work: a third position indicator
// alongside the scroll progress bar and the labelled rule that now opens each
// section, and it only had room to render above 1536px — below that its
// labels landed on the hero terminal. Labelling it fixed its legibility but
// not the fact that it was telling the reader something two other things
// already said.

export const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <div className="grain relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-accent-blue z-[60] origin-left"
        style={{ scaleX }}
        aria-hidden="true"
      />

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
