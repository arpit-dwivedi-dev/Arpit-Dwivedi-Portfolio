import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Terminal as TerminalIcon, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import metadata from '../../metadata.json';

const COMMANDS = {
  about: "I am a Full-Stack Developer building scalable systems and AI-powered solutions. Architecting future-proof applications is my mission.",
  skills: "Stack: Angular, React, Node.js, Express, MongoDB, TypeScript, AI/LLMs, Docker, AWS.",
  projects: "Featured: Flagship OCR Engine. Other: QME Panel, HRMS System, NGO Platform.",
  contact: "Email: arp.d@pm.me | GitHub: @marpit697 | LinkedIn: Arpit Dwivedi",
  whoami: "Role: Senior Full-Stack Specialist / AI Integrator.",
  location: "Current Basis: India (Remote Global Availability).",
  help: "Available commands: [about, skills, projects, contact, whoami, location, clear, exit]",
  exit: "Safe mode engaged. To restart, refresh your terminal session.",
};

export const Hero = () => {
  const { hero } = metadata.content;
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ id: string, type: 'command' | 'response', text: string }[]>([
    { id: 'initial-1', type: 'response', text: 'Welcome to Arpit Terminal v2.0.0' },
    { id: 'initial-2', type: 'response', text: 'Type "help" to see available commands.' }
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const commandId = Date.now().toString();
    const newHistory = [...history, { id: commandId, type: 'command' as const, text: input }];

    if (cmd === 'clear') {
      setHistory([{ id: Date.now().toString(), type: 'response', text: 'Terminal cleared.' }]);
    } else if (COMMANDS[cmd as keyof typeof COMMANDS]) {
      newHistory.push({ id: Date.now().toString() + '-resp', type: 'response', text: COMMANDS[cmd as keyof typeof COMMANDS] });
      setHistory(newHistory);
    } else {
      newHistory.push({ id: Date.now().toString() + '-err', type: 'response', text: `Command not found: ${cmd}. Type "help" for a list of commands.` });
      setHistory(newHistory);
    }

    setInput('');
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleTerminalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      focusInput();
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left flex flex-col items-center lg:items-start"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] md:text-xs font-mono text-accent-blue mb-6">
            <span className="w-2 h-2 bg-accent-blue rounded-full animate-ping" />
            {hero.badge}
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            {hero.title} <span className="text-gradient">{hero.titleAccent}</span>
          </h1>
          
          <p className="text-base md:text-xl text-secondary-text max-w-xl mb-10 leading-relaxed">
            {hero.subtitle}
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            {hero.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 px-4 py-2 rounded-xl glass">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-secondary-text font-mono">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/projects" 
              className="px-8 py-4 bg-white text-bg-pure font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-accent-blue hover:text-bg-pure transition-all group"
            >
              {hero.buttons.projects}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#contact" 
              className="px-8 py-4 glass text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              {hero.buttons.contact}
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
          <button 
            type="button"
            onClick={focusInput}
            onKeyDown={handleTerminalKeyDown}
            aria-label="Interactive terminal"
            className="w-full h-[400px] rounded-2xl glass p-1 glow-blue relative overflow-hidden group border border-white/10 cursor-text focus:outline-none focus:border-accent-blue/50 text-left block"
          >
            <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2 z-20">
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
                      <span className={item.type === 'command' ? 'text-white' : 'text-yellow-400/90'}>
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
                    className="bg-transparent border-none outline-none text-white flex-grow font-mono focus:ring-0 p-0"
                    placeholder="Type command..."
                    autoFocus
                  />
                  <button type="submit" className="text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
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
          </button>
          
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-24 h-24 glass rounded-2xl flex items-center justify-center glow-purple border-accent-purple/30"
          >
            <TerminalIcon className="text-accent-purple" size={32} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
