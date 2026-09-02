import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Quest, QuestInstance, CreateQuestInput, UpdateQuestInput } from '@/types/quest';
import { questService } from '@/services/questService';
import { questInstanceRepository } from '@/db/index';
import { questGenerationService } from '@/services/questGenerationService';
import { completionService } from '@/services/completionService';
import { DIFFICULTY_LABELS, PRIORITY_LABELS, DEFAULT_CATEGORIES } from '@/constants/defaults';
import { EditQuestDialog } from '@/components/quest/EditQuestDialog';
import { ToastContainer, type ToastData } from '@/components/ui/Toast';
import { Confetti } from '@/components/ui/Confetti';
import { playQuestCompleteSound, playLevelUpSound } from '@/utils/audio';
import { useSettings } from '@/hooks/useSettings';
import { useLevelInfo } from '@/hooks/useStatistics';
import { getRankForLevel, checkRankPromotion } from '@/domain/rank';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { generateId } from '@/utils/id';
import { getLocalDateKey } from '@/utils/date';
import { renderFormattedText } from '@/utils/text';
import { useTranslation } from '@/i18n/I18nContext';
import { onDataChanged } from '@/services/syncChannel';
import {
  Plus,
  Archive,
  Search,
  X,
  Trash2,
  Calendar,
  CheckSquare2,
  CheckCheck,
  Clock,
  SkipForward,
  RotateCcw,
  ChevronDown,
  Edit,
  LayoutGrid,
  List,
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'difficulty-desc' | 'xp-desc';
type StatusFilter = 'all' | 'pending' | 'completed' | 'skipped';

const difficultyRank: Record<string, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
  epic: 4,
};

