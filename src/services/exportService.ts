import type { ExportData, ExportFormat } from '@/types/export';
import {
  questRepository,
  questInstanceRepository,
  completionRepository,
  dailyStatsRepository,
} from '@/db/index';
import { EXPORT_SCHEMA_VERSION, DIFFICULTY_LABELS, PRIORITY_LABELS } from '@/constants/defaults';
import { nowISO } from '@/utils/date';
import { toCSV } from '@/utils/csv';
import { downloadJSON, downloadCSV } from '@/utils/download';

/**
 * Generate standard filename for export:
 * - Single day: dailyquest-2026-08-30.json
 * - Single month: dailyquest-2026-08.json
 * - Custom range: dailyquest-2026-08-01-to-2026-08-15.json
 */
export function getExportFilename(from: string, to: string, format: ExportFormat): string {
  let datePart: string;

  if (from === to) {
    datePart = from;
  } else if (
    from.substring(0, 7) === to.substring(0, 7) &&
    from.endsWith('-01') &&
    new Date(Number(to.substring(0, 4)), Number(to.substring(5, 7)), 0).getDate() === Number(to.substring(8, 10))
  ) {
    // Exactly one full calendar month
    datePart = from.substring(0, 7);
  } else {
    datePart = `${from}-to-${to}`;
  }

  return `dailyquest-${datePart}.${format}`;
}

export const exportService = {
  /**
   * Export historical data for a specific date range as a structured JSON object.
   * Only queries the requested date range from IndexedDB.
   */
  async generateJSON(from: string, to: string): Promise<{ data: ExportData; filename: string }> {
    // 1. Query records within date range
    const [instances, completions, dailyStats] = await Promise.all([
      questInstanceRepository.getByDateRange(from, to),
      completionRepository.getByDateRange(from, to),
      dailyStatsRepository.getByDateRange(from, to),
    ]);

    // 2. Find referenced quest IDs
    const referencedQuestIds = new Set<string>();
    for (const inst of instances) referencedQuestIds.add(inst.questId);
    for (const comp of completions) referencedQuestIds.add(comp.questId);

    // 3. Fetch referenced quests (plus any active quests if needed)
    const allQuests = await questRepository.getAll();
    const quests = allQuests.filter(q => referencedQuestIds.has(q.id));

    const exportData: ExportData = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: nowISO(),
      dateRange: { from, to },
      quests,
      questInstances: instances,
      completionRecords: completions,
      dailyStats,
    };

    const filename = getExportFilename(from, to, 'json');
    return { data: exportData, filename };
  },

  /**
   * Export historical data as a flat, denormalized CSV string formatted per RFC 4180.
   * Contains date, quest title, category, difficulty, priority, status, and XP.
   */
  async generateCSV(from: string, to: string): Promise<{ data: string; filename: string }> {
    const [instances, completions, allQuests] = await Promise.all([
      questInstanceRepository.getByDateRange(from, to),
      completionRepository.getByDateRange(from, to),
      questRepository.getAll(),
    ]);

    const questMap = new Map<string, (typeof allQuests)[0]>();
    for (const q of allQuests) questMap.set(q.id, q);

    const completionMap = new Map<string, (typeof completions)[0]>();
    for (const c of completions) completionMap.set(c.questInstanceId, c);

    const headers = ['Date', 'Quest', 'Category', 'Difficulty', 'Priority', 'Status', 'XP'];
    const rows: (string | number)[][] = [];

    for (const inst of instances) {
      const comp = completionMap.get(inst.id);
      const quest = questMap.get(inst.questId);

      const title = comp?.questTitle ?? quest?.title ?? 'Unknown Quest';
      const category = comp?.questCategory ?? quest?.category ?? 'Other';
      const difficulty = DIFFICULTY_LABELS[comp?.questDifficulty ?? quest?.difficulty ?? 'normal'];
      const priority = PRIORITY_LABELS[quest?.priority ?? 'medium'];
      const status = inst.status;
      const xp = comp?.xpEarned ?? 0;

      rows.push([inst.date, title, category, difficulty, priority, status, xp]);
    }

    // Sort rows by date ascending, then title
    rows.sort((a, b) => {
      const dateCompare = String(a[0]).localeCompare(String(b[0]));
      if (dateCompare !== 0) return dateCompare;
      return String(a[1]).localeCompare(String(b[1]));
    });

    const csvString = toCSV(headers, rows);
    const filename = getExportFilename(from, to, 'csv');
    return { data: csvString, filename };
  },

  /**
   * Export and trigger instant browser file download.
   */
  async exportAndDownload(from: string, to: string, format: ExportFormat): Promise<string> {
    if (format === 'json') {
      const { data, filename } = await this.generateJSON(from, to);
      downloadJSON(data, filename);
      return filename;
    } else {
      const { data, filename } = await this.generateCSV(from, to);
      downloadCSV(data, filename);
      return filename;
    }
  },
};
