import { motion } from 'motion/react';
import { Code2, Database, Layout, Server, ShieldCheck, Zap } from 'lucide-react';
import metadata from '../../metadata.json';

export const About = () => {
  const { about } = metadata.content;

  const icons = [Zap, ShieldCheck, Server, Layout];

  return (
    <section id="about" className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">{about.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8">{about.title} <span className="text-gradient">{about.titleAccent}</span></h2>
          
          <div className="space-y-6 text-base md:text-lg text-secondary-text leading-relaxed">
            {about.paragraphs.map((p) => (
              <p key={p} dangerouslySetInnerHTML={{ __html: p.replaceAll(/MEAN Stack|Experience Full-Stack Developer/g, match => `<span class="text-white font-medium">${match}</span>`) }} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12">
            {about.features.map((feature, i) => {
              const Icon = icons[i % icons.length];
              const color = i % 2 === 0 ? 'accent-blue' : 'accent-purple';
              return (
                <div key={feature} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center text-${color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium text-white">{feature}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="w-full aspect-square rounded-3xl overflow-hidden glass p-4 glow-purple/20">
            <div className="w-full h-full rounded-2xl bg-bg-tertiary p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="text-4xl font-bold text-white tracking-tighter">ARPIT <span className="text-accent-blue">DWIVEDI</span></div>
                <div className="px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-secondary-text">{about.card.est}</div>
              </div>
              
              <div className="space-y-4">
                {about.card.expertise.map((item, i) => {
                  const Icon = i === 0 ? Code2 : Zap;
                  const color = i === 0 ? 'accent-blue' : 'accent-purple';
                  return (
                    <div key={item.title} className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <div className="text-xs text-secondary-text">{item.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl glass border-accent-blue/20">
                <div className="text-[10px] font-mono text-accent-blue uppercase tracking-widest mb-2">{about.card.locationLabel}</div>
                <div className="text-sm font-medium text-white">{about.card.location}</div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent-blue/20 rounded-full blur-3xl" />
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-accent-purple/20 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

export const TechStack = () => {
  const { techStack, techStackSection } = metadata.content;
  
  const categories = [
    { name: techStackSection.categories.frontend, icon: Layout, skills: techStack.frontend, color: 'accent-blue' },
    { name: techStackSection.categories.backend, icon: Server, skills: techStack.backend, color: 'accent-purple' },
    { name: techStackSection.categories.database, icon: Database, skills: techStack.database, color: 'accent-blue' },
    { name: techStackSection.categories.devops, icon: Zap, skills: techStack.devops, color: 'accent-purple' },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">{techStackSection.label}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{techStackSection.title} <span className="text-gradient">{techStackSection.titleAccent}</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-3xl glass border-white/5 hover:border-white/20 transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-${cat.color}/10 flex items-center justify-center text-${cat.color} mb-6 group-hover:scale-110 transition-transform`}>
                <cat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-6">{cat.name}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-mono text-secondary-text hover:text-white hover:bg-white/10 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
