import { motion } from 'motion/react';
import { PROJECTS } from '../constants';
import { ExternalLink, CheckCircle2, Zap, Shield, FileText } from 'lucide-react';

export const FeaturedProject = () => {
  const featured = PROJECTS.find(p => p.featured);
  if (!featured) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
        >
          <div>
            <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Flagship System</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Featured <span className="text-gradient">Project</span></h2>
          </div>
          <p className="text-secondary-text max-w-md text-right hidden md:block">
            Showcasing high-impact engineering solutions that solve real-world complex problems.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="group relative rounded-3xl overflow-hidden bg-bg-secondary border border-white/10 glow-blue/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Project Info */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{featured.title}</h3>
                  <p className="text-accent-blue font-mono text-xs uppercase tracking-widest">{featured.subtitle}</p>
                </div>
              </div>

              <p className="text-secondary-text text-lg mb-8 leading-relaxed">
                {featured.description}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {featured.metrics?.map((metric) => (
                  <div key={metric.label} className="p-4 rounded-2xl glass border-white/5 group-hover:border-accent-blue/20 transition-colors">
                    <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                    <div className="text-[10px] uppercase tracking-widest text-secondary-text font-mono">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-10">
                {featured.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-secondary-text">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-4">
                <button className="px-6 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl flex items-center gap-2 hover:glow-blue transition-all">
                  Case Study <ExternalLink size={16} />
                </button>
              </div>
            </div>

            {/* Project Visual Mockup */}
            <div className="relative bg-bg-tertiary p-8 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent opacity-50" />
              
              {/* Abstract UI Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full max-w-md aspect-[4/3] rounded-2xl glass border-white/10 shadow-2xl relative z-10 p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-12 h-3 rounded-full bg-white/10" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center text-accent-blue">
                    <Zap size={16} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                  <div className="h-4 w-1/2 bg-white/5 rounded-full" />
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="h-24 rounded-xl bg-accent-blue/5 border border-accent-blue/20 flex flex-col items-center justify-center gap-2">
                      <FileText className="text-accent-blue" size={24} />
                      <span className="text-[10px] font-mono text-accent-blue">OCR ENGINE</span>
                    </div>
                    <div className="h-24 rounded-xl bg-accent-purple/5 border border-accent-purple/20 flex flex-col items-center justify-center gap-2">
                      <Zap className="text-accent-purple" size={24} />
                      <span className="text-[10px] font-mono text-accent-purple">AI PARSER</span>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 glass rounded-full border-accent-blue text-accent-blue font-bold text-sm glow-blue">
                  99.9% OPTIMIZED
                </div>
              </motion.div>
              
              {/* Background Circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-white/5 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
