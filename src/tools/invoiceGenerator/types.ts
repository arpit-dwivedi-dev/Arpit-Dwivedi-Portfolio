export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  /** localStorage key for this invoice — stable across edits, generated once on creation. */
  id: string;
  invoiceTitle: string;
  invoiceNumber: string;
  logoDataUrl?: string;
  fromAddress: string;
  billTo: string;
  shipTo: string;
  date: string;
  paymentTerms: string;
  dueDate: string;
  poNumber: string;
  items: InvoiceLineItem[];
  notes: string;
  terms: string;
  taxPercent: number;
  discountEnabled: boolean;
  discountPercent: number;
  shippingEnabled: boolean;
  shippingAmount: number;
  currency: string;
  amountPaid: number;
  /** Set on every save — drives "most recently edited" sort order in History. */
  updatedAt: number;
}

export interface InvoiceTemplateDefaults {
  fromAddress: string;
  logoDataUrl?: string;
  currency: string;
  terms: string;
  notes: string;
}

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'AUD', label: 'AUD ($)', symbol: '$' },
  { code: 'CAD', label: 'CAD ($)', symbol: '$' },
  { code: 'AED', label: 'AED (د.إ)', symbol: 'د.إ' },
  { code: 'SGD', label: 'SGD ($)', symbol: '$' },
];

export const getCurrencySymbol = (code: string): string => CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
