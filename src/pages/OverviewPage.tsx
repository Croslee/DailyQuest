import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTodayInstances, type TodayInstance } from '@/hooks/useTodayInstances';
import { useStreak } from '@/hooks/useStreak';
import { useLevelInfo, useStatistics } from '@/hooks/useStatistics';
import { useSettings } from '@/hooks/useSettings';
import { completionService } from '@/services/completionService';
import { questGenerationService } from '@/services/questGenerationService';
import { questService } from '@/services/questService';
import { QuestList } from '@/components/quest/QuestList';
import { AddQuestDialog } from '@/components/quest/AddQuestDialog';
import { EditQuestDialog } from '@/components/quest/EditQuestDialog';
import { ContributionChart } from '@/components/charts/ContributionChart';
import { ToastContainer, type ToastData } from '@/components/ui/Toast';
import { Confetti } from '@/components/ui/Confetti';
import { FocusTimerModal } from '@/components/pomodoro/FocusTimerModal';
import { BackupReminderBanner } from '@/components/backup/BackupReminderBanner';
import { playQuestCompleteSound, playLevelUpSound } from '@/utils/audio';
import { useTranslation } from '@/i18n/I18nContext';
import type { CreateQuestInput, Quest } from '@/types/quest';
import { getLocalDateKey, formatDateKey, tomorrow } from '@/utils/date';
import { generateId } from '@/utils/id';
import { onDataChanged } from '@/services/syncChannel';
import { getRankForLevel, checkRankPromotion } from '@/domain/rank';
import {
  Flame,
  Sparkles,
  Trophy,
  Plus,
  ArrowRight,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface OverviewPageProps {
  onNavigateToCalendar?: (dateKey?: string) => void;
  onNavigateToQuests?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToCalendar,
  onNavigateToQuests,
}) => {
  const todayKey = getLocalDateKey();
  const { instances, score, loading: loadingInstances, reload: reloadInstances } = useTodayInstances();
  const { streak, reload: reloadStreak } = useStreak();
  const { level, reload: reloadLevel } = useLevelInfo();
  const { summary, reload: reloadSummary } = useStatistics();
  const { settings } = useSettings();
  const { t, language } = useTranslation();

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed' | 'skipped'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [focusInstance, setFocusInstance] = useState<TodayInstance | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevLevelRef = useRef<number>(level.level);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    setToasts(prev => [...prev, { ...toast, id: generateId() }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([
      reloadInstances(),
      reloadStreak(),
      reloadLevel(),
      reloadSummary(),
    ]);
  }, [reloadInstances, reloadStreak, reloadLevel, reloadSummary]);

  // Real-time synchronization subscription
  useEffect(() => {
    const unsubscribe = onDataChanged(() => {
      reloadAll();
    });
    return unsubscribe;
  }, [reloadAll]);

  const handleComplete = useCallback(async (instanceId: string) => {
    const completion = await completionService.completeQuest(instanceId);
    if (completion) {
      playQuestCompleteSound(settings.soundEffects);

      await questGenerationService.updateDailyStats(completion.date);
      await reloadInstances();
      await reloadStreak();
      const updatedLevel = await reloadLevel();
      await reloadSummary();

      // Check level up celebration & Shadow Slave rank promotion
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
            await reloadAll();
          },
        },
      });
    }
  }, [reloadAll, reloadInstances, reloadStreak, reloadLevel, reloadSummary, addToast, settings.soundEffects, language, t]);

  const handleSkip = useCallback(async (instanceId: string) => {
    const completion = await completionService.skipQuest(instanceId);
    if (completion) {
      await questGenerationService.updateDailyStats(completion.date);
      await reloadAll();
      addToast({ message: language === 'vi' ? 'Đã bỏ qua hôm nay' : 'Quest skipped', type: 'info' });
    }
  }, [reloadAll, addToast, language]);

  const handlePostpone = useCallback(async (instanceId: string) => {
    const newInstance = await completionService.postponeQuest(instanceId, tomorrow());
    if (newInstance) {
      await reloadAll();
      addToast({ message: language === 'vi' ? 'Đã dời sang ngày mai' : 'Quest postponed to tomorrow', type: 'info' });
    }
  }, [reloadAll, addToast, language]);

  const handleAddQuest = useCallback(async (input: CreateQuestInput) => {
    await questService.create(input);
    await questGenerationService.generateForToday();
    await reloadAll();
    addToast({ message: language === 'vi' ? 'Đã tạo nhiệm vụ mới!' : 'Quest created!', type: 'success' });
  }, [reloadAll, addToast, language]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('overview.goodMorning') : hour < 18 ? t('overview.goodAfternoon') : t('overview.goodEvening');

  return (
    <div className="space-y-6">
      {/* Periodic Backup Reminder Banner */}
      <BackupReminderBanner />

      {/* Welcome & Date */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{greeting}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {formatDateKey(todayKey)} · {t('overview.tagline')}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Today's Score */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{t('overview.todayProgress')}</span>
            <TrendingUp className="w-4 h-4" style={{ color: score.isSuccessful ? 'var(--color-success)' : 'var(--color-accent)' }} />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold">
              {score.completed} / {score.actionable}
            </div>
            <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${score.actionable > 0 ? (score.completed / score.actionable) * 100 : 0}%`,
                  backgroundColor: score.isSuccessful ? 'var(--color-success)' : 'var(--color-accent)',
                }}
              />
            </div>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {Math.round(score.score)}% {t('overview.completionRate')}
          </div>
        </div>

        {/* Current Streak */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{t('common.streak')}</span>
            <Flame className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: 'var(--color-xp)' }}>
              <span>{streak.currentStreak}</span>
              <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>{t('common.days')}</span>
            </div>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('overview.bestStreak')}: {streak.bestStreak} {t('common.days')}
          </div>
        </div>

        {/* Level & XP with Shadow Slave Rank */}
        {(() => {
          const rank = getRankForLevel(level.level);
          return (
            <div
              className="p-4 rounded-xl border flex flex-col justify-between transition-all"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <span>{t('common.level')} & XP</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 font-mono transition-colors"
                  style={{
                    color: rank.color,
                    backgroundColor: rank.badgeBg,
                    borderColor: rank.badgeBorder,
                  }}
                  title={language === 'vi' ? rank.descriptionVi : rank.descriptionEn}
                >
                  <Shield className="w-3 h-3" />
                  <span>{language === 'vi' ? rank.titleVi.split(' ')[0] : rank.titleEn}</span>
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">Level {level.level}</span>
                  <span className="text-xs font-semibold" style={{ color: rank.color }}>
                    {language === 'vi' ? rank.classVi : rank.classEn}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${level.progress}%`, backgroundColor: rank.color }}
                  />
                </div>
              </div>
              <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>{level.currentLevelXP} / {level.nextLevelXP} XP</span>
                <span className="truncate max-w-[130px] font-medium text-right" title={language === 'vi' ? rank.descriptionVi : rank.descriptionEn}>
                  {language === 'vi' ? rank.titleVi : rank.titleEn}
                </span>
              </div>
            </div>
          );
        })()}

        {/* All-time Completed */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{t('overview.totalCompleted')}</span>
            <Trophy className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold">
              {summary?.totalCompleted ?? 0}
            </div>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {summary?.successfulDays ?? 0} {t('overview.successfulDays')}
          </div>
        </div>
      </div>

      {/* Today's Quests Card */}
      <div
        className="p-5 rounded-xl border"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">{t('overview.todayQuests')}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {t('overview.todayQuestsSubtitle')}
            </p>
          </div>

          {onNavigateToQuests && (
            <button
              onClick={onNavigateToQuests}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-accent)] transition-all duration-150 active:scale-[0.97]"
            >
              <span>{t('overview.manageTemplates')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs (All / Pending / Done / Skipped) */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {[
            { id: 'all' as const, label: language === 'vi' ? 'Tất cả' : 'All', count: instances.length },
            { id: 'pending' as const, label: language === 'vi' ? 'Cần làm' : 'Pending', count: instances.filter(i => i.status === 'pending').length },
            { id: 'completed' as const, label: language === 'vi' ? 'Đã xong' : 'Done', count: instances.filter(i => i.status === 'completed').length },
            { id: 'skipped' as const, label: language === 'vi' ? 'Bỏ qua' : 'Skipped', count: instances.filter(i => i.status === 'skipped').length },
          ].map(tab => {
            const isSelected = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
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

        {loadingInstances ? (
          <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('common.loading')}
          </div>
        ) : (
          <QuestList
            instances={instances.filter(i => {
              if (filterTab === 'pending') return i.status === 'pending';
              if (filterTab === 'completed') return i.status === 'completed';
              if (filterTab === 'skipped') return i.status === 'skipped';
              return true;
            })}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onPostpone={handlePostpone}
            onStartFocus={(inst) => setFocusInstance(inst)}
            onEditQuest={(q) => setEditingQuest(q)}
            hideCompleted={filterTab === 'all' ? settings.hideCompleted : false}
            isCompletedTab={filterTab === 'completed'}
            onAddQuest={() => setShowAddDialog(true)}
            onUpdated={reloadAll}
          />
        )}
      </div>

      {/* Annual Activity Heatmap */}
      <ContributionChart
        onSelectDate={(dateKey) => onNavigateToCalendar?.(dateKey)}
        refreshTrigger={instances}
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

      {/* Dialogs & Toasts */}
      <AddQuestDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddQuest}
      />

      <EditQuestDialog
        quest={editingQuest}
        isOpen={editingQuest !== null}
        onClose={() => setEditingQuest(null)}
        onUpdate={async (id, input) => {
          await questService.update(id, input);
          await reloadAll();
        }}
        onArchive={async (id) => {
          await questService.archive(id);
          await reloadAll();
        }}
        onDelete={async (id) => {
          await questService.delete(id);
          await reloadAll();
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
