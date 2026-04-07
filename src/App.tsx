import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedProject } from './components/FeaturedProject';
import { About, TechStack } from './components/AboutTech';
import { Experience, Projects } from './components/ExperienceProjects';
import { Achievements, DevOpsArchitecture, Contact, Footer } from './components/AchievementsContact';
import { motion, useScroll, useSpring } from 'motion/react';

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent-blue z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* Scroll Indicator Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4">
        {['home', 'about', 'experience', 'projects', 'contact'].map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="w-2 h-2 rounded-full bg-white/20 hover:bg-accent-blue transition-all hover:scale-150"
            title={id.charAt(0).toUpperCase() + id.slice(1)}
          />
        ))}
      </div>

      <Navbar />
      
      <main>
        <Hero />
        <FeaturedProject />
        <About />
        <TechStack />
        <Experience />
        <Projects />
        <Achievements />
        <DevOpsArchitecture />
        <Contact />
      </main>

      <Footer />

      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>
    </div>
  );
}
