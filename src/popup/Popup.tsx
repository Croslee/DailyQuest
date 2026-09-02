import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Flame, LayoutDashboard, Plus, Eye, EyeOff } from 'lucide-react';
import { useTodayInstances, type TodayInstance } from '@/hooks/useTodayInstances';
import { useStreak } from '@/hooks/useStreak';
import { useLevelInfo } from '@/hooks/useStatistics';
import { useSettings } from '@/hooks/useSettings';
import { completionService } from '@/services/completionService';
import { questGenerationService } from '@/services/questGenerationService';
import { QuestList } from '@/components/quest/QuestList';
import { AddQuestDialog } from '@/components/quest/AddQuestDialog';
import { EditQuestDialog } from '@/components/quest/EditQuestDialog';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { StreakBadge } from '@/components/progress/StreakBadge';
import { ToastContainer, type ToastData } from '@/components/ui/Toast';
import { Confetti } from '@/components/ui/Confetti';
import { FocusTimerModal } from '@/components/pomodoro/FocusTimerModal';
import { playQuestCompleteSound, playLevelUpSound } from '@/utils/audio';
import { useTranslation } from '@/i18n/I18nContext';
import type { CreateQuestInput, Quest } from '@/types/quest';
import type { Achievement } from '@/types/achievement';
import { questService } from '@/services/questService';
import { achievementService } from '@/services/achievementService';
import { generateId } from '@/utils/id';
import { tomorrow } from '@/utils/date';
import { onDataChanged } from '@/services/syncChannel';
import { getRankForLevel, checkRankPromotion } from '@/domain/rank';

type PopupFilterTab = 'all' | 'pending' | 'high' | 'completed';

/**
 * Popup — The main browser extension popup.
 * Shows today's quests, progress, and streak.
 */
