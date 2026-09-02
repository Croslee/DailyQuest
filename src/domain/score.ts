import type { QuestInstance, InstanceStatus } from '@/types/quest';
import type { DailyScoreResult } from '@/types/statistics';

/**
 * Calculate the daily score from quest instances.
 *
 * Rules:
 * - completed → contributes to completed count
 * - skipped → EXCLUDED from denominator (actionable count)
 * - missed → included in denominator
 * - pending → included in denominator
 *
 * Score = completed / actionable × 100
 * where actionable = completed + missed + pending (NOT skipped)
 *
 * A day is successful when score >= 70%
 */
export function calculateDailyScore(instances: QuestInstance[]): DailyScoreResult {
  const completed = instances.filter(i => i.status === 'completed').length;
  const skipped = instances.filter(i => i.status === 'skipped').length;
  const missed = instances.filter(i => i.status === 'missed').length;
  const pending = instances.filter(i => i.status === 'pending').length;
  const total = instances.length;
  const actionable = total - skipped; // completed + missed + pending

  const score = actionable > 0
    ? Math.round((completed / actionable) * 1000) / 10
    : 0;

  return {
    total,
    completed,
    skipped,
    missed,
    pending,
    actionable,
    score,
    isSuccessful: actionable > 0 && score >= 70,
  };
}

/**
 * Get the contribution chart level (0-4) from a daily score.
 *
 * 0%       → Level 0
 * 1–25%    → Level 1
 * 26–50%   → Level 2
 * 51–75%   → Level 3
 * 76–100%  → Level 4
 */
export function getContributionLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0;
  if (score <= 25) return 1;
  if (score <= 50) return 2;
  if (score <= 75) return 3;
  return 4;
}
