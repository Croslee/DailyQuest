import React, { useEffect, useState } from 'react';
import { storageService, type StorageHealth } from '@/services/storageService';
import { useTranslation } from '@/i18n/I18nContext';
import { HardDrive, CheckCircle2, AlertTriangle, Database, RefreshCw } from 'lucide-react';

export const StorageDiagnostics: React.FC = () => {
  const { language } = useTranslation();
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await storageService.getStorageHealth();
      setHealth(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !health) return null;

  const totalRecords =
    health.recordCounts.quests +
    health.recordCounts.instances +
    health.recordCounts.completions +
    health.recordCounts.dailyStats +
    health.recordCounts.settings +
    health.recordCounts.customAchievements;

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <div>
            <h3 className="text-sm font-bold">
              {language === 'vi' ? 'Dung Lượng Bộ Nhớ & Tình Trạng Cơ Sở Dữ Liệu' : 'Storage Quota & Database Diagnostics'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi'
                ? 'Theo dõi dung lượng IndexedDB cục bộ của DailyQuest trên trình duyệt'
                : 'Monitor local IndexedDB storage usage and browser memory health'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-150 active:scale-95 disabled:opacity-50"
            title={language === 'vi' ? 'Làm mới dung lượng' : 'Refresh storage stats'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[var(--color-accent)]' : ''}`} />
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{
            backgroundColor: health.isWarning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            color: health.isWarning ? 'var(--color-danger)' : 'var(--color-success)',
          }}>
            {health.isWarning ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{health.isWarning ? (language === 'vi' ? 'Cảnh báo bộ nhớ' : 'Storage Warning') : (language === 'vi' ? 'Bộ nhớ an toàn' : 'Optimal Health')}</span>
          </div>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {language === 'vi' ? 'Đã sử dụng:' : 'Used:'} <strong>{health.usageFormatted}</strong> / {health.quotaFormatted}
          </span>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-accent)' }}>
            {health.percentUsed}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(1, health.percentUsed)}%`,
              backgroundColor: health.isWarning ? 'var(--color-danger)' : 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {/* Record breakdown grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border)]">
          <div className="text-[11px] text-[var(--color-text-tertiary)]">
            {language === 'vi' ? 'Mẫu Quest' : 'Quest Templates'}
          </div>
          <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
            {health.recordCounts.quests}
          </div>
        </div>

        <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border)]">
          <div className="text-[11px] text-[var(--color-text-tertiary)]">
            {language === 'vi' ? 'Nhiệm vụ ngày' : 'Daily Instances'}
          </div>
          <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
            {health.recordCounts.instances}
          </div>
        </div>

        <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border)]">
          <div className="text-[11px] text-[var(--color-text-tertiary)]">
            {language === 'vi' ? 'Lịch sử hoàn thành' : 'Completions'}
          </div>
          <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
            {health.recordCounts.completions}
          </div>
        </div>

        <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border)]">
          <div className="text-[11px] text-[var(--color-text-tertiary)]">
            {language === 'vi' ? 'Tổng bản ghi' : 'Total Records'}
          </div>
          <div className="text-base font-bold text-[var(--color-accent)] mt-0.5 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 inline" />
            <span>{totalRecords}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
