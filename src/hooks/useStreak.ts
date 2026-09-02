import { useState, useEffect, useCallback } from 'react';
import type { StreakResult } from '@/types/statistics';
import { streakService } from '@/services/streakService';

/** Hook to get streak information */
export function useStreak() {
  const [streak, setStreak] = useState<StreakResult>({
    currentStreak: 0, bestStreak: 0, successfulDays: 0, totalTrackedDays: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStreak = useCallback(async () => {
    try {
      const result = await streakService.getStreak();
      setStreak(result);
    } catch (error) {
      console.error('[useStreak] Failed to load streak:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  return { streak, loading, reload: loadStreak };
}
