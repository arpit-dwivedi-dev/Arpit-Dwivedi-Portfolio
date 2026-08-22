import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// One orchestrated arrival rather than a handful of independent fades. The
// container only carries timing; each child declares its own travel.
const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.085, delayChildren: 0.04 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] as const } },
};
// The h1 is the LCP element, so it travels WITHOUT opacity: animating it from
// 0 keeps the largest text on the page unpainted until the motion library has
// hydrated and run, which showed up as multi-second "element render delay" in
// field data. A transform costs nothing in LCP terms.
const riseOpaque = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] as const } },
};

export const Hero = () => {
  const { content } = useLanguage();
  const { hero } = content;
  const reduce = useReducedMotion();

  return (
    <section
      id="home"
      className="page-light relative flex items-center pt-[72px] pb-16 sm:pb-20 lg:pt-32 lg:pb-28 overflow-hidden"
    >
      <motion.div
        variants={group}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="max-w-7xl w-full mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center pt-10 lg:pt-0"
      >
        <div className="flex flex-col">
          <motion.p variants={rise} className="t-label text-secondary-text pb-6">
            {hero.badge}
          </motion.p>

          <motion.h1 variants={riseOpaque} className="t-dxl text-ink pb-6 max-w-[18ch] text-balance">
            {hero.title} {hero.titleAccent}
          </motion.h1>

          <motion.p
            variants={rise}
            className="text-base sm:text-lg text-secondary-text leading-relaxed max-w-[44ch] pb-9"
          >
            {hero.subtitle}
          </motion.p>

          {/* Single CTA on purpose — the second hero button used to point at
              /projects, and portfolio proof is deliberately demoted out of
              hero-level prominence. hero.buttons.projects is unused. */}
          <motion.div variants={rise}>
            <a
              href="#contact"
              className="group inline-flex items-center justify-center gap-2.5 h-13 px-7 bg-ink text-bg-pure font-semibold rounded-[3px] hover:bg-accent-blue transition-colors"
            >
              {hero.buttons.contact}
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </a>
          </motion.div>
        </div>

        <motion.div variants={rise} className="relative">
          <img
            src="/hero.svg"
            alt="Animated isometric illustration of a software ecosystem: smart city, AI engine, global network, robotic production line and real-world logistics map"
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
