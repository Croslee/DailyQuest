import type { Quest, QuestInstance } from '@/types/quest';
import { parseDateKey } from '@/utils/date';

/**
 * Determine whether a quest should generate an instance for a given date.
 * This is a pure decision function with no side effects.
 *
 * Rules:
 * - daily: generate every day
 * - weekly: generate if the given date's day of week matches selected days (0=Sun, 1=Mon, ..., 6=Sat)
 * - once: generate only if no instance exists for this quest at all
 * - scheduled: generate only on the specified date
 * - archived quests: never generate
 *
 * @returns true if an instance should be created
 */
export function shouldGenerateInstance(
  quest: Quest,
  date: string,
  existingInstances: { questId: string; date: string }[]
): boolean {
  // Never generate for archived quests
  if (quest.archived) return false;

  // Check if instance already exists for this quest on this date
  const alreadyExists = existingInstances.some(
    inst => inst.questId === quest.id && inst.date === date
  );
  if (alreadyExists) return false;

  switch (quest.recurrence.type) {
    case 'daily':
      return true;

    case 'weekly': {
      const dateObj = parseDateKey(date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      return quest.recurrence.days.includes(dayOfWeek);
    }

    case 'once': {
      // Only generate if no instance exists for this quest at all
      const anyExists = existingInstances.some(inst => inst.questId === quest.id);
      return !anyExists;
    }

    case 'scheduled':
      return quest.recurrence.date === date;

    default:
      return false;
  }
}

/**
 * Determine which quest instances from previous days should be marked as missed.
 * A pending instance from a past date should be marked as missed.
 *
 * @param instances - All instances to check
 * @param today - Today's date key
 * @returns Instance IDs that should be marked as missed
 */
export function findMissedInstances(
  instances: QuestInstance[],
  today: string
): string[] {
  return instances
    .filter(inst => inst.status === 'pending' && inst.date < today)
    .map(inst => inst.id);
}
