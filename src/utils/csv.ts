/**
 * CSV generation utilities following RFC 4180.
 * Handles commas, quotes, newlines, and Unicode correctly.
 */

/** Escape a single CSV field value per RFC 4180 */
export function escapeCSVField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If the field contains a comma, quote, newline, or carriage return, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert an array of rows (each row is an array of field values) to a CSV string */
export function toCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVField).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}
