import { motion } from 'motion/react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

export interface ToolCardProps {
  key?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  index?: number;
}

// Props-driven on purpose: adding tool #2 is a new entry in the tools
// registry, not a new card variant. Always opens in a new tab — the tool
// lives on its own route, this card is just an entry point.
export const ToolCard = ({ title, description, icon: Icon, href, index = 0 }: ToolCardProps) => {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group p-8 rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full relative overflow-hidden light:shadow-[0_12px_30px_-12px_rgba(24,24,27,0.18)]"
    >
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-colors" />

      <div className="flex items-start justify-between mb-6">
        <div className="bg-accent-blue/10 text-accent-blue w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon size={24} aria-hidden="true" />
        </div>
        <ArrowUpRight size={20} className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
      </div>

      <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-accent-blue transition-colors">{title}</h3>
      <p className="text-secondary-text text-sm leading-relaxed flex-grow">{description}</p>
    </motion.a>
  );
};
