import React, { useState } from 'react';
import type { ExportFormat } from '@/types/export';
import { exportService } from '@/services/exportService';
import { obsidianExportService } from '@/services/obsidianExportService';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/i18n/I18nContext';
import {
  getLocalDateKey,
  getWeekStart,
  getMonthStart,
  getMonthEnd,
  daysAgo,
} from '@/utils/date';
import { X, Download, FileJson, FileSpreadsheet, FileText, Check, Copy } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PresetKey = 'today' | 'week' | 'month' | '30days' | 'year' | 'custom';
type ExtendedFormat = ExportFormat | 'obsidian';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const today = getLocalDateKey();
  const { updateSetting } = useSettings();
  const { language } = useTranslation();
  const [preset, setPreset] = useState<PresetKey>('month');
  const [fromDate, setFromDate] = useState<string>(getMonthStart());
  const [toDate, setToDate] = useState<string>(getMonthEnd());
  const [format, setFormat] = useState<ExtendedFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [exportedFile, setExportedFile] = useState<string | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);

  if (!isOpen) return null;

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    setExportedFile(null);
    setCopiedMd(false);
    switch (key) {
      case 'today':
        setFromDate(today);
        setToDate(today);
        break;
      case 'week':
        setFromDate(getWeekStart());
        setToDate(today);
        break;
      case 'month':
        setFromDate(getMonthStart());
        setToDate(getMonthEnd());
        break;
      case '30days':
        setFromDate(daysAgo(29));
        setToDate(today);
        break;
      case 'year':
        setFromDate(`${today.substring(0, 4)}-01-01`);
        setToDate(today);
        break;
      case 'custom':
        break;
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setExportedFile(null);
    setCopiedMd(false);

    try {
      if (format === 'obsidian') {
        const md = await obsidianExportService.generateDailyNoteMarkdown(fromDate);
        const filename = `dailyquest-note-${fromDate}.md`;
        obsidianExportService.downloadMarkdownFile(md, filename);
        setExportedFile(filename);
      } else {
        const filename = await exportService.exportAndDownload(fromDate, toDate, format);
        setExportedFile(filename);
        if (format === 'json') {
          await updateSetting('lastBackupDate', today);
        }
      }
    } catch (err) {
      console.error('[ExportModal] Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyObsidianMarkdown = async () => {
    try {
      const md = await obsidianExportService.generateDailyNoteMarkdown(fromDate);
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 3000);
    } catch (err) {
      console.error('[ExportModal] Failed to copy markdown:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl border mx-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Export Data"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Download className="w-4 h-4 text-[var(--color-accent)]" />
            <span>{language === 'vi' ? 'Xuất & Sao Lưu Dữ Liệu' : 'Export Historical Data'}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleExport} className="p-5 space-y-4">
          {/* Preset buttons */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Khoảng thời gian nhanh' : 'Quick Range'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'today', label: language === 'vi' ? 'Hôm nay' : 'Today' },
                { id: 'week', label: language === 'vi' ? 'Tuần này' : 'This Week' },
                { id: 'month', label: language === 'vi' ? 'Tháng này' : 'This Month' },
                { id: '30days', label: language === 'vi' ? '30 ngày qua' : 'Last 30 Days' },
                { id: 'year', label: language === 'vi' ? 'Năm nay' : 'This Year' },
                { id: 'custom', label: language === 'vi' ? 'Tùy chỉnh' : 'Custom' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id as PresetKey)}
                  className={`px-2 py-1.5 text-xs rounded-md border transition-all duration-150 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] hover:scale-105 active:scale-95 cursor-pointer ${
                    preset === p.id ? 'font-bold ring-1 ring-[var(--color-accent)]' : ''
                  }`}
                  style={{
                    backgroundColor: preset === p.id ? 'var(--color-accent-light)' : 'transparent',
                    borderColor: preset === p.id ? 'var(--color-accent)' : 'var(--color-border)',
                    color: preset === p.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="export-from" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {language === 'vi' ? 'Từ ngày' : 'From Date'}
              </label>
              <input
                id="export-from"
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setPreset('custom'); setExportedFile(null); }}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                required
              />
            </div>

            <div>
              <label htmlFor="export-to" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {language === 'vi' ? 'Đến ngày' : 'To Date'}
              </label>
              <input
                id="export-to"
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setPreset('custom'); setExportedFile(null); }}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                required
              />
            </div>
          </div>

          {/* Format selection (JSON, CSV, Markdown) */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Định dạng xuất dữ liệu' : 'Export Format'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setFormat('json'); setExportedFile(null); }}
                className={`group flex flex-col items-center text-center p-2.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-accent)] cursor-pointer ${
                  format === 'json' ? 'ring-2 ring-[var(--color-accent)] font-bold' : ''
                }`}
                style={{
                  backgroundColor: format === 'json' ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                  borderColor: format === 'json' ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                <FileJson className="w-5 h-5 mb-1 text-[var(--color-accent)] transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs">JSON Backup</span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">Full restore</span>
              </button>

              <button
                type="button"
                onClick={() => { setFormat('csv'); setExportedFile(null); }}
                className={`group flex flex-col items-center text-center p-2.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-accent)] cursor-pointer ${
                  format === 'csv' ? 'ring-2 ring-[var(--color-accent)] font-bold' : ''
                }`}
                style={{
                  backgroundColor: format === 'csv' ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                  borderColor: format === 'csv' ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                <FileSpreadsheet className="w-5 h-5 mb-1 text-[var(--color-success)] transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs">CSV Sheets</span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">Excel analysis</span>
              </button>

              <button
                type="button"
                onClick={() => { setFormat('obsidian'); setExportedFile(null); }}
                className={`group flex flex-col items-center text-center p-2.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-accent)] cursor-pointer ${
                  format === 'obsidian' ? 'ring-2 ring-[var(--color-accent)] font-bold' : ''
                }`}
                style={{
                  backgroundColor: format === 'obsidian' ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                  borderColor: format === 'obsidian' ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                <FileText className="w-5 h-5 mb-1 text-[var(--color-xp)] transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs">Markdown Note</span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">.md daily note</span>
              </button>
            </div>
          </div>

          {/* Markdown Copy Action Shortcut */}
          {format === 'obsidian' && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs">
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                {language === 'vi' ? 'Sao chép trực tiếp vào clipboard Markdown:' : 'Copy directly to Markdown clipboard:'}
              </span>
              <button
                type="button"
                onClick={handleCopyObsidianMarkdown}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border border-[var(--color-border)] hover:bg-[var(--color-accent-light)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-xs active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMd ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!') : (language === 'vi' ? 'Sao chép' : 'Copy')}</span>
              </button>
            </div>
          )}

          {/* Success banner */}
          {exportedFile && (
            <div className="flex items-center gap-2 p-2.5 rounded-md text-xs" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{language === 'vi' ? 'Đã tải tệp về' : 'Downloaded'}: <strong>{exportedFile}</strong></span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 text-white disabled:opacity-50 shadow-sm hover:opacity-90 hover:shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : language === 'vi' ? 'Tải tệp xuất' : 'Export & Download'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
