import type { Quest, QuestInstance } from '@/types/quest';
import type { QuestCompletion } from '@/types/completion';
import type { DailyStats } from '@/types/statistics';
import type { ExportData } from '@/types/export';
import { EXPORT_SCHEMA_VERSION } from '@/constants/defaults';
import { isValidDateKey } from '@/utils/date';

/** Validation error with context */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validate a quest title.
 */
export function validateQuestTitle(title: string): ValidationError | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return { field: 'title', message: 'Quest title is required' };
  }
  if (trimmed.length > 200) {
    return { field: 'title', message: 'Quest title must be 200 characters or less', value: trimmed.length };
  }
  return null;
}

/**
 * Validate import data structure.
 * Returns an array of validation errors (empty = valid).
 */
export function validateImportData(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({ field: 'root', message: 'Import data must be a JSON object' });
    return errors;
  }

  const obj = data as Record<string, unknown>;

  // Check schema version
  if (typeof obj.schemaVersion !== 'number') {
    errors.push({ field: 'schemaVersion', message: 'schemaVersion is required and must be a number' });
  } else if (obj.schemaVersion > EXPORT_SCHEMA_VERSION) {
    errors.push({
      field: 'schemaVersion',
      message: `Unsupported schema version ${obj.schemaVersion}. Maximum supported: ${EXPORT_SCHEMA_VERSION}`,
      value: obj.schemaVersion,
    });
  }

  // Check exportedAt
  if (typeof obj.exportedAt !== 'string') {
    errors.push({ field: 'exportedAt', message: 'exportedAt is required and must be a string' });
  }

  // Check dateRange
  if (!obj.dateRange || typeof obj.dateRange !== 'object') {
    errors.push({ field: 'dateRange', message: 'dateRange is required' });
  } else {
    const range = obj.dateRange as Record<string, unknown>;
    if (typeof range.from !== 'string' || !isValidDateKey(range.from)) {
      errors.push({ field: 'dateRange.from', message: 'dateRange.from must be a valid YYYY-MM-DD date' });
    }
    if (typeof range.to !== 'string' || !isValidDateKey(range.to)) {
      errors.push({ field: 'dateRange.to', message: 'dateRange.to must be a valid YYYY-MM-DD date' });
    }
  }

  // Check arrays exist
  if (!Array.isArray(obj.quests)) {
    errors.push({ field: 'quests', message: 'quests must be an array' });
  }
  if (!Array.isArray(obj.questInstances)) {
    errors.push({ field: 'questInstances', message: 'questInstances must be an array' });
  }
  if (!Array.isArray(obj.completionRecords)) {
    errors.push({ field: 'completionRecords', message: 'completionRecords must be an array' });
  }
  if (!Array.isArray(obj.dailyStats)) {
    errors.push({ field: 'dailyStats', message: 'dailyStats must be an array' });
  }

  return errors;
}

/** Type guard for Quest */
export function isValidQuest(obj: unknown): obj is Quest {
  if (!obj || typeof obj !== 'object') return false;
  const q = obj as Record<string, unknown>;

  // Basic field checks
  if (
    typeof q.id !== 'string' ||
    typeof q.title !== 'string' ||
    typeof q.category !== 'string' ||
    !['easy', 'normal', 'hard', 'epic'].includes(q.difficulty as string) ||
    typeof q.xp !== 'number' ||
    !['low', 'medium', 'high'].includes(q.priority as string) ||
    typeof q.createdAt !== 'string' ||
    typeof q.updatedAt !== 'string' ||
    typeof q.archived !== 'boolean'
  ) {
    return false;
  }

  // Deep recurrence validation
  if (!q.recurrence || typeof q.recurrence !== 'object') return false;
  const rec = q.recurrence as Record<string, unknown>;
  const validTypes = ['daily', 'weekly', 'once', 'scheduled'];
  if (typeof rec.type !== 'string' || !validTypes.includes(rec.type)) return false;

  if (rec.type === 'weekly') {
    if (!Array.isArray(rec.days) || rec.days.length === 0) return false;
    if (!rec.days.every((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)) return false;
  }

  if (rec.type === 'scheduled') {
    if (typeof rec.date !== 'string' || !isValidDateKey(rec.date)) return false;
  }

  // Deep subtask validation (if present)
  if (q.subtasks !== undefined) {
    if (!Array.isArray(q.subtasks)) return false;
    for (const st of q.subtasks) {
      if (!st || typeof st !== 'object') return false;
      const s = st as Record<string, unknown>;
      if (typeof s.id !== 'string' || typeof s.title !== 'string') return false;
    }
  }

  return true;
}

/** Type guard for QuestInstance */
export function isValidQuestInstance(obj: unknown): obj is QuestInstance {
  if (!obj || typeof obj !== 'object') return false;
  const q = obj as Record<string, unknown>;
  return (
    typeof q.id === 'string' &&
    typeof q.questId === 'string' &&
    typeof q.date === 'string' &&
    isValidDateKey(q.date) &&
    ['pending', 'completed', 'skipped', 'missed'].includes(q.status as string) &&
    typeof q.createdAt === 'string'
  );
}

/** Type guard for QuestCompletion */
export function isValidCompletion(obj: unknown): obj is QuestCompletion {
  if (!obj || typeof obj !== 'object') return false;
  const q = obj as Record<string, unknown>;
  return (
    typeof q.id === 'string' &&
    typeof q.questId === 'string' &&
    typeof q.questInstanceId === 'string' &&
    typeof q.date === 'string' &&
    isValidDateKey(q.date) &&
    ['completed', 'skipped', 'missed'].includes(q.status as string) &&
    typeof q.xpEarned === 'number'
  );
}

/** Type guard for DailyStats */
export function isValidDailyStats(obj: unknown): obj is DailyStats {
  if (!obj || typeof obj !== 'object') return false;
  const q = obj as Record<string, unknown>;
  return (
    typeof q.date === 'string' &&
    isValidDateKey(q.date) &&
    typeof q.totalQuests === 'number' &&
    typeof q.completed === 'number' &&
    typeof q.score === 'number'
  );
}
