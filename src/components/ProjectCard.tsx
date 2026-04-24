import { motion } from 'motion/react';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import React, { KeyboardEvent } from 'react';

interface ProjectCardProps {
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

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const handleClick = () => {
    if (project.link) {
      window.open(project.link, '_blank');
    } else if (project.github) {
      window.open(`https://github.com/${project.github}`, '_blank');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="group p-8 rounded-3xl bg-bg-secondary border border-white/5 hover:border-accent-blue/30 transition-all flex flex-col h-full relative overflow-hidden cursor-pointer"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-colors" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {project.github && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); window.open(`https://github.com/${project.github}`, '_blank'); }}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation(); 
                  window.open(`https://github.com/${project.github}`, '_blank'); 
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:text-accent-blue transition-colors relative z-10"
              aria-label="View Github Repository"
            >
              <FaGithub size={20} />
            </button>
          )}
          {project.link && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); window.open(project.link, '_blank'); }}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation(); 
                  window.open(project.link, '_blank'); 
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:text-accent-blue transition-colors relative z-10"
              aria-label="View Live Project"
            >
              <ExternalLink size={20} />
            </button>
          )}
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
  );
};
