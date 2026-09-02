import { useState, useEffect, useCallback } from 'react';
import type { Quest, CreateQuestInput, UpdateQuestInput } from '@/types/quest';
import { questService } from '@/services/questService';

/** Hook to manage quest templates */
export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuests = useCallback(async () => {
    try {
      const active = await questService.getActive();
      setQuests(active);
    } catch (error) {
      console.error('[useQuests] Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const createQuest = useCallback(async (input: CreateQuestInput) => {
    const quest = await questService.create(input);
    await loadQuests();
    return quest;
  }, [loadQuests]);

  const updateQuest = useCallback(async (id: string, input: UpdateQuestInput) => {
    const updated = await questService.update(id, input);
    await loadQuests();
    return updated;
  }, [loadQuests]);

  const archiveQuest = useCallback(async (id: string) => {
    await questService.archive(id);
    await loadQuests();
  }, [loadQuests]);

  const deleteQuest = useCallback(async (id: string) => {
    await questService.delete(id);
    await loadQuests();
  }, [loadQuests]);

  return { quests, loading, createQuest, updateQuest, archiveQuest, deleteQuest, reload: loadQuests };
}
