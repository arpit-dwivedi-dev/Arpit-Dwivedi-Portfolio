import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface ProjectCardProps {
  key?: string;
  project: {
    title: string;
    description: string;
    tags: string[];
    link?: string;
    github?: string;
    metrics?: { label: string; value: string }[];
    subtitle?: string;
    featured?: boolean;
    [key: string]: any;
  };
  index: number;
}

export const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const { content } = useLanguage();
  const { projectCard } = content;
  const primaryHref = project.link || (project.github ? `https://github.com/${project.github}` : undefined);

  const details = (
    <>
      <h3 className="text-2xl font-bold text-ink mb-4 group-hover:text-accent-blue transition-colors">{project.title}</h3>
      <p className="text-secondary-text text-sm mb-8 leading-relaxed flex-grow">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {project.tags.map(tag => (
          <span key={tag} className="px-3 py-1 rounded-lg bg-ink/5 text-[10px] font-mono text-secondary-text group-hover:text-ink transition-colors">
            {tag}
          </span>
        ))}
      </div>

      {project.metrics && (
        <div className="pt-6 border-t border-ink/5 flex gap-6">
          {project.metrics.map(m => (
            <div key={m.label}>
              <div className="text-lg font-bold text-ink">{m.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-secondary-text font-mono">{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group p-8 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full relative overflow-hidden light:shadow-[0_12px_30px_-12px_rgba(24,24,27,0.18)]"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-colors" />

      <div className="flex items-center mb-6">
        <div className="flex gap-2">
          {project.github && (
            <a
              href={`https://github.com/${project.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-xl bg-ink/5 flex items-center justify-center text-ink hover:text-accent-blue transition-colors relative z-10"
              aria-label={projectCard.viewGithub}
            >
              <FaGithub size={20} />
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-xl bg-ink/5 flex items-center justify-center text-ink hover:text-accent-blue transition-colors relative z-10"
              aria-label={projectCard.viewLive}
            >
              <ExternalLink size={20} />
            </a>
          )}
        </div>
      </div>

      {primaryHref ? (
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={projectCard.viewDetails.replace('{title}', project.title)}
          className="contents"
        >
          {details}
        </a>
      ) : details}
    </motion.div>
  );
};
