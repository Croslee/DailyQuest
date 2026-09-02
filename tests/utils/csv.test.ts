import { describe, it, expect } from 'vitest';
import { escapeCSVField, toCSV } from '@/utils/csv';

describe('CSV Utilities (RFC 4180)', () => {
  it('escapes fields containing commas', () => {
    expect(escapeCSVField('Study, Read')).toBe('"Study, Read"');
  });

  it('escapes fields containing double quotes by doubling them', () => {
    expect(escapeCSVField('Read "Clean Code"')).toBe('"Read ""Clean Code"""');
  });

  it('escapes fields containing newlines', () => {
    expect(escapeCSVField("Line 1\nLine 2")).toBe("\"Line 1\nLine 2\"");
  });

  it('preserves Japanese and Vietnamese Unicode text', () => {
    expect(escapeCSVField('日本語の勉強 (Study Japanese)')).toBe('日本語の勉強 (Study Japanese)');
    expect(escapeCSVField('Học tiếng Nhật, tập thể dục')).toBe('"Học tiếng Nhật, tập thể dục"');
  });

  it('generates a full CSV document with CRLF lines', () => {
    const headers = ['Date', 'Quest', 'XP'];
    const rows = [
      ['2026-08-01', 'Study Japanese', 20],
      ['2026-08-01', 'Exercise, "Morning"', 10],
    ];

    const csv = toCSV(headers, rows);
    expect(csv).toBe('Date,Quest,XP\r\n2026-08-01,Study Japanese,20\r\n2026-08-01,"Exercise, ""Morning""",10');
  });
});
