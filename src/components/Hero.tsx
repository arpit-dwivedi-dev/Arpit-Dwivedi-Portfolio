import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowRight, Terminal as TerminalIcon, Send } from 'lucide-react';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { useLanguage } from '../i18n/LanguageContext';


export const Hero = () => {
  const { content } = useLanguage();
  const { hero } = content;
  const COMMANDS = hero.terminalCommands;
  const shouldReduceMotion = useReducedMotion();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ id: string, type: 'command' | 'response', text: string }>>([
    { id: 'initial-1', type: 'response', text: hero.terminal.welcomeLine1 },
    { id: 'initial-2', type: 'response', text: hero.terminal.welcomeLine2 }
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Scroll the terminal container directly, not the page.
    // scrollIntoView on the ref element bubbles up to the page
    // when the overflow-y-auto container has no overflow,
    // causing unwanted page scroll that hides hero content behind the navbar.
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
    const commandId = Date.now().toString();
  if (cmd === 'clear') {
    // clear command resets history to a single response entry
    setHistory([{ id: Date.now().toString(), type: 'response', text: hero.terminal.cleared }]);
  } else if (COMMANDS[cmd as keyof typeof COMMANDS]) {
    setHistory(prev => [...prev, { id: Date.now().toString() + '-resp', type: 'response', text: COMMANDS[cmd as keyof typeof COMMANDS] }]);
  } else {
    setHistory(prev => [...prev, { id: Date.now().toString() + '-err', type: 'response', text: hero.terminal.notFound.replace('{cmd}', cmd) }]);
  }

    setInput('');
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          // No opacity in the initial/animate keyframes here on purpose: this block
          // contains the LCP element (the h1). Animating opacity 0 -> 1 keeps it
          // unpainted until framer-motion's JS hydrates and runs, which was showing
          // up as a multi-second "element render delay" in Lighthouse/CrUX. The
          // slide-in (x) is kept since a transform doesn't hide the element from LCP.
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left flex flex-col items-center lg:items-start"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] md:text-xs font-mono text-accent-blue mb-6">
            <span className="w-2 h-2 bg-accent-blue rounded-full animate-ping" />
            {hero.badge}
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 whitespace-pre-line">
            {hero.title} <span className="text-gradient">{hero.titleAccent}</span>
          </h1>
          
          <p className="text-base md:text-xl text-secondary-text max-w-xl mb-10 leading-relaxed">
            {hero.subtitle}
          </p>

          {/* Hero stat tiles ("2 Client Projects Delivered", "Serving Clients Worldwide")
              were removed 2026-08-12: the project count reads better as plain copy on
              /projects than as a headline metric, and "Serving Clients Worldwide" was
              flatly false — both real clients are India-based. See positioning.md. */}

          {/* Single CTA on purpose: the second hero button used to link to /projects,
              but portfolio proof is being demoted out of hero-level prominence per
              positioning.md's PORTFOLIO rule. hero.buttons.projects is unused now —
              left in content data rather than touched, since removing it would force
              a matching edit in the frozen hi.ts (see content-rewrite project notes). */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="px-8 py-4 bg-ink text-bg-pure font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-accent-blue hover:text-bg-pure transition-all group"
            >
              {hero.buttons.contact}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative hidden lg:block"
        >
          {/* Futuristic Terminal/Dashboard Mockup */}
          {/* No interactive role/aria-label here on purpose: this div contains real
              focusable children (the input, the submit button) plus a lot of unrelated
              visible terminal-output text. Giving the wrapper role="button" + an
              aria-label made assistive tech announce "Interactive terminal" as its name
              while ignoring all that inner text (an accessible-name/visible-text mismatch,
              flagged by axe's label-content-name-mismatch rule). onClick here is a mouse-only
              convenience — keyboard/AT users tab directly to the real input below. */}
          <div
            onClick={focusInput}
            className="w-full h-[400px] rounded-2xl glass p-1 glow-blue relative overflow-hidden group border border-ink/10 cursor-text focus:outline-none focus:border-accent-blue/50 text-left block"
          >
            <div className="absolute top-0 left-0 w-full h-8 bg-ink/5 border-b border-ink/10 flex items-center px-4 gap-2 z-20">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <div className="ml-4 text-[10px] font-mono text-secondary-text">{hero.terminal.filename}</div>
            </div>
            
            <div className="h-full pt-10 pb-4 px-6 font-mono text-sm overflow-y-auto scrollbar-hide">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2"
                    >
                      <span className={item.type === 'command' ? 'text-accent-blue' : 'text-secondary-text'}>
                        {item.type === 'command' ? '$' : '>'}
                      </span>
                      <span className={item.type === 'command' ? 'text-ink' : 'text-yellow-400/90 light:text-amber-700'}>
                        {item.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <form onSubmit={handleCommand} className="flex gap-2 items-center">
                  <span className="text-accent-blue font-bold">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-transparent border-none outline-none text-ink flex-grow font-mono focus:ring-0 p-0 py-1 min-h-6"
                    placeholder={hero.terminal.inputPlaceholder}
                    autoFocus
                  />
                  <button type="submit" aria-label={hero.terminal.ariaSendCommand} className="text-accent-blue opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
                    <Send size={14} />
                  </button>
                </form>
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Overlay Dashboard Elements */}
            <div className="absolute bottom-4 right-4 w-32 h-20 glass rounded-lg p-2 flex flex-col justify-between border-accent-blue/30 pointer-events-none opacity-50">
              <div className="text-[8px] font-mono text-accent-blue uppercase tracking-tighter">{hero.terminal.systemLoad}</div>
              <div className="flex items-end gap-1 h-8">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={`load-bar-${h}-${i}`} className="flex-1 bg-accent-blue/50 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-24 h-24 glass rounded-2xl flex items-center justify-center glow-purple border-accent-purple/30"
          >
            <TerminalIcon className="text-accent-purple" size={32} aria-hidden="true" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