export const QuestsPage: React.FC = () => {
  const { language } = useTranslation();
  const { settings } = useSettings();
  const { reload: reloadLevel } = useLevelInfo();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [archivedQuests, setArchivedQuests] = useState<Quest[]>([]);
  const [todayInstances, setTodayInstances] = useState<QuestInstance[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  // Toast & Confetti Celebration States
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevLevelRef = useRef<number>(1);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Initialize previous level for level-up celebration detection
  useEffect(() => {
    reloadLevel().then(lvl => {
      if (lvl) prevLevelRef.current = lvl.level;
    });
  }, [reloadLevel]);

  // View Mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Status Filter: 'all' | 'pending' | 'completed' | 'skipped'
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Expanded quest accordion IDs
  const [expandedQuestIds, setExpandedQuestIds] = useState<Set<string>>(new Set());

  // Inline subtask input state
  const [inlineSubtaskTitles, setInlineSubtaskTitles] = useState<Record<string, string>>({});

  // Quick keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      const isModalOpen = Boolean(document.querySelector('[role="dialog"], [role="alertdialog"]'));

      if (!isInput && !isModalOpen && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedQuestIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadQuests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const today = getLocalDateKey();
      await questGenerationService.generateForDate(today);

      const [all, instances] = await Promise.all([
        questService.getAll(),
        questInstanceRepository.getByDate(today),
      ]);

      const active = all.filter(q => !q.archived);
      const archived = all.filter(q => q.archived);
      setQuests(active);
      setArchivedQuests(archived);
      setTodayInstances(instances);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load & real-time sync subscription
  useEffect(() => {
    loadQuests(false);
    const unsubscribe = onDataChanged(() => {
      loadQuests(true);
    });
    return unsubscribe;
  }, []);

  const handleUpdateQuest = async (id: string, input: UpdateQuestInput) => {
    await questService.update(id, input);
    setEditingQuest(null);
    await loadQuests(true);
  };

  const handleArchiveQuest = async (id: string) => {
    await questService.archive(id);
    setEditingQuest(null);
    await loadQuests(true);
  };

  const handleUnarchiveQuest = async (id: string) => {
    await questService.unarchive(id);
    setEditingQuest(null);
    await loadQuests(true);
  };

  const handleToggleArchive = async (quest: Quest) => {
    if (quest.archived) {
      await questService.unarchive(quest.id);
    } else {
      await questService.archive(quest.id);
    }
    await loadQuests(true);
  };

  const handleDeleteQuest = async (questId: string) => {
    if (window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa vĩnh viễn mẫu nhiệm vụ này?' : 'Are you sure you want to permanently delete this quest blueprint?')) {
      await questService.delete(questId);
      setEditingQuest(null);
      await loadQuests(true);
    }
  };

  const handleToggleArchivedView = () => {
    setShowArchived(!showArchived);
  };

  const rawList = showArchived ? archivedQuests : quests;

  // Map of questId -> today's QuestInstance
  const todayInstancesMap = useMemo(() => {
    const map = new Map<string, QuestInstance>();
    todayInstances.forEach(inst => {
      map.set(inst.questId, inst);
    });
    return map;
  }, [todayInstances]);

  // Counts for status filter tabs
  const statusCounts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let skipped = 0;

    rawList.forEach(q => {
      const inst = todayInstancesMap.get(q.id);
      if (inst?.status === 'completed') completed++;
      else if (inst?.status === 'skipped') skipped++;
      else if (inst?.status === 'pending') pending++;
    });

    return {
      all: rawList.length,
      pending,
      completed,
      skipped,
    };
  }, [rawList, todayInstancesMap]);

  // Toggle subtask completion
  const handleToggleSubtask = async (quest: Quest, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const inst = todayInstancesMap.get(quest.id);

    if (inst) {
      const currentSubtasks = inst.subtasks ?? [];
      const updated = currentSubtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      const hasUncompleted = updated.some(st => !st.completed);
      const allCompleted = updated.length > 0 && updated.every(st => st.completed);

      let newStatus = inst.status;
      if (inst.status === 'completed' && hasUncompleted) {
        newStatus = 'pending';
      }

      await questInstanceRepository.update({
        ...inst,
        status: newStatus,
        subtasks: updated,
      });

      if (allCompleted && inst.status === 'pending') {
        const completion = await completionService.completeQuest(inst.id);
        if (completion) {
          await questGenerationService.updateDailyStats(completion.date);
          playQuestCompleteSound(settings.soundEffects);
          const updatedLevel = await reloadLevel();

          if (updatedLevel && updatedLevel.level > prevLevelRef.current) {
            const promotion = checkRankPromotion(prevLevelRef.current, updatedLevel.level);
            prevLevelRef.current = updatedLevel.level;
            playLevelUpSound(settings.soundEffects);
            setShowConfetti(true);

            if (promotion.promoted) {
              addToast({
                message: `👑 ĐỘT PHÁ CẢNH GIỚI: Lên bậc ${promotion.newRank.titleVi} (${promotion.newRank.classVi})!`,
                type: 'success',
                duration: 6000,
              });
            } else {
              addToast({
                message: `🎉 LEVEL UP! Level ${updatedLevel.level}!`,
                type: 'success',
                duration: 4500,
              });
            }
          }

          addToast({
            message: `${language === 'vi' ? 'Đã hoàn thành' : 'Quest completed'} +${completion.xpEarned} XP`,
            type: 'success',
            action: {
              label: language === 'vi' ? 'Hoàn tác' : 'Undo',
              onClick: async () => {
                await completionService.undoCompletion(inst.id);
                await questGenerationService.updateDailyStats(completion.date);
                await loadQuests(true);
                await reloadLevel();
              },
            },
          });
        }
      }
    } else {
      // If no today instance, update template
      const currentTemplate = quest.subtasks ?? [];
      const updated = currentTemplate.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      await questService.update(quest.id, { subtasks: updated });
    }

    await loadQuests(true);
  };

  // Add inline subtask
  const handleAddInlineSubtask = async (quest: Quest, e?: React.FormEvent) => {
    e?.preventDefault();
    const title = (inlineSubtaskTitles[quest.id] || '').trim();
    if (!title) return;

    const newSt = { id: generateId(), title, completed: false };

    // Update template
    const templateSubtasks = quest.subtasks ?? [];
    const updatedTemplate = [...templateSubtasks, newSt];
    await questService.update(quest.id, { subtasks: updatedTemplate });

    // If today instance exists, update today instance as well
    const inst = todayInstancesMap.get(quest.id);
    if (inst) {
      const instSubtasks = inst.subtasks ?? [];
      const updatedInst = [...instSubtasks, newSt];
      const newStatus = inst.status === 'completed' ? 'pending' : inst.status;
      await questInstanceRepository.update({
        ...inst,
        status: newStatus,
        subtasks: updatedInst,
      });
    }

    setInlineSubtaskTitles(prev => ({ ...prev, [quest.id]: '' }));
    await loadQuests(true);
  };

  // Delete inline subtask
  const handleDeleteInlineSubtask = async (quest: Quest, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Update template
    const templateSubtasks = quest.subtasks ?? [];
    const updatedTemplate = templateSubtasks.filter(st => st.id !== subtaskId);
    await questService.update(quest.id, { subtasks: updatedTemplate });

    // If today instance exists, update instance
    const inst = todayInstancesMap.get(quest.id);
    if (inst && inst.subtasks) {
      const updatedInst = inst.subtasks.filter(st => st.id !== subtaskId);
      await questInstanceRepository.update({
        ...inst,
        subtasks: updatedInst,
      });
    }

    await loadQuests(true);
  };

  // Complete quest directly
  const handleCompleteQuest = async (quest: Quest, e: React.MouseEvent) => {
    e.stopPropagation();
    const inst = todayInstancesMap.get(quest.id);
    if (inst && inst.status === 'pending') {
      const completion = await completionService.completeQuest(inst.id);
      if (completion) {
        await questGenerationService.updateDailyStats(completion.date);
        playQuestCompleteSound(settings.soundEffects);
        const updatedLevel = await reloadLevel();

        if (updatedLevel && updatedLevel.level > prevLevelRef.current) {
          const promotion = checkRankPromotion(prevLevelRef.current, updatedLevel.level);
          prevLevelRef.current = updatedLevel.level;
          playLevelUpSound(settings.soundEffects);
          setShowConfetti(true);

          if (promotion.promoted) {
            addToast({
              message: `👑 ĐỘT PHÁ CẢNH GIỚI: Lên bậc ${promotion.newRank.titleVi} (${promotion.newRank.classVi})!`,
              type: 'success',
              duration: 6000,
            });
          } else {
            addToast({
              message: `🎉 LEVEL UP! Level ${updatedLevel.level}!`,
              type: 'success',
              duration: 4500,
            });
          }
        }

        addToast({
          message: `${language === 'vi' ? 'Đã hoàn thành' : 'Quest completed'} +${completion.xpEarned} XP`,
          type: 'success',
          action: {
            label: language === 'vi' ? 'Hoàn tác' : 'Undo',
            onClick: async () => {
              await completionService.undoCompletion(inst.id);
              await questGenerationService.updateDailyStats(completion.date);
              await loadQuests(true);
              await reloadLevel();
            },
          },
        });
      }
      await loadQuests(true);
    }
  };

  // Reopen quest directly
  const handleReopenQuest = async (quest: Quest, e: React.MouseEvent) => {
    e.stopPropagation();
    const inst = todayInstancesMap.get(quest.id);
    if (inst && inst.status === 'completed') {
      await completionService.reopenQuest(inst.id);
      addToast({ message: language === 'vi' ? 'Đã mở lại nhiệm vụ' : 'Quest reopened', type: 'info' });
      await loadQuests(true);
    }
  };

  // Skip quest directly
  const handleSkipQuest = async (quest: Quest, e: React.MouseEvent) => {
    e.stopPropagation();
    const inst = todayInstancesMap.get(quest.id);
    if (inst && inst.status === 'pending') {
      const completion = await completionService.skipQuest(inst.id);
      if (completion) {
        await questGenerationService.updateDailyStats(completion.date);
        addToast({ message: language === 'vi' ? 'Đã bỏ qua hôm nay' : 'Quest skipped', type: 'info' });
      }
      await loadQuests(true);
    }
  };

  // Undo skip directly
  const handleUndoSkipQuest = async (quest: Quest, e: React.MouseEvent) => {
    e.stopPropagation();
    const inst = todayInstancesMap.get(quest.id);
    if (inst && inst.status === 'skipped') {
      await completionService.undoSkip(inst.id);
      addToast({ message: language === 'vi' ? 'Đã khôi phục nhiệm vụ' : 'Quest restored', type: 'info' });
      await loadQuests(true);
    }
  };

  // Extract dynamic categories
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_CATEGORIES.forEach(c => set.add(c.trim()));
    rawList.forEach(q => {
      if (q.category && q.category.trim()) {
        set.add(q.category.trim());
      }
    });
    return ['All', ...Array.from(set)];
  }, [rawList]);

  // Filter & Sort list
  const filteredAndSortedList = useMemo(() => {
    const result = rawList.filter(q => {
      const inst = todayInstancesMap.get(q.id);

      // Status Filter
      if (selectedStatus === 'pending' && inst?.status !== 'pending') return false;
      if (selectedStatus === 'completed' && inst?.status !== 'completed') return false;
      if (selectedStatus === 'skipped' && inst?.status !== 'skipped') return false;

      // Search
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;

      // Difficulty
      if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;

      // Priority
      if (selectedPriority !== 'All' && q.priority !== selectedPriority) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'difficulty-desc') {
        return difficultyRank[b.difficulty] - difficultyRank[a.difficulty];
      }
      if (sortBy === 'xp-desc') {
        return b.xp - a.xp;
      }
      return 0;
    });

    return result;
  }, [rawList, todayInstancesMap, selectedStatus, searchQuery, selectedCategory, selectedDifficulty, selectedPriority, sortBy]);

  const hasActiveFilters =
    selectedStatus !== 'all' ||
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedPriority !== 'All' ||
    sortBy !== 'newest';

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedPriority('All');
    setSortBy('newest');
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{language === 'vi' ? 'Mẫu Nhiệm Vụ (Quest Templates)' : 'Quest Templates'}</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {language === 'vi' ? 'Các mẫu nhiệm vụ tự động hóa lặp lại hàng ngày hoặc hàng tuần' : 'Reusable task blueprints that materialize into daily quests'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleArchivedView}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              showArchived ? 'font-semibold' : ''
            }`}
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: showArchived ? 'var(--color-accent-light)' : 'transparent',
              color: showArchived ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? (language === 'vi' ? 'Nhiệm Vụ Đang Chạy' : 'Active Quests') : (language === 'vi' ? 'Đã Lưu Trữ' : 'Archived')}</span>
          </button>
        </div>
      </div>

      {/* Streamlined 2-Row Filter & Search Toolbar */}
      <div className="p-2.5 rounded-xl border space-y-2 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
        {/* Row 1: Search Input (Left) + Today's Status Filter Tabs (Right) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex items-center flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--color-text-tertiary)] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? "Tìm theo tên hoặc mô tả... (Gõ '/' để tìm nhanh)" : "Search by title or description... (Press '/' to focus)"}
              className="w-full pl-8 pr-12 py-1.5 text-xs rounded-lg border outline-none bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:border-[var(--color-accent)] transition-all font-medium"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-shrink-0">
            {[
              { id: 'all' as const, label: language === 'vi' ? 'Tất cả' : 'All', count: statusCounts.all },
              { id: 'pending' as const, label: language === 'vi' ? 'Cần làm' : 'Pending', count: statusCounts.pending },
              { id: 'completed' as const, label: language === 'vi' ? 'Đã xong' : 'Done', count: statusCounts.completed },
              { id: 'skipped' as const, label: language === 'vi' ? 'Bỏ qua' : 'Skipped', count: statusCounts.skipped },
            ].map(tab => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)] font-bold shadow-2xs'
                      : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`min-w-[18px] h-4 inline-flex items-center justify-center text-[10px] font-mono font-bold px-1 rounded-full text-center leading-none ${
                      isSelected
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Row & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          {/* Custom Dropdown Filters with Smooth Chevron Animation */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {/* Category Filter */}
            <FilterDropdown
              value={selectedCategory}
              options={dynamicCategories.map(cat => ({
                value: cat,
                label: cat === 'All' ? (language === 'vi' ? 'Tất cả danh mục' : 'All Categories') : cat,
              }))}
              onChange={setSelectedCategory}
              defaultValue="All"
              ariaLabel={language === 'vi' ? 'Lọc theo danh mục' : 'Filter by category'}
            />

            {/* Difficulty Filter */}
            <FilterDropdown
              value={selectedDifficulty}
              options={[
                { value: 'All', label: language === 'vi' ? 'Tất cả độ khó' : 'All Difficulties' },
                { value: 'easy', label: DIFFICULTY_LABELS.easy },
                { value: 'normal', label: DIFFICULTY_LABELS.normal },
                { value: 'hard', label: DIFFICULTY_LABELS.hard },
                { value: 'epic', label: DIFFICULTY_LABELS.epic },
              ]}
              onChange={setSelectedDifficulty}
              defaultValue="All"
              ariaLabel={language === 'vi' ? 'Lọc theo độ khó' : 'Filter by difficulty'}
            />

            {/* Priority Filter */}
            <FilterDropdown
              value={selectedPriority}
              options={[
                { value: 'All', label: language === 'vi' ? 'Tất cả ưu tiên' : 'All Priorities' },
                { value: 'high', label: PRIORITY_LABELS.high },
                { value: 'medium', label: PRIORITY_LABELS.medium },
                { value: 'low', label: PRIORITY_LABELS.low },
              ]}
              onChange={setSelectedPriority}
              defaultValue="All"
              ariaLabel={language === 'vi' ? 'Lọc theo độ ưu tiên' : 'Filter by priority'}
            />

            {/* Sort Filter */}
            <FilterDropdown
              value={sortBy}
              options={[
                { value: 'newest', label: language === 'vi' ? 'Mới nhất' : 'Newest' },
                { value: 'oldest', label: language === 'vi' ? 'Cũ nhất' : 'Oldest' },
                { value: 'title-asc', label: language === 'vi' ? 'Tên A-Z' : 'Title A-Z' },
                { value: 'difficulty-desc', label: language === 'vi' ? 'Độ khó cao nhất' : 'Highest Difficulty' },
                { value: 'xp-desc', label: language === 'vi' ? 'Nhiều XP nhất' : 'Highest XP' },
              ]}
              onChange={setSortBy}
              defaultValue="newest"
              ariaLabel={language === 'vi' ? 'Sắp xếp theo' : 'Sort by'}
            />

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="h-7 inline-flex items-center justify-center gap-1 px-2.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] hover:border-[var(--color-danger)] text-[var(--color-danger)] font-medium transition-all active:scale-[0.97] align-middle"
                title={language === 'vi' ? 'Xóa bộ lọc' : 'Reset filters'}
              >
                <X className="w-3 h-3" />
                <span>{language === 'vi' ? 'Đặt lại' : 'Reset'}</span>
              </button>
            )}
          </div>

          {/* Right side: Result counter & View switcher */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono font-medium">
              {filteredAndSortedList.length}/{rawList.length} {language === 'vi' ? 'mẫu' : 'templates'}
            </span>

            {/* View Mode Switcher: Grid vs Compact List */}
            <div className="flex items-center p-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                title={language === 'vi' ? 'Chế độ Lưới (Grid View)' : 'Grid View'}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                title={language === 'vi' ? 'Chế độ Danh sách gọn (Compact List View)' : 'Compact List View'}
                aria-label="Compact List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates List / Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-tertiary)]">
          {language === 'vi' ? 'Đang tải danh sách mẫu nhiệm vụ...' : 'Loading templates...'}
        </div>
      ) : filteredAndSortedList.length === 0 ? (
        <div
          className="p-10 text-center rounded-xl border border-dashed text-xs space-y-2"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}
        >
          <div className="font-semibold text-sm text-[var(--color-text-secondary)]">
            {language === 'vi' ? 'Không tìm thấy mẫu nhiệm vụ nào' : 'No quest templates found'}
          </div>
          <p>
            {hasActiveFilters
              ? (language === 'vi' ? 'Hãy thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.' : 'Try adjusting your search keywords or active filters.')
              : (language === 'vi' ? 'Hãy tạo mẫu nhiệm vụ đầu tiên để bắt đầu tự động hóa ngày mới!' : 'Create your first template to get started!')}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-accent)]"
            >
              <X className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Xóa toàn bộ bộ lọc' : 'Clear all filters'}</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* Compact List View with expandable row */
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden divide-y divide-[var(--color-border)]">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-2 px-3.5 py-2 text-[11px] font-semibold text-[var(--color-text-tertiary)] bg-[var(--color-bg-primary)]">
            <div className="col-span-5 sm:col-span-4">{language === 'vi' ? 'Tên Nhiệm Vụ' : 'Quest Title'}</div>
            <div className="col-span-2 hidden sm:block">{language === 'vi' ? 'Trạng thái' : 'Status'}</div>
            <div className="col-span-2 hidden sm:block">{language === 'vi' ? 'Danh mục' : 'Category'}</div>
            <div className="col-span-3 sm:col-span-2 text-right sm:text-left">XP / {language === 'vi' ? 'Độ khó' : 'Difficulty'}</div>
            <div className="col-span-4 sm:col-span-2 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</div>
          </div>

          {filteredAndSortedList.map((quest) => {
            const todayInst = todayInstancesMap.get(quest.id);
            const isExpanded = expandedQuestIds.has(quest.id);
            const subtasks = todayInst?.subtasks ?? quest.subtasks ?? [];
            const completedSubtasks = subtasks.filter(s => s.completed).length;
            const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

            return (
              <div
                key={quest.id}
                tabIndex={0}
                role="button"
                onClick={(e) => toggleExpand(quest.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(quest.id);
                  }
                }}
                className="group transition-colors cursor-pointer hover:bg-[var(--color-bg-primary)] focus:outline-none focus:bg-[var(--color-bg-primary)]"
              >
                <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center text-xs">
                  {/* Title + Subtask count badge */}
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                    <span
                      className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] truncate min-w-0 leading-tight"
                      title={quest.description || quest.title}
                    >
                      {quest.title}
                    </span>
                    {subtasks.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] border-[var(--color-border)] flex-shrink-0">
                        {completedSubtasks}/{subtasks.length}
                      </span>
                    )}
                  </div>

                  {/* Today Status Badge */}
                  <div className="col-span-2 hidden sm:flex items-center min-w-0">
                    {todayInst?.status === 'completed' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(16,185,129,0.12)] text-[var(--color-success)] border border-[rgba(16,185,129,0.25)] flex items-center gap-1">
                        <CheckSquare2 className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đã xong' : 'Done'}</span>
                      </span>
                    )}
                    {todayInst?.status === 'skipped' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(245,158,11,0.12)] text-[var(--color-xp)] border border-[rgba(245,158,11,0.25)] flex items-center gap-1">
                        <SkipForward className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Bỏ qua' : 'Skipped'}</span>
                      </span>
                    )}
                    {todayInst?.status === 'pending' && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Cần làm' : 'Pending'}</span>
                      </span>
                    )}
                    {!todayInst && (
                      <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                        {language === 'vi' ? 'Theo lịch' : 'Scheduled'}
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="col-span-2 hidden sm:flex items-center min-w-0">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] truncate">
                      {quest.category}
                    </span>
                  </div>

                  {/* XP & Difficulty */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end sm:justify-start gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold text-[var(--color-xp)] bg-[rgba(245,158,11,0.1)]">
                      +{quest.xp} XP
                    </span>
                    <span className="text-[10px] hidden md:inline text-[var(--color-text-tertiary)] capitalize">
                      {quest.difficulty}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!showArchived && (
                      <button
                        type="button"
                        onClick={() => setEditingQuest(quest)}
                        className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
                        title={language === 'vi' ? 'Chỉnh sửa mẫu' : 'Edit template'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(quest)}
                      className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                      title={quest.archived ? (language === 'vi' ? 'Khôi phục' : 'Restore') : (language === 'vi' ? 'Lưu trữ' : 'Archive')}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuest(quest.id)}
                      className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-colors"
                      title={language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Accordion (Overview-style) */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] space-y-2.5 text-xs animate-in fade-in duration-100" onClick={(e) => e.stopPropagation()}>
                    {quest.description && (
                      <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed pb-1 break-words">
                        <span className="font-semibold text-[11px] text-[var(--color-text-primary)] mb-0.5 block">
                          {language === 'vi' ? 'Mô tả nhiệm vụ:' : 'Description:'}
                        </span>
                        {renderFormattedText(quest.description)}
                      </div>
                    )}

                    {/* Subtasks Section */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                          <span>Subtasks:</span>
                          <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                            {completedSubtasks}/{subtasks.length} ({progressPercent}%)
                          </span>
                        </div>

                        {progressPercent === 100 && todayInst?.status === 'pending' && (
                          <button
                            type="button"
                            onClick={(e) => handleCompleteQuest(quest, e)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-success)] hover:underline"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>{language === 'vi' ? 'Hoàn thành ngay' : 'Complete now'}</span>
                          </button>
                        )}
                      </div>

                      {/* Subtask Progress Bar */}
                      {subtasks.length > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPercent}%`,
                              backgroundColor:
                                progressPercent === 100
                                  ? 'var(--color-success)'
                                  : 'var(--color-accent)',
                            }}
                          />
                        </div>
                      )}

                      {/* Subtasks checklist items */}
                      {subtasks.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {subtasks.map(st => (
                            <div
                              key={st.id}
                              onClick={(e) => handleToggleSubtask(quest, st.id, e)}
                              className="group/st flex items-center justify-between p-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 mr-2 flex-1">
                                <button
                                  type="button"
                                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                                  style={{
                                    borderColor: st.completed ? 'var(--color-success)' : 'var(--color-border)',
                                    backgroundColor: st.completed ? 'var(--color-success)' : 'transparent',
                                  }}
                                >
                                  {st.completed ? (
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M2 6l3 3 5-5" />
                                    </svg>
                                  ) : null}
                                </button>
                                <span className={`truncate ${st.completed ? 'line-through opacity-60' : ''}`}>
                                  {st.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteInlineSubtask(quest, st.id, e)}
                                className="opacity-0 group-hover/st:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] p-0.5 transition-opacity"
                                title="Delete subtask"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--color-text-tertiary)] italic">
                          {language === 'vi' ? 'Chưa có subtask nào.' : 'No subtasks configured yet.'}
                        </div>
                      )}

                      {/* Inline Add Subtask */}
                      {!showArchived && (
                        <form onSubmit={(e) => handleAddInlineSubtask(quest, e)} className="flex items-center gap-1.5 pt-1.5">
                          <input
                            type="text"
                            value={inlineSubtaskTitles[quest.id] || ''}
                            onChange={(e) => setInlineSubtaskTitles(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            placeholder={language === 'vi' ? '+ Thêm subtask mới...' : '+ Add subtask...'}
                            className="flex-1 px-2.5 py-1 text-xs rounded-md border outline-none bg-[var(--color-bg-secondary)] border-[var(--color-border)] focus:border-[var(--color-accent)]"
                          />
                          <button
                            type="submit"
                            disabled={!(inlineSubtaskTitles[quest.id] || '').trim()}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Quick status actions for today */}
                    {todayInst && (
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-1.5">
                          {todayInst.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleCompleteQuest(quest, e)}
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[var(--color-success)] hover:opacity-90 transition-all duration-150 active:scale-[0.97] shadow-2xs leading-none align-middle"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>{language === 'vi' ? 'Hoàn thành' : 'Complete'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSkipQuest(quest, e)}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] transition-all duration-150 active:scale-[0.97] leading-none align-middle"
                              >
                                <SkipForward className="w-3 h-3" />
                                <span>{language === 'vi' ? 'Bỏ qua' : 'Skip'}</span>
                              </button>
                            </>
                          )}
                          {todayInst.status === 'completed' && (
                            <button
                              type="button"
                              onClick={(e) => handleReopenQuest(quest, e)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-accent)] transition-all duration-150 active:scale-[0.97] leading-none align-middle"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{language === 'vi' ? 'Mở lại' : 'Reopen'}</span>
                            </button>
                          )}
                          {todayInst.status === 'skipped' && (
                            <button
                              type="button"
                              onClick={(e) => handleUndoSkipQuest(quest, e)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-accent)] transition-all duration-150 active:scale-[0.97] leading-none align-middle"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{language === 'vi' ? 'Khôi phục' : 'Restore'}</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingQuest(quest)}
                          className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--color-accent)] hover:underline leading-none align-middle"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{language === 'vi' ? 'Sửa mẫu' : 'Edit blueprint'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Minimalist Template Gallery Grid with Overview-style Card Expand */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
          {filteredAndSortedList.map((quest) => {
            const todayInst = todayInstancesMap.get(quest.id);
            const isExpanded = expandedQuestIds.has(quest.id);
            const subtasks = todayInst?.subtasks ?? quest.subtasks ?? [];
            const completedSubtasks = subtasks.filter(s => s.completed).length;
            const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

            return (
              <div
                key={quest.id}
                tabIndex={0}
                role="button"
                aria-label={`Toggle details for ${quest.title}`}
                onClick={(e) => toggleExpand(quest.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(quest.id);
                  }
                }}
                className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none min-w-0 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                  isExpanded
                    ? 'bg-[var(--color-bg-secondary)] border-[var(--color-accent)] shadow-xs ring-1 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] hover:border-[var(--color-accent)] hover:shadow-xs'
                }`}
              >
                {/* Top Section: Title & Status Badge & Actions */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1.5 min-w-0">
                    <h3
                      className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug break-words min-w-0 flex-1"
                      title={quest.title}
                    >
                      {quest.title}
                    </h3>

                    {/* Quick Actions on Hover / Keyboard Focus */}
                    <div
                      className="flex items-center gap-0.5 flex-shrink-0 -mr-1 -mt-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!showArchived && (
                        <button
                          type="button"
                          onClick={() => setEditingQuest(quest)}
                          className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-primary)] transition-colors"
                          title={language === 'vi' ? 'Chỉnh sửa mẫu' : 'Edit template'}
                          aria-label="Edit template"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(quest)}
                        className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-colors"
                        title={quest.archived ? (language === 'vi' ? 'Khôi phục' : 'Restore') : (language === 'vi' ? 'Lưu trữ' : 'Archive')}
                        aria-label="Archive template"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuest(quest.id)}
                        className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg-primary)] transition-colors"
                        title={language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}
                        aria-label="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status indicator badge for today */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {todayInst?.status === 'completed' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(16,185,129,0.12)] text-[var(--color-success)] border border-[rgba(16,185,129,0.25)] flex items-center gap-1 flex-shrink-0">
                        <CheckSquare2 className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đã xong' : 'Done'}</span>
                      </span>
                    )}
                    {todayInst?.status === 'skipped' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(245,158,11,0.12)] text-[var(--color-xp)] border border-[rgba(245,158,11,0.25)] flex items-center gap-1 flex-shrink-0">
                        <SkipForward className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Bỏ qua' : 'Skipped'}</span>
                      </span>
                    )}
                    {todayInst?.status === 'pending' && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)] flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Cần làm' : 'Pending'}</span>
                      </span>
                    )}

                    {/* Description preview in collapsed state */}
                    {!isExpanded && quest.description && (
                      <p className="text-[11px] text-[var(--color-text-tertiary)] line-clamp-1 break-words">
                        {quest.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Details: Overview-style Description & Subtask Checklist */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2.5 text-xs animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                    {/* Formatted Description */}
                    {quest.description && (
                      <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed pb-1 break-words">
                        <span className="font-semibold text-[11px] text-[var(--color-text-primary)] mb-0.5 block">
                          {language === 'vi' ? 'Mô tả chi tiết:' : 'Description:'}
                        </span>
                        {renderFormattedText(quest.description)}
                      </div>
                    )}

                    {/* Subtasks Section */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                          <span>Subtasks:</span>
                          <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                            {completedSubtasks}/{subtasks.length} ({progressPercent}%)
                          </span>
                        </div>

                        {progressPercent === 100 && todayInst?.status === 'pending' && (
                          <button
                            type="button"
                            onClick={(e) => handleCompleteQuest(quest, e)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-success)] hover:underline"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>{language === 'vi' ? 'Hoàn thành ngay' : 'Complete now'}</span>
                          </button>
                        )}
                      </div>

                      {/* Subtask Progress Bar */}
                      {subtasks.length > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPercent}%`,
                              backgroundColor:
                                progressPercent === 100
                                  ? 'var(--color-success)'
                                  : 'var(--color-accent)',
                            }}
                          />
                        </div>
                      )}

                      {/* Checklist */}
                      {subtasks.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {subtasks.map(st => (
                            <div
                              key={st.id}
                              onClick={(e) => handleToggleSubtask(quest, st.id, e)}
                              className="group/st flex items-center justify-between p-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 mr-2 flex-1">
                                <button
                                  type="button"
                                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                                  style={{
                                    borderColor: st.completed ? 'var(--color-success)' : 'var(--color-border)',
                                    backgroundColor: st.completed ? 'var(--color-success)' : 'transparent',
                                  }}
                                >
                                  {st.completed ? (
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M2 6l3 3 5-5" />
                                    </svg>
                                  ) : null}
                                </button>
                                <span className={`truncate ${st.completed ? 'line-through opacity-60' : ''}`}>
                                  {st.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteInlineSubtask(quest, st.id, e)}
                                className="opacity-0 group-hover/st:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] p-0.5 transition-opacity"
                                title="Delete subtask"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--color-text-tertiary)] italic">
                          {language === 'vi' ? 'Chưa có subtask nào.' : 'No subtasks configured yet.'}
                        </div>
                      )}

                      {/* Inline Add Subtask */}
                      {!showArchived && (
                        <form onSubmit={(e) => handleAddInlineSubtask(quest, e)} className="flex items-center gap-1.5 pt-1.5">
                          <input
                            type="text"
                            value={inlineSubtaskTitles[quest.id] || ''}
                            onChange={(e) => setInlineSubtaskTitles(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            placeholder={language === 'vi' ? '+ Thêm bước thực hiện...' : '+ Add subtask...'}
                            className="flex-1 px-2.5 py-1 text-xs rounded-md border outline-none bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:border-[var(--color-accent)]"
                          />
                          <button
                            type="submit"
                            disabled={!(inlineSubtaskTitles[quest.id] || '').trim()}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Quick status actions for today */}
                    {todayInst && (
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-1.5">
                          {todayInst.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleCompleteQuest(quest, e)}
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[var(--color-success)] hover:opacity-90 transition-all duration-150 active:scale-[0.97] shadow-2xs leading-none align-middle"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>{language === 'vi' ? 'Hoàn thành' : 'Complete'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSkipQuest(quest, e)}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] transition-all duration-150 active:scale-[0.97] leading-none align-middle"
                              >
                                <SkipForward className="w-3 h-3" />
                                <span>{language === 'vi' ? 'Bỏ qua' : 'Skip'}</span>
                              </button>
                            </>
                          )}
                          {todayInst.status === 'completed' && (
                            <button
                              type="button"
                              onClick={(e) => handleReopenQuest(quest, e)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-accent)] transition-all duration-150 active:scale-[0.97] leading-none align-middle"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{language === 'vi' ? 'Mở lại' : 'Reopen'}</span>
                            </button>
                          )}
                          {todayInst.status === 'skipped' && (
                            <button
                              type="button"
                              onClick={(e) => handleUndoSkipQuest(quest, e)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-accent)] transition-all duration-150 active:scale-[0.97] leading-none align-middle"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{language === 'vi' ? 'Khôi phục' : 'Restore'}</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingQuest(quest)}
                          className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--color-accent)] hover:underline leading-none align-middle"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{language === 'vi' ? 'Sửa mẫu' : 'Edit blueprint'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Row: Metadata & Expand indicator */}
                <div className="flex items-center justify-between gap-1.5 pt-2.5 text-[10px] min-w-0 border-t border-[var(--color-border)] mt-2">
                  {/* Left: Category & Recurrence & Subtasks */}
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span className="font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] truncate">
                      {quest.category}
                    </span>

                    <span className="flex items-center gap-0.5 text-[var(--color-text-tertiary)] flex-shrink-0 capitalize">
                      <Calendar className="w-3 h-3" />
                      <span>{quest.recurrence.type}</span>
                    </span>

                    {subtasks.length > 0 && !isExpanded && (
                      <span
                        className="flex items-center gap-0.5 font-mono text-[var(--color-text-tertiary)] flex-shrink-0"
                        title={`${subtasks.length} subtasks`}
                      >
                        <CheckSquare2 className="w-3 h-3 text-[var(--color-accent)]" />
                        <span>{completedSubtasks}/{subtasks.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Right: +XP */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(245,158,11,0.1)] text-[var(--color-xp)] border border-[rgba(245,158,11,0.2)]">
                      +{quest.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Edit Quest Modal (Handles template properties editing) */}
      {editingQuest && (
        <EditQuestDialog
          isOpen={true}
          quest={editingQuest}
          onClose={() => setEditingQuest(null)}
          onUpdate={handleUpdateQuest}
          onArchive={handleArchiveQuest}
          onUnarchive={handleUnarchiveQuest}
          onDelete={handleDeleteQuest}
        />
      )}

      {/* Confetti Celebration on Level Up */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
