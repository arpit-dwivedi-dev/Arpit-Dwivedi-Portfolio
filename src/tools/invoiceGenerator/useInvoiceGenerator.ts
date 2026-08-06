import { useCallback, useMemo, useState } from 'react';
import type { InvoiceData, InvoiceLineItem } from './types';
import { getTemplateDefaults, saveInvoice, saveTemplateDefaults } from './storage';

const makeId = () => `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const blankItem = (): InvoiceLineItem => ({ id: makeId(), description: '', quantity: 1, rate: 0 });

const todayIso = () => new Date().toISOString().slice(0, 10);

export const createBlankInvoice = (): InvoiceData => {
  const defaults = getTemplateDefaults();
  return {
    id: makeId(),
    invoiceTitle: 'Invoice',
    invoiceNumber: '1',
    logoDataUrl: defaults?.logoDataUrl,
    fromAddress: defaults?.fromAddress ?? '',
    billTo: '',
    shipTo: '',
    date: todayIso(),
    paymentTerms: '',
    dueDate: '',
    poNumber: '',
    items: [blankItem()],
    notes: defaults?.notes ?? '',
    terms: defaults?.terms ?? '',
    taxPercent: 0,
    discountEnabled: false,
    discountPercent: 0,
    shippingEnabled: false,
    shippingAmount: 0,
    currency: defaults?.currency ?? 'INR',
    amountPaid: 0,
    updatedAt: Date.now(),
  };
};

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  balanceDue: number;
}

export const computeTotals = (invoice: InvoiceData): InvoiceTotals => {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const discountAmount = invoice.discountEnabled ? subtotal * (invoice.discountPercent / 100) : 0;
  const taxableBase = subtotal - discountAmount;
  const taxAmount = taxableBase * (invoice.taxPercent / 100);
  const shippingAmount = invoice.shippingEnabled ? invoice.shippingAmount : 0;
  const total = taxableBase + taxAmount + shippingAmount;
  const balanceDue = total - invoice.amountPaid;
  return { subtotal, discountAmount, taxAmount, shippingAmount, total, balanceDue };
};

export const useInvoiceGenerator = (initial?: InvoiceData) => {
  const [invoice, setInvoice] = useState<InvoiceData>(initial ?? createBlankInvoice());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const totals = useMemo(() => computeTotals(invoice), [invoice]);

  const update = useCallback(<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setInvoice((current) => ({ ...current, [key]: value }));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<InvoiceLineItem>) => {
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }, []);

  const addItem = useCallback(() => {
    setInvoice((current) => ({ ...current, items: [...current.items, blankItem()] }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setInvoice((current) => ({
      ...current,
      // Never let the table go fully empty — an invoice with zero rows has
      // nowhere for the "+ Line Item" affordance to visually anchor to.
      items: current.items.length > 1 ? current.items.filter((item) => item.id !== id) : current.items,
    }));
  }, []);

  const loadInvoice = useCallback((next: InvoiceData) => {
    setInvoice({ invoiceTitle: 'Invoice', ...next });
    setSavedAt(null);
  }, []);

  const newInvoice = useCallback(() => {
    setInvoice(createBlankInvoice());
    setSavedAt(null);
  }, []);

  const save = useCallback(() => {
    const stamped: InvoiceData = { ...invoice, updatedAt: Date.now() };
    saveInvoice(stamped);
    setInvoice(stamped);
    setSavedAt(stamped.updatedAt);
    return stamped;
  }, [invoice]);

  const saveAsDefault = useCallback(() => {
    saveTemplateDefaults({
      fromAddress: invoice.fromAddress,
      logoDataUrl: invoice.logoDataUrl,
      currency: invoice.currency,
      terms: invoice.terms,
      notes: invoice.notes,
    });
  }, [invoice]);

  return { invoice, totals, savedAt, update, updateItem, addItem, removeItem, loadInvoice, newInvoice, save, saveAsDefault };
};
