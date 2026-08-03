// Quotes every field and escapes embedded quotes per RFC 4180 — simplest
// rule that's still correct for names/addresses containing commas.
const toCsvCell = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const toCsv = <T,>(rows: T[], columns: { key: keyof T; label: string }[]): string => {
  const header = columns.map((c) => toCsvCell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => toCsvCell(row[c.key])).join(','));
  return [header, ...body].join('\r\n');
};

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCsv = (filename: string, csv: string) => {
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
};

export const toJson = <T,>(rows: T[], columns: { key: keyof T; label: string }[]): string => {
  const mapped = rows.map((row) => Object.fromEntries(columns.map((c) => [c.label, row[c.key]])));
  return JSON.stringify(mapped, null, 2);
};

export const downloadJson = (filename: string, json: string) => {
  downloadBlob(filename, new Blob([json], { type: 'application/json;charset=utf-8;' }));
};

const toExcelCell = (value: unknown): string =>
  `<td>${String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;

// A plain HTML <table> saved with an .xls extension — Excel opens this fine
// without pulling in a real spreadsheet-writing library for a handful of columns.
export const toExcel = <T,>(rows: T[], columns: { key: keyof T; label: string }[]): string => {
  const header = columns.map((c) => `<th>${c.label}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${columns.map((c) => toExcelCell(row[c.key])).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};

export const downloadExcel = (filename: string, html: string) => {
  downloadBlob(filename, new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
};
