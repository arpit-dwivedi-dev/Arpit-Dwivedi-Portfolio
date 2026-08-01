import { motion } from 'motion/react';
import { Layout, Calendar, Zap, Search, Brain, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { ProjectCard } from './ProjectCard';

const serviceIcons = [Layout, Calendar, Zap, Search, Brain];
const serviceColors = ['accent-blue', 'accent-purple', 'accent-blue', 'accent-purple', 'accent-blue'];
const serviceClassMap: Record<string, string> = {
  'accent-blue': 'bg-accent-blue/10 text-accent-blue',
  'accent-purple': 'bg-accent-purple/10 text-accent-purple',
};

export const Services = () => {
  const { content } = useLanguage();
  const { services, servicesSection } = content;

  return (
    <section id="experience" className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{servicesSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{servicesSection.title} <span className="text-gradient">{servicesSection.titleAccent}</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => {
            const Icon = serviceIcons[idx % serviceIcons.length];
            const color = serviceColors[idx % serviceColors.length];
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-3xl glass border-ink/5 hover:border-accent-blue/20 transition-all group"
              >
                <div className={`${serviceClassMap[color]} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-accent-blue transition-colors">{service.title}</h3>
                <p className="text-secondary-text text-sm mb-6 leading-relaxed">{service.description}</p>
                <ul className="flex flex-wrap gap-2 list-none">
                  {service.highlights.map(h => (
                    <li key={h} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ink/5 text-[10px] font-mono text-ink">
                      <CheckCircle2 size={10} className="text-accent-blue" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const Projects = () => {
  const { lang, content } = useLanguage();
  const { projects, projectsSection } = content;
  const otherProjects = projects.slice(0, 3);
  const projectsHref = lang === 'hi' ? '/hi/projects' : '/projects';

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
            <Link to={projectsHref} className="text-accent-blue hover:text-ink transition-colors flex items-center gap-2 font-mono text-sm group">
              {projectsSection.viewAll} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
            to={projectsHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-accent-blue font-bold hover:bg-ink/5 transition-all"
          >
            {projectsSection.viewAll} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};
