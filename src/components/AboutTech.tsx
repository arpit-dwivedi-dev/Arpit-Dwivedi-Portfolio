import { motion } from 'motion/react';
import { TECH_STACK } from '../constants';
import { Code2, Database, Layout, Server, ShieldCheck, Zap } from 'lucide-react';

export const About = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-accent-purple font-mono text-sm tracking-widest uppercase mb-2 block">Engineering Mindset</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">About <span className="text-gradient">Me</span></h2>
          
          <div className="space-y-6 text-lg text-secondary-text leading-relaxed">
            <p>
              I am a <span className="text-white font-medium">Experienced Full-Stack Developer</span> building scalable systems and AI-powered solutions. My approach combines deep technical expertise with a product-focused mindset.
            </p>
            <p>
              I specialize in the <span className="text-white font-medium">MEAN Stack</span>, architecting distributed systems that handle complex data workflows. From optimizing PDF processing for healthcare to building enterprise-grade HRMS systems, I thrive on solving high-stakes engineering challenges.
            </p>
            <p>
              My leadership experience in Agile teams allows me to bridge the gap between technical architecture and business impact, ensuring every line of code delivers real value.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                <Zap size={20} />
              </div>
              <span className="text-sm font-medium text-white">Performance Tuning</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                <ShieldCheck size={20} />
              </div>
              <span className="text-sm font-medium text-white">System Security</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                <Server size={20} />
              </div>
              <span className="text-sm font-medium text-white">Microservices</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                <Layout size={20} />
              </div>
              <span className="text-sm font-medium text-white">UI/UX Excellence</span>
            </div>
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
                <div className="text-4xl font-bold text-white tracking-tighter">AD<span className="text-accent-blue">.</span></div>
                <div className="px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-secondary-text">EST. 2021</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                    <Code2 size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Full-Stack Architecture</div>
                    <div className="text-xs text-secondary-text">Scalable & Maintainable</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                    <Zap size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">AI Integration</div>
                    <div className="text-xs text-secondary-text">OpenAI & LLM Workflows</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl glass border-accent-blue/20">
                <div className="text-[10px] font-mono text-accent-blue uppercase tracking-widest mb-2">Location</div>
                <div className="text-sm font-medium text-white">India (Remote/Onsite)</div>
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
  const categories = [
    { name: 'Frontend', icon: Layout, skills: TECH_STACK.frontend, color: 'accent-blue' },
    { name: 'Backend', icon: Server, skills: TECH_STACK.backend, color: 'accent-purple' },
    { name: 'Database', icon: Database, skills: TECH_STACK.database, color: 'accent-blue' },
    { name: 'DevOps', icon: Zap, skills: TECH_STACK.devops, color: 'accent-purple' },
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
          <span className="text-accent-blue font-mono text-sm tracking-widest uppercase mb-2 block">Technical Arsenal</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Tech <span className="text-gradient">Stack</span></h2>
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
