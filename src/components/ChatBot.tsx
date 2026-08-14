import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { trackEvent } from '../monitoring';
import { getBotReply, matchKnowledgeBase, nextMessageId, withEmailToken, type ChatMessage, type KnowledgeEntry } from '../lib/chatbot';

const BotAvatar = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => (
  <div
    className={`shrink-0 rounded-full overflow-hidden bg-ink/5 ring-1 ring-ink/10 ${size === 'lg' ? 'w-9 h-9' : 'w-6 h-6'}`}
  >
    {/* Solid-black artwork with a transparent background — invisible against
       the dark theme's near-black surfaces without inverting it there. Left
       un-inverted in light theme, where black already has contrast. */}
    <img src="/ira-mascot.png" alt="" className="w-full h-full object-contain p-1 invert light:invert-0" />
  </div>
);

const TypingBubble = () => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
    <BotAvatar />
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-ink/5 border border-ink/10 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-secondary-text animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </motion.div>
);

export const ChatBot = () => {
  const { content } = useLanguage();
  const t = content.chatbot;
  const email = content.contact.email;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Chips shown to the user (each is a real, clickable suggestion). Matching
  // against typed text checks these plus a greeting-only entry that has no
  // button of its own.
  const chipEntries = useMemo<KnowledgeEntry[]>(() => [...t.quickReplies, t.handoff], [t]);
  const matchEntries = useMemo<KnowledgeEntry[]>(
    () => [...chipEntries, { question: '', answer: t.greetingReply.answer, keywords: t.greetingReply.keywords }],
    [chipEntries, t],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) fabRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const appendBotReply = (text: string) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      setMessages((m) => [...m, { id: nextMessageId(), role: 'bot', text }]);
    }, 500 + Math.random() * 350);
  };

  const handleChipClick = (entry: KnowledgeEntry) => {
    trackEvent('chatbot_quick_reply', { question: entry.question });
    setMessages((m) => [...m, { id: nextMessageId(), role: 'user', text: entry.question }]);
    appendBotReply(withEmailToken(entry.answer, email));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;
    trackEvent('chatbot_message_sent');
    setMessages((m) => [...m, { id: nextMessageId(), role: 'user', text }]);
    setInputValue('');

    const localAnswer = matchKnowledgeBase(text, matchEntries);
    if (localAnswer) {
      appendBotReply(withEmailToken(localAnswer, email));
      return;
    }

    setIsTyping(true);
    const reply = await getBotReply(t.fallbackReply, email);
    setIsTyping(false);
    setMessages((m) => [...m, { id: nextMessageId(), role: 'bot', text: reply }]);
  };

  const toggleOpen = () => {
    setIsOpen((open) => {
      if (!open) trackEvent('chatbot_opened');
      return !open;
    });
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={fabRef}
            type="button"
            onClick={toggleOpen}
            aria-label={t.openLabel}
            aria-expanded={isOpen}
            aria-controls="chatbot-panel"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-20 right-5 sm:bottom-24 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full"
          >
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple blur-md"
              animate={{ opacity: [0.45, 0.1, 0.45], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative flex w-12 h-12 sm:w-14 sm:h-14 items-center justify-center rounded-full overflow-hidden bg-bg-secondary ring-1 ring-white/10 shadow-[0_0_20px_rgba(0,209,255,0.35)]">
              <img src="/ira-mascot.png" alt="" className="w-full h-full object-contain p-2.5 invert light:invert-0" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-panel"
            role="dialog"
            aria-labelledby="chatbot-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            // z-[60]: above the fixed Navbar's z-50 — on mobile this panel is
            // full-screen (inset-0), and at z-40 its header/close button sat
            // under the transparent navbar band and couldn't be clicked. On
            // desktop that same z-60 means the panel now paints OVER the
            // navbar wherever it geometrically overlaps it, so top-28 (the
            // site's own "clear the fixed navbar" offset, see
            // ToolRouteFallback's pt-28) pins the panel's top edge below the
            // navbar outright, instead of a height guess that only cleared it
            // on tall-enough viewports.
            // The glow echoes the hero terminal card's own ambient shadow.
            className="fixed z-[60] flex flex-col bg-bg-secondary shadow-2xl overflow-hidden inset-0 sm:inset-auto sm:top-28 sm:bottom-24 sm:right-6 sm:w-[380px] sm:max-h-[600px] sm:rounded-3xl sm:border sm:border-ink/10 sm:shadow-[0_20px_60px_-15px_rgba(0,209,255,0.25)]"
          >
            <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-ink/10">
              <div className="flex items-center gap-3 min-w-0">
                <BotAvatar size="lg" />
                <p id="chatbot-title" className="text-sm font-bold text-ink truncate">
                  {t.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t.closeLabel}
                className="shrink-0 p-1.5 rounded-lg hover:bg-ink/10 text-secondary-text transition-colors"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div
              role="log"
              aria-live="polite"
              aria-label={t.messagesLabel}
              className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                <BotAvatar />
                <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink/5 border border-ink/10 px-4 py-2.5 text-sm text-ink leading-relaxed">
                  {t.greeting}
                </p>
              </motion.div>

              {messages.map((m) =>
                m.role === 'bot' ? (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-end gap-2"
                  >
                    <BotAvatar />
                    <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink/5 border border-ink/10 px-4 py-2.5 text-sm text-ink leading-relaxed">
                      {m.text}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-end"
                  >
                    <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent-blue text-bg-pure px-4 py-2.5 text-sm leading-relaxed">
                      {m.text}
                    </p>
                  </motion.div>
                ),
              )}

              <AnimatePresence>{isTyping && <TypingBubble key="typing" />}</AnimatePresence>

              {/* Persists after every reply, not just the first — a chat
                 widget that only offers help once reads as a one-shot demo. */}
              {!isTyping && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {chipEntries.map((entry, idx) => (
                    <motion.button
                      key={entry.question}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleChipClick(entry)}
                      className="px-3 py-2 rounded-full border border-ink/10 bg-ink/5 text-xs font-medium text-ink hover:border-accent-blue hover:text-accent-blue transition-colors text-left"
                    >
                      {entry.question}
                    </motion.button>
                  ))}
                </div>
              )}

              <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 flex items-center gap-2 border-t border-ink/10 p-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.inputPlaceholder}
                aria-label={t.inputAriaLabel}
                disabled={isTyping}
                autoComplete="off"
                className="flex-1 min-w-0 bg-ink/5 border border-ink/10 rounded-full px-4 py-2.5 text-sm text-ink placeholder:text-secondary-text focus:border-accent-blue focus:outline-none transition-colors disabled:opacity-60"
              />
              <motion.button
                type="submit"
                aria-label={t.sendLabel}
                disabled={isTyping || !inputValue.trim()}
                whileTap={{ scale: 0.9 }}
                className="shrink-0 w-10 h-10 rounded-full bg-accent-blue text-bg-pure flex items-center justify-center hover:glow-blue transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} aria-hidden="true" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
