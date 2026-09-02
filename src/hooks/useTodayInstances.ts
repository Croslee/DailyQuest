import { useState, useEffect, useCallback } from 'react';
import type { QuestInstance, Quest, Priority } from '@/types/quest';
import type { DailyScoreResult } from '@/types/statistics';
import { questInstanceRepository, questRepository } from '@/db/index';
import { questGenerationService } from '@/services/questGenerationService';
import { calculateDailyScore } from '@/domain/score';
import { getLocalDateKey } from '@/utils/date';
import { PRIORITY_ORDER } from '@/constants/defaults';
import { updateBadgeCount } from '@/utils/badge';
import { useDateCheck } from './useDateCheck';
import { onDataChanged } from '@/services/syncChannel';

export interface TodayInstance extends QuestInstance {
  quest?: Quest;
}

/** Hook that provides today's quest instances with quest metadata */
export function useTodayInstances() {
  const [instances, setInstances] = useState<TodayInstance[]>([]);
  const [score, setScore] = useState<DailyScoreResult>({
    total: 0, completed: 0, skipped: 0, missed: 0, pending: 0, actionable: 0, score: 0, isSuccessful: false,
  });
  const [loading, setLoading] = useState(true);

  const loadInstances = useCallback(async () => {
    try {
      const today = getLocalDateKey();
      
      // Ensure today's instances are generated
      await questGenerationService.generateForDate(today);

      // Load instances
      const todayInstances = await questInstanceRepository.getByDate(today);
      
      // Load quest metadata for each instance
      const enriched: TodayInstance[] = await Promise.all(
        todayInstances.map(async (inst) => {
          const quest = await questRepository.getById(inst.questId);
          return { ...inst, quest };
        })
      );

      // Sort: by custom order if set, otherwise by priority then creation time
      enriched.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;

        const priorityA = a.quest ? PRIORITY_ORDER[a.quest.priority as Priority] : 1;
        const priorityB = b.quest ? PRIORITY_ORDER[b.quest.priority as Priority] : 1;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.createdAt.localeCompare(b.createdAt);
      });

      setInstances(enriched);
      const calculatedScore = calculateDailyScore(todayInstances);
      setScore(calculatedScore);

      // Update badge counter with pending quest count
      await updateBadgeCount(calculatedScore.pending);
    } catch (error) {
      console.error('[useTodayInstances] Failed to load instances:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & real-time synchronization listener
  useEffect(() => {
    loadInstances();
    const unsubscribe = onDataChanged(() => {
      loadInstances();
    });
    return unsubscribe;
  }, [loadInstances]);

  // Re-load on date change
  useDateCheck(useCallback(() => {
    setLoading(true);
    loadInstances();
  }, [loadInstances]));

  return { instances, score, loading, reload: loadInstances };
}
