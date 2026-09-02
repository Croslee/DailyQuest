import React, { useState, useRef } from 'react';
import type { ExportData, ImportResult } from '@/types/export';
import { importService } from '@/services/importService';
import { formatDateKey } from '@/utils/date';
import { useTranslation } from '@/i18n/I18nContext';
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { language } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ExportData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setValidationErrors([]);
    setValidatedData(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const validation = importService.validateJSON(content);

      if (!validation.valid || !validation.data) {
        setValidationErrors(validation.errors);
      } else {
        setValidatedData(validation.data);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!validatedData) return;
    setImporting(true);

    try {
      const result = await importService.importData(validatedData);
      setImportResult(result);
      if (result.success && onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setImportResult({
        success: false,
        inserted: { quests: 0, questInstances: 0, completionRecords: 0, dailyStats: 0 },
        skipped: { quests: 0, questInstances: 0, completionRecords: 0, dailyStats: 0 },
        errors: [`Import error: ${String(err)}`],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidatedData(null);
    setValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
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
        aria-label="Import Data"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-sm font-semibold">
              {language === 'vi' ? 'Nhập Dữ Liệu Lịch Sử (JSON)' : 'Import Historical Data (JSON)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* File Picker Zone */}
          {!selectedFile && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]/20 hover:scale-[1.01] active:scale-[0.99]"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <FileCode className="w-8 h-8 mx-auto mb-2 text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
              <p className="text-xs font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                {language === 'vi' ? 'Bấm để chọn file sao lưu JSON' : 'Click to select JSON backup file'}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {language === 'vi' ? 'Chỉ hỗ trợ file xuất từ DailyQuest (.json)' : 'Accepts DailyQuest export files (.json)'}
              </p>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg border text-xs space-y-1.5" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>{language === 'vi' ? 'File Không Hợp Lệ' : 'Invalid Import File'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
              <button
                onClick={handleReset}
                className="mt-2 text-[11px] underline font-medium hover:opacity-80 cursor-pointer"
              >
                {language === 'vi' ? 'Chọn file khác' : 'Choose another file'}
              </button>
            </div>
          )}

          {/* Validated File Preview */}
          {validatedData && !importResult && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="font-semibold truncate max-w-[220px]">{selectedFile?.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                    Schema v{validatedData.schemaVersion}
                  </span>
                </div>

                <div className="pt-2 space-y-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                  <div>
                    {language === 'vi' ? 'Khoảng thời gian:' : 'Range:'} <strong>{formatDateKey(validatedData.dateRange.from)}</strong> {language === 'vi' ? 'đến' : 'to'} <strong>{formatDateKey(validatedData.dateRange.to)}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div>• {validatedData.quests.length} {language === 'vi' ? 'Mẫu nhiệm vụ' : 'Quest Templates'}</div>
                    <div>• {validatedData.questInstances.length} {language === 'vi' ? 'Lượt xuất hiện' : 'Quest Instances'}</div>
                    <div>• {validatedData.completionRecords.length} {language === 'vi' ? 'Nhật ký hoàn thành' : 'Completion Records'}</div>
                    <div>• {validatedData.dailyStats.length} {language === 'vi' ? 'Thống kê ngày' : 'Daily Stats'}</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] p-2 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                {language === 'vi'
                  ? 'ℹ️ An toàn: Các bản ghi đã tồn tại trong máy sẽ tự động bỏ qua để tránh trùng lặp. Lịch sử hiện tại không bao giờ bị ghi đè.'
                  : 'ℹ️ Safe import: Records that already exist in your local database will be skipped. Existing history is never overwritten.'}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={importing}
                  className="flex-1 py-2 text-xs font-semibold rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)] active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-200 disabled:opacity-50 text-white shadow-sm hover:opacity-90 hover:shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {importing ? (language === 'vi' ? 'Đang nạp...' : 'Importing...') : (language === 'vi' ? 'Xác Nhận Nạp' : 'Confirm Import')}
                </button>
              </div>
            </div>
          )}

          {/* Import Result Feedback */}
          {importResult && (
            <div className="p-4 rounded-xl border text-xs space-y-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 font-bold" style={{ color: importResult.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {importResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span>{importResult.success ? (language === 'vi' ? 'Nạp Dữ Liệu Thành Công!' : 'Import Completed Successfully') : (language === 'vi' ? 'Nạp Thất Bại' : 'Import Failed')}</span>
              </div>

              <div className="space-y-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                <div>
                  <strong>{language === 'vi' ? 'Đã thêm mới:' : 'Inserted New:'}</strong> {importResult.inserted.quests} {language === 'vi' ? 'quest' : 'quests'}, {importResult.inserted.completionRecords} {language === 'vi' ? 'nhật ký' : 'completions'}, {importResult.inserted.dailyStats} {language === 'vi' ? 'ngày thống kê' : 'day stats'}.
                </div>
                <div>
                  <strong>{language === 'vi' ? 'Bỏ qua (đã có):' : 'Skipped Duplicates:'}</strong> {importResult.skipped.quests} {language === 'vi' ? 'quest' : 'quests'}, {importResult.skipped.completionRecords} {language === 'vi' ? 'nhật ký' : 'completions'}.
                </div>
                {importResult.errors.length > 0 && (
                  <div className="pt-2 text-[10px]" style={{ color: 'var(--color-danger)' }}>
                    Errors: {importResult.errors.join(', ')}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold rounded-md text-white shadow-sm hover:opacity-90 hover:shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {language === 'vi' ? 'Hoàn Tất' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
