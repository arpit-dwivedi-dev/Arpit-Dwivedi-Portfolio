import { motion } from 'motion/react';
import { IMPACT_METRICS } from '../constants';
import { Shield, Zap, Server, Database, Globe, Mail, Linkedin, Github, Send, ArrowRight } from 'lucide-react';

export const Achievements = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Impact Metrics</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Real-World <span className="text-gradient">Impact</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {IMPACT_METRICS.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl glass border-white/5 hover:border-accent-blue/20 transition-all text-center group"
            >
              <div className="text-4xl font-extrabold text-white mb-2 group-hover:text-accent-blue transition-colors tracking-tighter">
                {metric.value}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-secondary-text font-mono">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const DevOpsArchitecture = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">Infrastructure</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">DevOps & <span className="text-gradient">Architecture</span></h2>
            
            <div className="space-y-6 text-lg text-secondary-text leading-relaxed">
              <p>
                I design and implement robust CI/CD pipelines and containerized environments to ensure seamless deployment and high availability.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                    <Zap size={14} />
                  </div>
                  <span className="text-sm font-medium text-white">Docker Containerization</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                    <Zap size={14} />
                  </div>
                  <span className="text-sm font-medium text-white">GitHub Actions CI/CD</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                    <Zap size={14} />
                  </div>
                  <span className="text-sm font-medium text-white">VPS Hosting & Nginx Configuration</span>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative p-8 rounded-3xl glass border-white/10 glow-blue/10 overflow-hidden"
          >
            {/* Architecture Diagram Mockup */}
            <div className="relative z-10 grid grid-cols-3 gap-4">
              <div className="col-span-3 flex justify-center mb-8">
                <div className="px-6 py-3 rounded-xl glass border-accent-blue text-accent-blue font-bold text-sm glow-blue">
                  LOAD BALANCER (NGINX)
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-white/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-white" />
                  <span className="text-[10px] font-mono text-secondary-text">NODE APP 1</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-white/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-white" />
                  <span className="text-[10px] font-mono text-secondary-text">NODE APP 2</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-white/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-white" />
                  <span className="text-[10px] font-mono text-secondary-text">NODE APP 3</span>
                </div>
              </div>

              <div className="col-span-3 flex justify-center mt-8">
                <div className="px-6 py-3 rounded-xl glass border-accent-purple text-accent-purple font-bold text-sm glow-purple">
                  MONGODB CLUSTER
                </div>
              </div>
            </div>
            
            {/* Connecting Lines (Abstract) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-white/10 rounded-full animate-spin-slow" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const Contact = () => {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Get in Touch</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Let's build something <span className="text-gradient">impactful</span></h2>
            
            <p className="text-lg text-secondary-text mb-12 leading-relaxed">
              I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
            </p>

            <div className="space-y-6">
              <a href="mailto:arp.d@pm.me" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">Email</div>
                  <div className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors">arp.d@pm.me</div>
                </div>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Linkedin size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">LinkedIn</div>
                  <div className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors">Arpit Dwivedi</div>
                </div>
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Github size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">GitHub</div>
                  <div className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors">arpit-dwivedi</div>
                </div>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl glass border-white/10 glow-blue/5"
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-secondary-text uppercase tracking-widest">Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="Your Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-secondary-text uppercase tracking-widest">Email</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="your@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-secondary-text uppercase tracking-widest">Message</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="Tell me about your project..." />
              </div>
              <button className="w-full py-4 bg-accent-blue text-bg-pure font-bold rounded-xl flex items-center justify-center gap-2 hover:glow-blue transition-all group">
                Send Message
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-white/5 bg-bg-pure">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xl font-bold tracking-tighter">
          ARPIT<span className="text-accent-blue">.</span>
        </div>
        <div className="text-secondary-text text-sm font-mono">
          © {new Date().getFullYear()} Arpit Dwivedi. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <a href="#home" className="text-secondary-text hover:text-white transition-colors text-sm">Home</a>
          <a href="#about" className="text-secondary-text hover:text-white transition-colors text-sm">About</a>
          <a href="#projects" className="text-secondary-text hover:text-white transition-colors text-sm">Projects</a>
        </div>
      </div>
    </footer>
  );
};
