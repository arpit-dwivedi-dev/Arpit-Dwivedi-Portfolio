import type { InvoiceData, InvoiceTemplateDefaults } from './types';

// Versioned keys — bumping the suffix (not migrating in place) is deliberate:
// this tool has no backend to run a migration against, so a shape change
// just starts a fresh history rather than risk crashing on old records.
const HISTORY_KEY = '101tl_invoice_history_v1';
const TEMPLATE_KEY = '101tl_invoice_template_v1';

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private browsing) — the in-memory editor
    // state still works, it just won't persist across reloads.
  }
};

export const listInvoices = (): InvoiceData[] =>
  readJson<InvoiceData[]>(HISTORY_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);

export const getInvoice = (id: string): InvoiceData | undefined =>
  listInvoices().find((invoice) => invoice.id === id);

export const saveInvoice = (invoice: InvoiceData): void => {
  const all = readJson<InvoiceData[]>(HISTORY_KEY, []);
  const idx = all.findIndex((existing) => existing.id === invoice.id);
  if (idx >= 0) all[idx] = invoice;
  else all.push(invoice);
  writeJson(HISTORY_KEY, all);
};

export const deleteInvoice = (id: string): void => {
  const all = readJson<InvoiceData[]>(HISTORY_KEY, []).filter((invoice) => invoice.id !== id);
  writeJson(HISTORY_KEY, all);
};

export const clearAllInvoices = (): void => writeJson(HISTORY_KEY, []);

export const getTemplateDefaults = (): InvoiceTemplateDefaults | undefined =>
  readJson<InvoiceTemplateDefaults | undefined>(TEMPLATE_KEY, undefined);

export const saveTemplateDefaults = (defaults: InvoiceTemplateDefaults): void => writeJson(TEMPLATE_KEY, defaults);
