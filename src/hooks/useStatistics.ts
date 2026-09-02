import { useState, useEffect, useCallback } from 'react';
import type { StatisticsSummary, LevelResult } from '@/types/statistics';
import { statisticsService } from '@/services/statisticsService';

/** Hook to get statistics summary */
export function useStatistics() {
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const result = await statisticsService.getSummary();
      setSummary(result);
      return result;
    } catch (error) {
      console.error('[useStatistics] Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return { summary, loading, reload: loadSummary };
}

/** Hook to get level info */
export function useLevelInfo() {
  const [level, setLevel] = useState<LevelResult>({ level: 0, totalXP: 0, currentLevelXP: 0, nextLevelXP: 100, progress: 0 });
  const [loading, setLoading] = useState(true);

  const loadLevel = useCallback(async (): Promise<LevelResult | undefined> => {
    try {
      const result = await statisticsService.getLevelInfo();
      setLevel(result);
      return result;
    } catch (error) {
      console.error('[useLevelInfo] Failed to load level:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  return { level, loading, reload: loadLevel };
}
