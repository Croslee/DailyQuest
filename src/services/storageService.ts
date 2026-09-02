import { db } from '@/db/database';

export interface StorageHealth {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  usageFormatted: string;
  quotaFormatted: string;
  isWarning: boolean;
  status: 'optimal' | 'warning' | 'critical';
  recordCounts: {
    quests: number;
    instances: number;
    completions: number;
    dailyStats: number;
    settings: number;
    customAchievements: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const storageService = {
  /**
   * Get storage quota and record statistics from browser IndexedDB
   */
  async getStorageHealth(): Promise<StorageHealth> {
    let usageBytes = 0;
    let quotaBytes = 10 * 1024 * 1024 * 1024; // Default fallback 10GB

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || quotaBytes;
      } catch (err) {
        console.warn('Storage estimate not supported or failed:', err);
      }
    }

    const percentUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;
    const isWarning = percentUsed >= 80;
    const isCritical = percentUsed >= 95;

    const [
      quests,
      instances,
      completions,
      dailyStats,
      settings,
      customAchievements,
    ] = await Promise.all([
      db.quests.count(),
      db.questInstances.count(),
      db.completionRecords.count(),
      db.dailyStats.count(),
      db.settings.count(),
      db.customAchievements.count(),
    ]);

    return {
      usageBytes,
      quotaBytes,
      percentUsed: Math.min(100, Number(percentUsed.toFixed(2))),
      usageFormatted: formatBytes(usageBytes),
      quotaFormatted: formatBytes(quotaBytes),
      isWarning,
      status: isCritical ? 'critical' : isWarning ? 'warning' : 'optimal',
      recordCounts: {
        quests,
        instances,
        completions,
        dailyStats,
        settings,
        customAchievements,
      },
    };
  },
};
