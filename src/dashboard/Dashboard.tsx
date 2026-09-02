import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Swords,
  Calendar,
  BarChart3,
  BookOpen,
  Settings,
  Flame,
  Sun,
  Moon,
  Clock,
  Plus,
} from 'lucide-react';
import { OverviewPage } from '@/pages/OverviewPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { QuestsPage } from '@/pages/QuestsPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { TutorialPage } from '@/pages/TutorialPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AddQuestDialog } from '@/components/quest/AddQuestDialog';
import { FocusTimerModal } from '@/components/pomodoro/FocusTimerModal';
import { useStreak } from '@/hooks/useStreak';
import { useLevelInfo } from '@/hooks/useStatistics';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/i18n/I18nContext';
import { questService } from '@/services/questService';
import { questGenerationService } from '@/services/questGenerationService';
import { achievementService } from '@/services/achievementService';
import { getRankForLevel } from '@/domain/rank';
import { onDataChanged, notifyDataChanged } from '@/services/syncChannel';
import type { CreateQuestInput } from '@/types/quest';
import type { Achievement } from '@/types/achievement';

type PageId = 'overview' | 'quests' | 'calendar' | 'statistics' | 'tutorial' | 'settings';

export const Dashboard: React.FC = () => {
  const { language, t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { level, reload: reloadLevel } = useLevelInfo();
  const { streak, reload: reloadStreak } = useStreak();

  const [activePage, setActivePage] = useState<PageId>('overview');
  const [showGlobalAddDialog, setShowGlobalAddDialog] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [equippedAchievement, setEquippedAchievement] = useState<Achievement | null>(null);

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

  const reloadGlobalState = useCallback(async () => {
    await reloadLevel();
    await reloadStreak();
    await refreshEquippedBadge();
  }, [reloadLevel, reloadStreak, refreshEquippedBadge]);

  useEffect(() => {
    const unsubscribe = onDataChanged(() => {
      reloadGlobalState();
    });
    return () => unsubscribe();
  }, [reloadGlobalState]);

  // Global keyboard shortcuts (N for new quest, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      const isModalOpen = Boolean(document.querySelector('[role="dialog"], [role="alertdialog"]'));

      if (!isInput && !isModalOpen && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowGlobalAddDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateQuest = async (input: CreateQuestInput) => {
    await questService.create(input);
    await questGenerationService.generateForToday();
    await reloadGlobalState();
    notifyDataChanged('dashboard.handleCreateQuest');
  };

  const toggleTheme = async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    await updateSetting('theme', nextTheme);
  };

  const navItems = [
    { id: 'overview' as const, label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'quests' as const, label: t('nav.quests'), icon: Swords },
    { id: 'calendar' as const, label: t('nav.calendar'), icon: Calendar },
    { id: 'statistics' as const, label: t('nav.statistics'), icon: BarChart3 },
    { id: 'tutorial' as const, label: t('nav.tutorial'), icon: BookOpen },
    { id: 'settings' as const, label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        {/* Brand Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="font-bold text-sm leading-tight text-[var(--color-text-primary)]">Daily Quest</h1>
              <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>v1.0</span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border transition-colors hover:bg-[var(--color-bg-primary)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Streak badge banner in sidebar with Combo Multiplier */}
        {streak.currentStreak > 0 && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl flex flex-col gap-1.5 text-xs bg-[rgba(245,158,11,0.1)] text-[var(--color-xp)] border border-[rgba(245,158,11,0.25)] shadow-2xs">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[var(--color-xp)]" />
                <span>Streak</span>
              </div>
              <span className="font-mono font-extrabold text-[13px]">{streak.currentStreak} {t('common.days')}</span>
            </div>
            <div className="text-[10px] font-semibold flex items-center justify-between pt-1 border-t border-[rgba(245,158,11,0.2)] text-[var(--color-text-secondary)]">
              <span>⚡ Combo XP:</span>
              <span className="font-mono font-bold text-[var(--color-xp)]">
                +{Math.round(Math.min(0.5, streak.currentStreak * 0.05) * 100)}% ({(1 + Math.min(0.5, streak.currentStreak * 0.05)).toFixed(2)}x)
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto custom-scrollbar">
          <ul className="space-y-0.5">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-98 ${
                    activePage === item.id
                      ? 'bg-[var(--color-accent)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Level Footer in Sidebar (Classic inline single rank badge) */}
        {(() => {
          const rank = getRankForLevel(level.level);
          const rankTitle = language === 'vi' ? rank.titleVi.split(' ')[0] : rank.classEn;
          const tooltip = language === 'vi' ? `Cấp bậc: ${rank.titleVi}` : `Rank: ${rank.titleEn}`;

          return (
            <div className="px-4 py-3 border-t text-xs space-y-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">Lv.{level.level}</span>
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold border font-mono tracking-wide shadow-2xs truncate max-w-[120px]"
                    style={{
                      color: rank.color,
                      backgroundColor: rank.badgeBg,
                      borderColor: rank.badgeBorder,
                    }}
                    title={tooltip}
                  >
                    {rankTitle}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-[var(--color-text-secondary)] shrink-0">{level.totalXP} XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${level.progress}%`, backgroundColor: rank.color }}
                />
              </div>
            </div>
          );
        })()}
      </aside>

      {/* Main Content Area with Top Action Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header
          className="h-14 border-b px-8 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
              {navItems.find(i => i.id === activePage)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Interactive Expanding Pomodoro Button */}
            <button
              type="button"
              onClick={() => setShowFocusTimer(true)}
              className="group flex items-center h-8 px-2.5 rounded-xl border transition-all duration-300 ease-out text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] hover:shadow-xs active:scale-95 cursor-pointer"
              style={{ borderColor: 'var(--color-border)' }}
              title={language === 'vi' ? 'Mở đồng hồ Pomodoro tập trung' : 'Open Focus Pomodoro Timer'}
            >
              <Clock className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
              <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out text-xs font-bold text-[var(--color-accent)]">
                Pomodoro
              </span>
            </button>

            {/* Optimal New Quest Button [N] */}
            <button
              type="button"
              onClick={() => setShowGlobalAddDialog(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-150 active:scale-95 text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'vi' ? 'Nhiệm Vụ Mới' : 'New Quest'}</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-white/90 border border-white/20">N</kbd>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-5xl mx-auto">
            {activePage === 'overview' && (
              <OverviewPage
                onNavigateToCalendar={() => setActivePage('calendar')}
                onNavigateToQuests={() => setActivePage('quests')}
              />
            )}
            {activePage === 'quests' && <QuestsPage />}
            {activePage === 'calendar' && <CalendarPage />}
            {activePage === 'statistics' && <StatisticsPage />}
            {activePage === 'tutorial' && <TutorialPage />}
            {activePage === 'settings' && <SettingsPage onDataChanged={reloadGlobalState} />}
          </div>
        </main>
      </div>

      {/* Global Add Quest Dialog (from 'N' key) */}
      <AddQuestDialog
        isOpen={showGlobalAddDialog}
        onClose={() => setShowGlobalAddDialog(false)}
        onSubmit={handleCreateQuest}
      />

      {/* Global Focus Pomodoro Timer Modal */}
      <FocusTimerModal
        isOpen={showFocusTimer}
        onClose={() => setShowFocusTimer(false)}
      />
    </div>
  );
};
