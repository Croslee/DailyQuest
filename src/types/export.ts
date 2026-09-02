import type { Quest, QuestInstance } from './quest';
import type { QuestCompletion } from './completion';
import type { DailyStats } from './statistics';

/** JSON export file schema */
export interface ExportData {
  schemaVersion: number;
  exportedAt: string;
  dateRange: {
    from: string;
    to: string;
  };
  quests: Quest[];
  questInstances: QuestInstance[];
  completionRecords: QuestCompletion[];
  dailyStats: DailyStats[];
}

/** Export format options */
export type ExportFormat = 'json' | 'csv';

/** Import result summary */
export interface ImportResult {
  success: boolean;
  inserted: {
    quests: number;
    questInstances: number;
    completionRecords: number;
    dailyStats: number;
  };
  skipped: {
    quests: number;
    questInstances: number;
    completionRecords: number;
    dailyStats: number;
  };
  errors: string[];
}
