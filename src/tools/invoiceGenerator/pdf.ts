import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { InvoiceData } from './types';
import { getCurrencySymbol } from './types';
import { computeTotals } from './useInvoiceGenerator';

const formatMoney = (amount: number, currency: string) => `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;

const MARGIN = 40;

// Builds the PDF entirely on the main thread with jsPDF's own drawing API —
// no server round trip, no html2canvas screenshot of the live DOM (which
// would bake in screen-only styling and go blurry at print resolution).
export const buildInvoicePdf = (invoice: InvoiceData): jsPDF => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const totals = computeTotals(invoice);
  let cursorY = MARGIN;

  if (invoice.logoDataUrl) {
    try {
      doc.addImage(invoice.logoDataUrl, 'PNG', MARGIN, cursorY, 90, 60, undefined, 'FAST');
    } catch {
      // Unsupported image format slipped past the <input accept> filter —
      // skip the logo rather than let addImage's throw blow up the download.
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text((invoice.invoiceTitle || 'Invoice').toUpperCase(), pageWidth - MARGIN, cursorY + 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`# ${invoice.invoiceNumber || '—'}`, pageWidth - MARGIN, cursorY + 36, { align: 'right' });

  cursorY += 90;

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text('FROM', MARGIN, cursorY);
  doc.text('BILL TO', MARGIN + 260, cursorY);
  doc.setTextColor(20);
  doc.setFontSize(10);
  const fromLines = doc.splitTextToSize(invoice.fromAddress || '—', 230);
  const billLines = doc.splitTextToSize(invoice.billTo || '—', 230);
  doc.text(fromLines, MARGIN, cursorY + 14);
  doc.text(billLines, MARGIN + 260, cursorY + 14);

  const detailRows: [string, string][] = [
    ['Date', invoice.date],
    ['Payment Terms', invoice.paymentTerms],
    ['Due Date', invoice.dueDate],
    ['PO Number', invoice.poNumber],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  let detailY = cursorY;
  const detailX = pageWidth - MARGIN - 180;
  doc.setFontSize(9);
  detailRows.forEach(([label, value]) => {
    doc.setTextColor(90);
    doc.text(label, detailX, detailY);
    doc.setTextColor(20);
    doc.text(value, pageWidth - MARGIN, detailY, { align: 'right' });
    detailY += 14;
  });

  cursorY += Math.max(fromLines.length, billLines.length) * 12 + 40;
  cursorY = Math.max(cursorY, detailY + 10);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Item', 'Quantity', 'Rate', 'Amount']],
    body: invoice.items.map((item) => [
      item.description || '—',
      String(item.quantity),
      formatMoney(item.rate, invoice.currency),
      formatMoney(item.quantity * item.rate, invoice.currency),
    ]),
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: 30 },
    columnStyles: {
      1: { halign: 'right', cellWidth: 70 },
      2: { halign: 'right', cellWidth: 90 },
      3: { halign: 'right', cellWidth: 90 },
    },
  });

  // autoTable stashes the row it finished on — read it back rather than
  // re-deriving row heights, since wrapped item descriptions make that math
  // needlessly fragile.
  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  const totalsX = pageWidth - MARGIN - 180;
  const totalLines: [string, string][] = [
    ['Subtotal', formatMoney(totals.subtotal, invoice.currency)],
    ...(invoice.discountEnabled ? [['Discount', `-${formatMoney(totals.discountAmount, invoice.currency)}`] as [string, string]] : []),
    ...(invoice.taxPercent > 0 ? [[`Tax (${invoice.taxPercent}%)`, formatMoney(totals.taxAmount, invoice.currency)] as [string, string]] : []),
    ...(invoice.shippingEnabled ? [['Shipping', formatMoney(totals.shippingAmount, invoice.currency)] as [string, string]] : []),
  ];

  doc.setFontSize(10);
  totalLines.forEach(([label, value]) => {
    doc.setTextColor(90);
    doc.text(label, totalsX, cursorY);
    doc.setTextColor(20);
    doc.text(value, pageWidth - MARGIN, cursorY, { align: 'right' });
    cursorY += 16;
  });

  doc.setDrawColor(220);
  doc.line(totalsX, cursorY, pageWidth - MARGIN, cursorY);
  cursorY += 16;

  doc.setFont('helvetica', 'bold');
  doc.text('Total', totalsX, cursorY);
  doc.text(formatMoney(totals.total, invoice.currency), pageWidth - MARGIN, cursorY, { align: 'right' });
  cursorY += 18;

  if (invoice.amountPaid > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90);
    doc.text('Amount Paid', totalsX, cursorY);
    doc.setTextColor(20);
    doc.text(formatMoney(invoice.amountPaid, invoice.currency), pageWidth - MARGIN, cursorY, { align: 'right' });
    cursorY += 18;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Balance Due', totalsX, cursorY);
  doc.text(formatMoney(totals.balanceDue, invoice.currency), pageWidth - MARGIN, cursorY, { align: 'right' });

  cursorY += 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);

  if (invoice.notes) {
    doc.text('Notes', MARGIN, cursorY);
    doc.setTextColor(20);
    doc.text(doc.splitTextToSize(invoice.notes, pageWidth - MARGIN * 2), MARGIN, cursorY + 14);
    cursorY += 14 + doc.splitTextToSize(invoice.notes, pageWidth - MARGIN * 2).length * 12 + 16;
  }

  if (invoice.terms) {
    doc.setTextColor(90);
    doc.text('Terms', MARGIN, cursorY);
    doc.setTextColor(20);
    doc.text(doc.splitTextToSize(invoice.terms, pageWidth - MARGIN * 2), MARGIN, cursorY + 14);
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Powered by 101 Tech Labs · 101techlabs.com', pageWidth / 2, pageHeight - 24, { align: 'center' });

  return doc;
};

export const downloadInvoicePdf = (invoice: InvoiceData): void => {
  const doc = buildInvoicePdf(invoice);
  doc.save(`invoice-${invoice.invoiceNumber || 'draft'}.pdf`);
};

const buildShareSummary = (invoice: InvoiceData): string => {
  const totals = computeTotals(invoice);
  const billToLine = invoice.billTo.split('\n')[0];
  const lines = [
    `Invoice #${invoice.invoiceNumber || '—'}`,
    billToLine ? `To: ${billToLine}` : null,
    `Total: ${formatMoney(totals.total, invoice.currency)}`,
    `Balance due: ${formatMoney(totals.balanceDue, invoice.currency)}`,
  ];
  return lines.filter(Boolean).join('\n');
};

// Uses the Web Share API's file-sharing tier (Level 2) when the browser
// supports it, so the invoice PDF itself — not just a link — lands in
// whatever app the user picks (WhatsApp, Mail, AirDrop, etc). On browsers
// without file-share support but with text/url share (some desktop Chrome
// builds), falls back to sharing a text summary. On browsers with no Web
// Share API at all (desktop Safari/Firefox), falls back to opening the
// user's email client with the summary prefilled — a real "share", as
// opposed to just re-triggering the Download button.
export const shareInvoicePdf = async (invoice: InvoiceData): Promise<'shared' | 'emailed' | 'cancelled'> => {
  const doc = buildInvoicePdf(invoice);
  const fileName = `invoice-${invoice.invoiceNumber || 'draft'}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const title = invoice.invoiceTitle || 'Invoice';
  const summary = buildShareSummary(invoice);

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: summary });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      // Some browsers advertise canShare support but reject at share-time —
      // fall through to the text-share/mailto paths below.
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text: summary });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    }
  }

  const subject = `Invoice ${invoice.invoiceNumber || ''}`.trim();
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
  return 'emailed';
};
