import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowRight, Send } from 'lucide-react';
import { useState, useRef, useEffect, FormEvent } from 'react';
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
  const COMMANDS = hero.terminalCommands;
  const reduce = useReducedMotion();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ id: string; type: 'command' | 'response'; text: string }>>([
    { id: 'initial-1', type: 'response', text: hero.terminal.welcomeLine1 },
    { id: 'initial-2', type: 'response', text: hero.terminal.welcomeLine2 },
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Scroll the terminal container directly, not the page. scrollIntoView on
    // the ref element bubbles up to the page when the overflow-y-auto
    // container has no overflow, which pushed hero content behind the navbar.
    const terminalContainer = terminalEndRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (terminalContainer) {
      terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (document.documentElement.scrollTop === 0) {
      scrollToBottom();
    }
  }, [history]);

  const handleCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    if (cmd === 'clear') {
      setHistory([{ id: Date.now().toString(), type: 'response', text: hero.terminal.cleared }]);
    } else if (COMMANDS[cmd as keyof typeof COMMANDS]) {
      setHistory((prev) => [
        ...prev,
        { id: `${Date.now()}-cmd`, type: 'command', text: cmd },
        { id: `${Date.now()}-resp`, type: 'response', text: COMMANDS[cmd as keyof typeof COMMANDS] },
      ]);
    } else {
      setHistory((prev) => [
        ...prev,
        { id: `${Date.now()}-cmd`, type: 'command', text: cmd },
        { id: `${Date.now()}-err`, type: 'response', text: hero.terminal.notFound.replace('{cmd}', cmd) },
      ]);
    }

    setInput('');
  };

  return (
    <section
      id="home"
      className="page-light relative flex items-center pt-[72px] pb-16 sm:pb-20 lg:min-h-screen overflow-hidden"
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

        {/* The terminal used to be `hidden lg:block`, so the most
            characteristic thing on the site did not exist for the majority of
            visitors. It renders at every width now; only its height steps. */}
        <motion.div variants={rise} className="relative">
          {/* No interactive role or aria-label on the wrapper: it contains real
              focusable children (the input, the submit button) plus unrelated
              visible output text. role="button" plus a label made assistive
              tech announce "Interactive terminal" as the name while ignoring
              that text — an accessible-name/visible-text mismatch. The click
              handler is a mouse-only convenience; keyboard users tab to the
              input directly. */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="surface-raised rounded-[3px] overflow-hidden cursor-text"
          >
            <div className="flex items-center gap-3 px-4 h-10 border-b border-hairline bg-ink/[0.03]">
              <span className="font-mono text-[0.6875rem] text-secondary-text truncate min-w-0">{hero.terminal.filename}</span>
              <span className="grow shrink-0 w-2" />
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-accent-blue)_70%,transparent)]"
                />
                <span className="t-label text-[0.5625rem] text-accent-blue">Interactive</span>
              </span>
            </div>

            <div className="h-[280px] sm:h-[330px] lg:h-[390px] overflow-y-auto scrollbar-thin px-5 py-4 font-mono text-[0.8125rem] leading-[1.85]">
              <div>
                <AnimatePresence mode="popLayout" initial={false}>
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={reduce ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-2"
                    >
                      <span className={item.type === 'command' ? 'text-accent-blue' : 'text-secondary-text'}>
                        {item.type === 'command' ? '$' : '>'}
                      </span>
                      <span className={item.type === 'command' ? 'text-ink' : 'text-secondary-text'}>{item.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <form onSubmit={handleCommand} className="flex gap-2 items-center">
                  <label htmlFor="hero-terminal-input" className="text-accent-blue font-bold">
                    $
                  </label>
                  <input
                    id="hero-terminal-input"
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-transparent border-none text-ink grow font-mono p-0 py-1 min-h-6 placeholder:text-secondary-text"
                    placeholder={hero.terminal.inputPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {/* autoFocus removed: it seized focus on every page load,
                      which moved the caret away from the top of the document
                      for keyboard and screen-reader users and, on short
                      viewports, scrolled the hero out from under the nav. */}
                  <button
                    type="submit"
                    aria-label={hero.terminal.ariaSendCommand}
                    className="text-accent-blue opacity-0 focus-visible:opacity-100 hover:opacity-100 transition-opacity"
                  >
                    <Send size={14} aria-hidden="true" />
                  </button>
                </form>
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
          <p className="t-label text-[0.5625rem] text-secondary-text pt-3.5">Real commands. Not a screenshot.</p>
        </motion.div>
      </motion.div>
    </section>
  );
};
