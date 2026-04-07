import { motion } from 'motion/react';
import { EXPERIENCE, PROJECTS } from '../constants';
import { Briefcase, Calendar, CheckCircle2, ExternalLink, Github, ArrowUpRight } from 'lucide-react';

export const Experience = () => {
  return (
    <section id="experience" className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">Career Journey</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Experience <span className="text-gradient">Timeline</span></h2>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-blue via-accent-purple to-transparent opacity-20" />

          <div className="space-y-12">
            {EXPERIENCE.map((exp, idx) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`relative flex flex-col md:flex-row gap-8 items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-bg-pure border-2 border-accent-blue glow-blue z-10" />

                <div className="w-full md:w-1/2 p-8 rounded-3xl glass border-white/5 hover:border-accent-blue/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-accent-blue transition-colors">{exp.company}</h3>
                        <p className="text-xs text-secondary-text font-mono uppercase tracking-widest">{exp.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-accent-purple bg-accent-purple/10 px-3 py-1 rounded-full">
                      <Calendar size={12} />
                      {exp.period}
                    </div>
                  </div>

                  <p className="text-secondary-text text-sm mb-6 leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {exp.highlights.map(h => (
                      <div key={h} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-[10px] font-mono text-white">
                        <CheckCircle2 size={10} className="text-accent-blue" />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden md:block w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const Projects = () => {
  const otherProjects = PROJECTS.filter(p => !p.featured);

  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
        >
          <div>
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Portfolio</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Key <span className="text-gradient">Projects</span></h2>
          </div>
          <p className="text-secondary-text max-w-md text-right hidden md:block">
            A selection of professional and personal projects demonstrating full-stack expertise.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherProjects.map((project, idx) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-8 rounded-3xl bg-bg-secondary border border-white/5 hover:border-accent-blue/30 transition-all flex flex-col h-full relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-colors" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:text-accent-blue transition-colors">
                    <Github size={20} />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:text-accent-blue transition-colors">
                    <ExternalLink size={20} />
                  </div>
                </div>
                <ArrowUpRight size={24} className="text-secondary-text group-hover:text-accent-blue transition-colors" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent-blue transition-colors">{project.title}</h3>
              <p className="text-secondary-text text-sm mb-8 leading-relaxed flex-grow">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-mono text-secondary-text group-hover:text-white transition-colors">
                    {tag}
                  </span>
                ))}
              </div>

              {project.metrics && (
                <div className="pt-6 border-t border-white/5 flex gap-6">
                  {project.metrics.map(m => (
                    <div key={m.label}>
                      <div className="text-lg font-bold text-white">{m.value}</div>
                      <div className="text-[10px] uppercase tracking-widest text-secondary-text font-mono">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
