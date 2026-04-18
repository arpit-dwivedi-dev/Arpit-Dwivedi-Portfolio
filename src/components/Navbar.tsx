import { motion } from 'motion/react';
import { Menu, X, Github, Linkedin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import metadata from '../../metadata.json';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { navLinks, contact } = metadata.content;
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-bg-pure/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link 
            to="/"
            className="text-2xl font-bold tracking-tighter flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-accent-blue rounded-lg glow-blue flex items-center justify-center text-bg-pure text-sm">AD</div>
            <span>{metadata.name.split(' ')[0]}<span className="text-accent-blue"> {metadata.name.split(' ').slice(1).join(' ')}</span></span>
          </Link>
        </motion.div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, idx) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link
                to={link.href.startsWith('#') ? `/${link.href}` : link.href}
                className="text-sm font-medium text-secondary-text hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-blue transition-all group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 ml-4"
          >
            <a href={`https://github.com/${contact.github}`} target="_blank" rel="noreferrer" className="text-secondary-text hover:text-accent-blue transition-colors"><Github size={18} /></a>
            <a href="https://www.linkedin.com/in/marpit697-ad/" target="_blank" rel="noreferrer" className="text-secondary-text hover:text-accent-blue transition-colors"><Linkedin size={18} /></a>
          </motion.div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white relative z-50" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: '100%' }}
        className="md:hidden fixed inset-0 z-40 bg-bg-pure/95 backdrop-blur-xl flex flex-col justify-center items-center gap-8 p-6"
      >
        {navLinks.map((link, idx) => (
          <motion.div
            key={link.name}
            initial={{ opacity: 0, y: 20 }}
            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={link.href.startsWith('#') ? `/${link.href}` : link.href}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-bold text-white hover:text-accent-blue transition-colors"
            >
              {link.name}
            </Link>
          </motion.div>
        ))}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-8 mt-8"
        >
          <a href={`https://github.com/${contact.github}`} target="_blank" rel="noreferrer" className="text-secondary-text hover:text-accent-blue transition-colors"><Github size={24} /></a>
          <a href="https://www.linkedin.com/in/marpit697-ad/" target="_blank" rel="noreferrer" className="text-secondary-text hover:text-accent-blue transition-colors"><Linkedin size={24} /></a>
        </motion.div>
      </motion.div>
    </nav>
  );
};
