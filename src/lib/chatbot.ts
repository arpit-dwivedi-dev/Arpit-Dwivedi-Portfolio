export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export interface KnowledgeEntry {
  question: string;
  answer: string;
  keywords: string[];
}

const withEmail = (template: string, email: string) => template.replace('{email}', email);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word-boundary match, not substring — a plain `.includes('ai')` would also
// fire on "email" or "maintain". Multi-word keywords (e.g. "how much") get
// the same treatment via \s+ so extra whitespace still matches.
const keywordHits = (text: string, keywords: string[]) => {
  const lower = text.toLowerCase();
  return keywords.some((k) => new RegExp(`\\b${escapeRegex(k.toLowerCase()).replace(/\s+/g, '\\s+')}\\b`, 'i').test(lower));
};

// Instant, free, no-network answer for anything that matches an existing
// FAQ/topic — checked before the real API seam below so common questions
// never wait on a round trip once one exists.
export const matchKnowledgeBase = (text: string, entries: KnowledgeEntry[]): string | null => {
  const hit = entries.find((entry) => keywordHits(text, entry.keywords));
  return hit ? hit.answer : null;
};

// The only place a real backend needs to plug in later: swap this body for
// a fetch() to the chat API and keep the ChatMessage/role contract as-is —
// every caller below already treats replies as async.
export const getBotReply = async (fallbackReply: string, email: string): Promise<string> => {
  return withEmail(fallbackReply, email);
};

export const withEmailToken = withEmail;

export const nextMessageId = (() => {
  let n = 0;
  return () => `msg-${++n}`;
})();
