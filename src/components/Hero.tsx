import { motion } from 'motion/react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import metadata from '../../metadata.json';

export const Hero = () => {
  const { hero } = metadata.content;

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
            {hero.stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-1 px-4 py-2 rounded-xl glass">
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
          <div className="w-full aspect-video rounded-2xl glass p-1 glow-blue relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <div className="ml-4 text-[10px] font-mono text-secondary-text">{hero.terminal.filename}</div>
            </div>
            <div className="mt-8 p-6 font-mono text-sm space-y-2">
              <div className="flex gap-2">
                <span className="text-accent-purple">const</span>
                <span className="text-accent-blue">developer</span>
                <span className="text-white">=</span>
                <span className="text-white">{"{"}</span>
              </div>
              <div className="pl-4 flex gap-2">
                <span className="text-secondary-text">name:</span>
                <span className="text-yellow-400">'{hero.terminal.code.name}'</span>,
              </div>
              <div className="pl-4 flex gap-2">
                <span className="text-secondary-text">role:</span>
                <span className="text-yellow-400">'{hero.terminal.code.role}'</span>,
              </div>
              <div className="pl-4 flex gap-2">
                <span className="text-secondary-text">stack:</span>
                <span className="text-white">[{hero.terminal.code.stack.map(s => `'${s}'`).join(', ')}]</span>,
              </div>
              <div className="pl-4 flex gap-2">
                <span className="text-secondary-text">mission:</span>
                <span className="text-yellow-400">'{hero.terminal.code.mission}'</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">{"}"}</span>;
              </div>
              <div className="mt-6 flex gap-2 animate-pulse">
                <span className="text-accent-blue font-bold tracking-widest">_</span>
              </div>
            </div>
            
            {/* Overlay Dashboard Elements */}
            <div className="absolute bottom-4 right-4 w-32 h-20 glass rounded-lg p-2 flex flex-col justify-between border-accent-blue/30">
              <div className="text-[8px] font-mono text-accent-blue uppercase tracking-tighter">{hero.terminal.systemLoad}</div>
              <div className="flex items-end gap-1 h-8">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 bg-accent-blue/50 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-24 h-24 glass rounded-2xl flex items-center justify-center glow-purple border-accent-purple/30"
          >
            <Terminal className="text-accent-purple" size={32} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
