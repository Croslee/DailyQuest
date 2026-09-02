/**
 * Trigger a browser download from in-memory content.
 */

/** Download a string as a file */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Download JSON data as a .json file */
export function downloadJSON(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

/** Download CSV data as a .csv file */
export function downloadCSV(content: string, filename: string): void {
  // Add BOM for Excel Unicode compatibility
  const bom = '\uFEFF';
  downloadFile(bom + content, filename, 'text/csv;charset=utf-8');
}
