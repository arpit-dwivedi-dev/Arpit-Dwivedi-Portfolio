import { motion } from 'motion/react';
import { Shield, Zap, Server, Database, Globe, Mail, Linkedin, Github, Send, ArrowRight } from 'lucide-react';
import metadata from '../../metadata.json';

export const Achievements = () => {
  const { impactMetrics, achievementsSection } = metadata.content;

  return (
    <section className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{achievementsSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{achievementsSection.title} <span className="text-gradient">{achievementsSection.titleAccent}</span></h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {impactMetrics.map((metric, idx) => (
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
  const { devops } = metadata.content;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{devops.label}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8">{devops.title} <span className="text-gradient">{devops.titleAccent}</span></h2>
            
            <div className="space-y-6 text-base md:text-lg text-secondary-text leading-relaxed">
              <p>
                {devops.description}
              </p>
              <ul className="space-y-4">
                {devops.list.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full bg-accent-${idx % 2 === 0 ? 'blue' : 'purple'}/10 flex items-center justify-center text-accent-${idx % 2 === 0 ? 'blue' : 'purple'}`}>
                      <Zap size={14} />
                    </div>
                    <span className="text-sm font-medium text-white">{item}</span>
                  </li>
                ))}
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
                  {metadata.content.architecture.loadBalancer}
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-white/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-white" />
                  <span className="text-[10px] font-mono text-secondary-text">{metadata.content.architecture.nodeApp} 1</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-white/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-white" />
                  <span className="text-[10px] font-mono text-secondary-text">{metadata.content.architecture.nodeApp} 2</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-4 rounded-xl glass border-white/10 flex flex-col items-center gap-2">
                  <Server size={24} className="text-white" />
                  <span className="text-[10px] font-mono text-secondary-text">{metadata.content.architecture.nodeApp} 3</span>
                </div>
              </div>

              <div className="col-span-3 flex justify-center mt-8">
                <div className="px-6 py-3 rounded-xl glass border-accent-purple text-accent-purple font-bold text-sm glow-purple">
                  {metadata.content.architecture.database}
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
  const { contact } = metadata.content;

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left"
          >
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{contact.label}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8">{contact.title} <span className="text-gradient">{contact.titleAccent}</span></h2>
            
            <p className="text-base md:text-lg text-secondary-text mb-12 leading-relaxed">
              {contact.description}
            </p>

            <div className="space-y-6 flex flex-col items-center lg:items-start">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group w-full max-w-sm lg:max-w-none">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.email}</div>
                  <div className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors">{contact.email}</div>
                </div>
              </a>
              <a href={`https://linkedin.com/in/${contact.linkedin.replace(/\s+/g, '-').toLowerCase()}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Linkedin size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">LinkedIn</div>
                  <div className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors">{contact.linkedin}</div>
                </div>
              </a>
              <a href={`https://github.com/${contact.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-accent-blue group-hover:text-bg-pure transition-all">
                  <Github size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono text-secondary-text uppercase tracking-widest">GitHub</div>
                  <div className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors">{contact.github}</div>
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
                  <label className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.name}</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder={`Your ${contact.form.name}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.email}</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="your@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-secondary-text uppercase tracking-widest">{contact.form.message}</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="Tell me about your project..." />
              </div>
              <button className="w-full py-4 bg-accent-blue text-bg-pure font-bold rounded-xl flex items-center justify-center gap-2 hover:glow-blue transition-all group">
                {contact.form.button}
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
  const { navLinks, footer } = metadata.content;

  return (
    <footer className="py-12 border-t border-white/5 bg-bg-pure">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xl font-bold tracking-tighter">
          {metadata.name.split(' ')[0]}<span className="text-accent-blue">.</span>
        </div>
        <div className="text-secondary-text text-sm font-mono">
          © {new Date().getFullYear()} {metadata.name}. {footer.rights}
        </div>
        <div className="flex items-center gap-6">
          {navLinks.slice(0, 3).map(link => (
            <a key={link.name} href={link.href} className="text-secondary-text hover:text-white transition-colors text-sm">{link.name}</a>
          ))}
        </div>
      </div>
    </footer>
  );
};
