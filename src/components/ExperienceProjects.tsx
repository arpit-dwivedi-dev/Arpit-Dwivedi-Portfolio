import { motion } from 'motion/react';
import { Briefcase, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import metadata from '../../metadata.json';
import { ProjectCard } from './ProjectCard';

export const Experience = () => {
  const { experience, experienceSection } = metadata.content;

  return (
    <section id="experience" className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{experienceSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{experienceSection.title} <span className="text-gradient">{experienceSection.titleAccent}</span></h2>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-blue via-accent-purple to-transparent opacity-20" />

          <div className="space-y-12">
            {experience.map((exp, idx) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`relative flex flex-col md:flex-row gap-8 items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-bg-pure border-2 border-accent-blue glow-blue z-10" />

                <div className="w-full md:w-1/2 pl-12 md:p-8 rounded-3xl glass border-white/5 hover:border-accent-blue/20 transition-all group">
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
  const { projects, projectsSection } = metadata.content;
  const otherProjects = projects.filter(p => !p.featured).slice(0, 3);

  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6 text-center md:text-left"
        >
          <div>
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{projectsSection.label}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{projectsSection.title} <span className="text-gradient">{projectsSection.titleAccent}</span></h2>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <p className="text-secondary-text max-w-sm text-right mb-4">
              {projectsSection.description}
            </p>
            <Link to="/projects" className="text-accent-blue hover:text-white transition-colors flex items-center gap-2 font-mono text-sm group">
              View All Projects <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherProjects.map((project, idx) => (
            <ProjectCard key={project.title} project={project} index={idx} />
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link 
            to="/projects" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-accent-blue font-bold hover:bg-white/5 transition-all"
          >
            View All Projects <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};
