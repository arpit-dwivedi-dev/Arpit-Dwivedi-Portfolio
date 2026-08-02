// Quotes every field and escapes embedded quotes per RFC 4180 — simplest
// rule that's still correct for names/addresses containing commas.
const toCsvCell = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const toCsv = <T,>(rows: T[], columns: { key: keyof T; label: string }[]): string => {
  const header = columns.map((c) => toCsvCell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => toCsvCell(row[c.key])).join(','));
  return [header, ...body].join('\r\n');
};

export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
