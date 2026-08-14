import { motion } from 'motion/react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import metadata from '../../metadata.json';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { lang, content } = useLanguage();
  const { navLinks, contact, nav } = content;
  const homeHref = lang === 'hi' ? '/hi' : '/';
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    firstMobileLinkRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <nav aria-label="Primary" className="fixed top-0 left-0 w-full z-50">
      <div className={`transition-all duration-300 ${scrolled ? 'bg-bg-pure/80 backdrop-blur-md border-b border-ink/10 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              to={homeHref}
              className="text-2xl font-bold tracking-tighter flex items-center gap-2"
            >
              <picture>
                <source srcSet="/logo-64.webp" type="image/webp" />
                <img src="/logo-64.png" width={32} height={32} alt="101TechLabs" className="w-8 h-8 rounded-lg glow-blue" />
              </picture>
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
                   to={link.href.startsWith('#') ? `${homeHref}${link.href}` : link.href}
                  className="text-sm font-medium text-secondary-text hover:text-ink transition-colors relative group"
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
              <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" aria-label={nav.ariaLinkedin} className="p-2 -m-2 text-secondary-text hover:text-accent-blue transition-colors"><FaLinkedin size={18} /></a>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? nav.ariaSwitchToLight : nav.ariaSwitchToDark}
                className="p-2 -m-2 text-secondary-text hover:text-accent-blue transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              </button>
              <LanguageSwitcher />
            </motion.div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            aria-label={nav.ariaOpenMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className={`md:hidden text-ink relative z-50 p-2.5 -m-2.5 transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={() => setIsOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        id="mobile-menu"
        initial={false}
        animate={isOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: '100%' }}
        className="md:hidden fixed inset-0 z-40 bg-bg-pure/95 backdrop-blur-xl flex flex-col justify-center items-center gap-8 p-6 overflow-y-auto"
      >
        <button
          aria-label={nav.ariaCloseMenu}
          onClick={() => setIsOpen(false)}
          tabIndex={isOpen ? undefined : -1}
          className="absolute top-6 right-6 text-ink p-2.5 -m-2.5"
        >
          <X aria-hidden="true" />
        </button>

        {navLinks.map((link, idx) => (
          <motion.div
            key={link.name}
            initial={{ opacity: 0, y: 20 }}
            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link
               ref={idx === 0 ? firstMobileLinkRef : undefined}
               to={link.href.startsWith('#') ? `${homeHref}${link.href}` : link.href}
              onClick={() => setIsOpen(false)}
              tabIndex={isOpen ? undefined : -1}
              className="text-3xl font-bold text-ink hover:text-accent-blue transition-colors"
            >
              {link.name}
            </Link>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-8 mt-8"
        >
          <div className="flex items-center gap-8">
            <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" aria-label={nav.ariaLinkedin} tabIndex={isOpen ? undefined : -1} className="p-3 -m-3 text-secondary-text hover:text-accent-blue transition-colors"><FaLinkedin size={24} /></a>
            <button
              type="button"
              onClick={toggleTheme}
              tabIndex={isOpen ? undefined : -1}
              aria-label={theme === 'dark' ? nav.ariaSwitchToLight : nav.ariaSwitchToDark}
              className="p-3 -m-3 text-secondary-text hover:text-accent-blue transition-colors"
            >
              {theme === 'dark' ? <Sun size={24} aria-hidden="true" /> : <Moon size={24} aria-hidden="true" />}
            </button>
          </div>
          <LanguageSwitcher size="lg" tabIndex={isOpen ? undefined : -1} onNavigate={() => setIsOpen(false)} />
        </motion.div>
      </motion.div>
    </nav>
  );
};
