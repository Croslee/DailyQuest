import React, { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/i18n/I18nContext';
import { getLocalDateKey, getDaysBetween } from '@/utils/date';
import { ShieldAlert, Download, X } from 'lucide-react';
import { ExportModal } from '@/components/export-import/ExportModal';

export const BackupReminderBanner: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const { language } = useTranslation();
  const [showExportModal, setShowExportModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const today = getLocalDateKey();
  const lastBackup = settings.lastBackupDate;
  const lastDismissed = settings.lastBackupDismissedDate;

  // Calculate days since last backup or dismissal
  let needsReminder = false;
  if (!lastBackup) {
    // If no backup was ever made, check if dismissed recently
    if (!lastDismissed || getDaysBetween(lastDismissed, today) >= 7) {
      needsReminder = true;
    }
  } else {
    // If last backup was > 14 days ago and not dismissed recently
    const daysSinceBackup = getDaysBetween(lastBackup, today);
    const daysSinceDismissed = lastDismissed ? getDaysBetween(lastDismissed, today) : 999;
    if (daysSinceBackup >= 14 && daysSinceDismissed >= 7) {
      needsReminder = true;
    }
  }

  if (!needsReminder || dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    await updateSetting('lastBackupDismissedDate', today);
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs mb-4 animate-in fade-in duration-300"
        style={{
          backgroundColor: 'rgba(217, 119, 6, 0.08)',
          borderColor: 'rgba(217, 119, 6, 0.3)',
          color: 'var(--color-text-primary)',
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
          <ShieldAlert className="w-4 h-4 text-[var(--color-xp)] flex-shrink-0" />
          <span className="truncate">
            {language === 'vi'
              ? '💡 Đã hơn 14 ngày chưa sao lưu. Hãy xuất bản sao lưu JSON để đảm bảo an toàn dữ liệu!'
              : "💡 It's time for a backup! Export a JSON backup to protect your productivity history."}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-xp)' }}
          >
            <Download className="w-3 h-3" />
            <span>{language === 'vi' ? 'Sao lưu ngay' : 'Backup Now'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            title="Dismiss reminder for 7 days"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
};