export const Popup: React.FC = () => {
  const { instances, score, loading, reload } = useTodayInstances();
  const { streak, reload: reloadStreak } = useStreak();
  const { level, reload: reloadLevel } = useLevelInfo();
  const { settings, updateSetting } = useSettings();
  const { t, language } = useTranslation();
  const [filterTab, setFilterTab] = useState<PopupFilterTab>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [focusInstance, setFocusInstance] = useState<TodayInstance | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [equippedAchievement, setEquippedAchievement] = useState<Achievement | null>(null);
  const prevLevelRef = useRef<number>(level.level);

  const refreshEquippedBadge = useCallback(async () => {
    if (settings.equippedBadgeId) {
      const achs = await achievementService.getAchievements();
      const found = achs.find(a => a.id === settings.equippedBadgeId);
      setEquippedAchievement(found || null);
    } else {
      setEquippedAchievement(null);
    }
  }, [settings.equippedBadgeId]);

  useEffect(() => {
    refreshEquippedBadge();
  }, [refreshEquippedBadge]);

  useEffect(() => {
    const unsubscribe = onDataChanged(() => {
      reload();
      reloadStreak();
      reloadLevel();
      refreshEquippedBadge();
    });
    return () => unsubscribe();
  }, [reload, reloadStreak, reloadLevel, refreshEquippedBadge]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    setToasts(prev => [...prev, { ...toast, id: generateId() }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleComplete = useCallback(async (instanceId: string) => {
    const completion = await completionService.completeQuest(instanceId);
    if (completion) {
      playQuestCompleteSound(settings.soundEffects);

      await questGenerationService.updateDailyStats(completion.date);
      await reload();
      await reloadStreak();
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
          label: t('common.undo'),
          onClick: async () => {
            await completionService.undoCompletion(instanceId);
            await questGenerationService.updateDailyStats(completion.date);
            await reload();
            await reloadStreak();
            await reloadLevel();
          },
        },
      });
    }
  }, [reload, reloadStreak, reloadLevel, addToast, settings.soundEffects, language, t]);

  const handleSkip = useCallback(async (instanceId: string) => {
    const completion = await completionService.skipQuest(instanceId);
    if (completion) {
      await questGenerationService.updateDailyStats(completion.date);
      await reload();
      addToast({ message: language === 'vi' ? 'Đã bỏ qua hôm nay' : 'Quest skipped', type: 'info' });
    }
  }, [reload, addToast, language]);

  const handlePostpone = useCallback(async (instanceId: string) => {
    const newInstance = await completionService.postponeQuest(instanceId, tomorrow());
    if (newInstance) {
      await reload();
      addToast({ message: language === 'vi' ? 'Đã dời sang ngày mai' : 'Quest postponed to tomorrow', type: 'info' });
    }
  }, [reload, addToast, language]);

  const handleAddQuest = useCallback(async (input: CreateQuestInput) => {
    await questService.create(input);
    await questGenerationService.generateForToday();
    await reload();
    await reloadStreak();
    addToast({ message: language === 'vi' ? 'Đã tạo nhiệm vụ mới!' : 'Quest created!', type: 'success' });
  }, [reload, reloadStreak, addToast, language]);

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  };

  // Real-time synchronization subscription
  React.useEffect(() => {
    const unsub = onDataChanged(() => {
      reload();
      reloadStreak();
      reloadLevel();
    });
    return unsub;
  }, [reload, reloadStreak, reloadLevel]);

  // Pre-calculate tab metrics
  const pendingCount = useMemo(() => instances.filter(i => i.status === 'pending').length, [instances]);
  const highCount = useMemo(() => instances.filter(i => i.quest?.priority === 'high' && i.status === 'pending').length, [instances]);
  const completedCount = useMemo(() => instances.filter(i => i.status === 'completed').length, [instances]);

  // Filter instances based on selected Tab
  const filteredInstances = useMemo(() => {
    return instances.filter(i => {
      if (filterTab === 'pending') return i.status === 'pending';
      if (filterTab === 'high') return i.quest?.priority === 'high';
      if (filterTab === 'completed') return i.status === 'completed';
      return true;
    });
  }, [instances, filterTab]);

  return (
    <div className="flex flex-col h-[560px] max-h-[580px] w-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-bold">DailyQuest</h1>
          {(() => {
            const rank = getRankForLevel(level.level);
            return (
              <span
                className="px-1.5 py-0.2 rounded text-[10px] font-bold border font-mono flex items-center gap-1 truncate"
                style={{
                  color: rank.color,
                  backgroundColor: rank.badgeBg,
                  borderColor: rank.badgeBorder,
                }}
                title={`${rank.titleVi} (${rank.classVi})`}
              >
                <span>Lv.{level.level}</span>
                <span>·</span>
                <span className="truncate">{rank.titleVi.split(' ')[0]}</span>
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-1.5">
          <StreakBadge streak={streak.currentStreak} />

          {/* Quick Toggle Hide/Show Completed */}
          <button
            onClick={() => updateSetting('hideCompleted', !settings.hideCompleted)}
            className={`p-1.5 rounded-md transition-colors ${
              settings.hideCompleted
                ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
            }`}
            title={
              settings.hideCompleted
                ? (language === 'vi' ? 'Đang ẩn việc đã xong (Bấm để hiện)' : 'Completed hidden (Click to show)')
                : (language === 'vi' ? 'Đang hiện việc đã xong (Bấm để ẩn)' : 'Completed shown (Click to hide)')
            }
            aria-label="Toggle hide completed"
          >
            {settings.hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={openDashboard}
            className="p-1.5 rounded-md transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Open Dashboard"
            aria-label="Open Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <ProgressBar
          completed={score.completed}
          total={score.actionable}
          score={score.score}
        />
      </div>

      {/* Status & Priority Quick Filter Tabs Bar */}
      {instances.length > 0 && (
        <div className="px-4 pb-2.5 flex items-center justify-between border-b text-xs flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-1">
            {[
              { id: 'all' as const, label: language === 'vi' ? 'Tất cả' : 'All', count: instances.length },
              { id: 'pending' as const, label: language === 'vi' ? 'Cần làm' : 'Pending', count: pendingCount },
              { id: 'high' as const, label: language === 'vi' ? 'Ưu tiên' : 'High', count: highCount },
              { id: 'completed' as const, label: language === 'vi' ? 'Đã xong' : 'Done', count: completedCount },
            ].map(tab => {
              const isSelected = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`min-w-[16px] h-3.5 inline-flex items-center justify-center text-[9px] font-mono font-bold px-1 rounded-full text-center leading-none ${
                      isSelected
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quest List — Strictly confined scroll area */}
      <div className="flex-1 min-h-0 px-4 py-1.5 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-2 py-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center px-3 gap-2.5 opacity-60"
              >
                <div className="w-4 h-4 rounded bg-[var(--color-bg-tertiary)]" />
                <div
                  className="h-3.5 rounded bg-[var(--color-bg-tertiary)]"
                  style={{ width: i === 1 ? '60%' : i === 2 ? '45%' : '75%' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <QuestList
            instances={filteredInstances}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onPostpone={handlePostpone}
            onStartFocus={(inst) => setFocusInstance(inst)}
            onEditQuest={(q) => setEditingQuest(q)}
            hideCompleted={filterTab === 'all' ? settings.hideCompleted : false}
            onAddQuest={() => setShowAddDialog(true)}
            onUpdated={reload}
            isCompletedTab={filterTab === 'completed'}
            emptyTitle={filterTab === 'completed' ? (language === 'vi' ? 'Chưa có nhiệm vụ nào hoàn thành' : 'No completed quests yet') : undefined}
            emptyDescription={filterTab === 'completed' ? (language === 'vi' ? 'Các nhiệm vụ đã hoàn thành hôm nay sẽ xuất hiện tại đây.' : 'Completed quests for today will appear here.') : undefined}
          />
        )}
      </div>

      {/* Add Quest Button (Hidden when on Completed tab) */}
      {filterTab !== 'completed' && (
        <div className="px-4 py-2 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-accent)] leading-none align-middle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('common.addQuest')}</span>
          </button>
        </div>
      )}

      {/* Level footer with Unified Single Badge (Compact Inline) */}
      {(() => {
        const rank = getRankForLevel(level.level);
        const activeBadgeTitle = equippedAchievement
          ? (language === 'vi' ? (equippedAchievement.titleVi || equippedAchievement.title) : equippedAchievement.title)
          : (language === 'vi' ? rank.titleVi.split(' ')[0] : rank.classEn);
        const activeBadgeIcon = equippedAchievement?.icon;
        const tooltip = equippedAchievement
          ? (language === 'vi' ? `Huy hiệu: ${activeBadgeTitle}` : `Badge: ${activeBadgeTitle}`)
          : (language === 'vi' ? `Cấp bậc: ${rank.titleVi}` : `Rank: ${rank.titleEn}`);

        return (
          <div className="px-4 py-2 border-t text-xs space-y-1.5" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="font-bold text-sm text-[var(--color-text-primary)] shrink-0">Lv.{level.level}</span>
                {equippedAchievement ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border font-mono tracking-wide shadow-2xs bg-[var(--color-bg-secondary)] border-[var(--color-accent)] text-[var(--color-accent)]"
                    title={tooltip}
                  >
                    <span className="shrink-0">{activeBadgeIcon}</span>
                    <span className="leading-tight">{activeBadgeTitle}</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border font-mono tracking-wide shadow-2xs"
                    style={{
                      color: rank.color,
                      backgroundColor: rank.badgeBg,
                      borderColor: rank.badgeBorder,
                    }}
                    title={tooltip}
                  >
                    <span className="leading-tight">{activeBadgeTitle}</span>
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)] shrink-0">{level.currentLevelXP} / {level.nextLevelXP} XP</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${level.progress}%`, backgroundColor: rank.color }} />
            </div>
          </div>
        );
      })()}

      {/* Add Quest Dialog */}
      <AddQuestDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddQuest}
      />

      {/* Edit Quest Dialog */}
      <EditQuestDialog
        quest={editingQuest}
        isOpen={editingQuest !== null}
        onClose={() => setEditingQuest(null)}
        onUpdate={async (id, input) => {
          await questService.update(id, input);
          await reload();
        }}
        onArchive={async (id) => {
          await questService.archive(id);
          await reload();
        }}
        onDelete={async (id) => {
          await questService.delete(id);
          await reload();
        }}
      />

      {/* Focus Timer Modal */}
      <FocusTimerModal
        isOpen={focusInstance !== null}
        onClose={() => setFocusInstance(null)}
        questTitle={focusInstance?.quest?.title}
        onCompleteQuest={focusInstance ? () => handleComplete(focusInstance.id) : undefined}
      />

      {/* Confetti Celebration */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} className="bottom-14" />
    </div>
  );
};
