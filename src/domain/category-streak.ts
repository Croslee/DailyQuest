import type { QuestCompletion } from '@/types/completion';
import { getLocalDateKey, getPreviousDateKey } from '@/utils/date';

export interface CategoryStreakResult {
  category: string;
  currentStreak: number;
  totalCompletions: number;
}

/**
 * Calculate current consecutive streak for each category.
 */
export function calculateCategoryStreaks(completions: QuestCompletion[]): CategoryStreakResult[] {
  const completed = completions.filter(c => c.status === 'completed');
  
  // Group dates by category
  const categoryDates: Record<string, Set<string>> = {};
  const categoryCounts: Record<string, number> = {};

  for (const c of completed) {
    const cat = c.questCategory || 'Other';
    if (!categoryDates[cat]) {
      categoryDates[cat] = new Set();
      categoryCounts[cat] = 0;
    }
    categoryDates[cat].add(c.date);
    categoryCounts[cat]++;
  }

  const today = getLocalDateKey();
  const yesterday = getPreviousDateKey(today);

  const results: CategoryStreakResult[] = [];

  for (const [cat, dates] of Object.entries(categoryDates)) {
    let streak = 0;
    let checkDate = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null;

    while (checkDate && dates.has(checkDate)) {
      streak++;
      checkDate = getPreviousDateKey(checkDate);
    }

    results.push({
      category: cat,
      currentStreak: streak,
      totalCompletions: categoryCounts[cat] || 0,
    });
  }

  return results.sort((a, b) => b.currentStreak - a.currentStreak);
}
