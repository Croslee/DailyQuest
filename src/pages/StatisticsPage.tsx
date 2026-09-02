import React, { useState, useEffect, useMemo } from 'react';
import { useStatistics } from '@/hooks/useStatistics';
import { useSettings } from '@/hooks/useSettings';
import { statisticsService } from '@/services/statisticsService';
import { achievementService } from '@/services/achievementService';
import { completionRepository } from '@/db/index';
import { calculateCategoryStreaks, type CategoryStreakResult } from '@/domain/category-streak';
import type { DailyStats } from '@/types/statistics';
import type { Achievement } from '@/types/achievement';
import { getWeekStart, getDateRange, formatDateKeyShort, parseDateKey } from '@/utils/date';
import { useTranslation } from '@/i18n/I18nContext';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  BarChart3,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  Sparkles,
  PieChart,
  Trophy,
  Lock,
  CheckCircle2,
  Crown,
} from 'lucide-react';

export const StatisticsPage: React.FC = () => {
  const { summary, loading: loadingSummary } = useStatistics();
  const { settings, updateSetting } = useSettings();
  const { language } = useTranslation();
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [categoryStreaks, setCategoryStreaks] = useState<CategoryStreakResult[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [achFilter, setAchFilter] = useState<'all' | 'unlocked' | 'rank' | 'milestones'>('all');

  const loadData = async () => {
    const monday = getWeekStart();
    const mondayDate = parseDateKey(monday);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    const allWeekDates = getDateRange(
      monday,
      `${sundayDate.getFullYear()}-${String(sundayDate.getMonth() + 1).padStart(2, '0')}-${String(sundayDate.getDate()).padStart(2, '0')}`
    );

    const [stats, completions, achs] = await Promise.all([
      statisticsService.getStatsRange(allWeekDates[0], allWeekDates[allWeekDates.length - 1]),
      completionRepository.getAll(),
      achievementService.getAchievements(),
    ]);

    const statsMap = new Map<string, DailyStats>();
    for (const s of stats) statsMap.set(s.date, s);

    const weekArray: DailyStats[] = allWeekDates.map(date => {
      return (
        statsMap.get(date) ?? {
          date,
          totalQuests: 0,
          completed: 0,
          skipped: 0,
          missed: 0,
          pending: 0,
          score: 0,
          xpEarned: 0,
          isSuccessful: false,
        }
      );
    });

    setWeeklyStats(weekArray);
    setCategoryStreaks(calculateCategoryStreaks(completions));
    setAchievements(achs);
    setLoadingWeek(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loadingSummary || loadingWeek) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        {language === 'vi' ? 'Đang phân tích dữ liệu năng suất...' : 'Calculating productivity statistics...'}
      </div>
    );
  }

  const hasData = (summary?.totalQuestsCreated ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{language === 'vi' ? 'Thống Kê Năng Suất' : 'Statistics Dashboard'}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {language === 'vi' ? 'Phân tích hiệu suất và phân bổ công việc theo danh mục' : 'Deep productivity analytics and behavioral insights'}
          </p>
        </div>
        <EmptyState
          icon={<BarChart3 className="w-10 h-10" />}
          title={language === 'vi' ? 'Chưa có đủ dữ liệu.' : 'Not enough data yet.'}
          description={
            language === 'vi'
              ? 'Hãy hoàn thành các nhiệm vụ đầu tiên để mở khóa bảng thống kê và thành tựu.'
              : 'Complete your first few quests to unlock your comprehensive statistics dashboard and category analytics.'
          }
        />
      </div>
    );
  }

  const categoryStats = summary?.categoryStats ?? [];
  const dayNames = language === 'vi'
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">{language === 'vi' ? 'Thống Kê Năng Suất' : 'Statistics Dashboard'}</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi' ? 'Chỉ số hiệu suất, chuỗi danh mục và hệ thống danh hiệu' : 'Detailed performance metrics, category distribution, and streak analytics'}
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{language === 'vi' ? 'Tỷ lệ hoàn thành' : 'Completion Rate'}</span>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="text-2xl font-bold mt-2">{summary?.completionRate}%</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {summary?.totalCompleted} / {summary?.totalQuestsCreated} {language === 'vi' ? 'nhiệm vụ' : 'quests'}
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{language === 'vi' ? 'Chuỗi Streak' : 'Streaks'}</span>
            <Flame className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />
          </div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--color-xp)' }}>
            {summary?.streak.currentStreak} <span className="text-xs font-normal text-[var(--color-text-secondary)]">{language === 'vi' ? 'ngày' : 'days'}</span>
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {language === 'vi' ? 'Kỷ lục' : 'Best streak'}: {summary?.streak.bestStreak} {language === 'vi' ? 'ngày' : 'days'}
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{language === 'vi' ? 'Ngày thành công' : 'Successful Days'}</span>
            <Award className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="text-2xl font-bold mt-2">{summary?.successfulDays}</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {summary?.totalTrackedDays} {language === 'vi' ? 'ngày hoạt động (≥70%)' : 'total active days (≥70%)'}
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{language === 'vi' ? 'Cấp độ & XP' : 'Level & Total XP'}</span>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="text-2xl font-bold mt-2">Level {summary?.level.level}</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {summary?.level.totalXP} XP {language === 'vi' ? 'tích lũy' : 'lifetime XP'}
          </div>
        </div>
      </div>

      {/* Middle Section: Weekly Activity + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold">{language === 'vi' ? 'Hiệu Suất Tuần Này' : 'Weekly Performance'}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {language === 'vi' ? 'Điểm hoàn thành các ngày trong tuần' : 'Daily quest completion score for the current week'}
              </p>
            </div>

            {/* Bars */}
            <div className="grid grid-cols-7 gap-2 items-end h-44 pt-8 pb-1">
              {weeklyStats.map((dayStat, idx) => {
                const heightPercent = dayStat.totalQuests > 0 ? Math.max(8, dayStat.score) : 4;
                const isSuccessful = dayStat.isSuccessful;
                const barColor =
                  dayStat.totalQuests === 0
                    ? 'var(--color-bg-tertiary)'
                    : isSuccessful
                    ? 'var(--color-success)'
                    : dayStat.score > 0
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)';

                return (
                  <div key={dayStat.date} className="flex flex-col items-center h-full justify-end group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 text-[10px] px-1.5 py-0.5 rounded shadow bg-[var(--color-bg-primary)] border border-[var(--color-border)] pointer-events-none transition-opacity whitespace-nowrap z-10">
                      {Math.round(dayStat.score)}% ({dayStat.completed}/{dayStat.totalQuests - dayStat.skipped})
                    </div>

                    <div
                      className="w-full max-w-[28px] rounded-t-md transition-all duration-500"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: barColor,
                      }}
                    />
                    <span className="text-[11px] font-medium mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {dayNames[idx]}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatDateKeyShort(dayStat.date).split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            <span>{language === 'vi' ? 'Mục tiêu: Đạt ≥70% mỗi ngày' : 'Weekly Target: 70%+ score'}</span>
            <span>Avg Daily XP: ~{summary?.averageDailyXP ?? 0}</span>
          </div>
        </div>

        {/* Category Breakdown & Category Streaks */}
        <div className="lg:col-span-5 p-5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold">{language === 'vi' ? 'Phân Bổ & Chuỗi Danh Mục' : 'Category Streaks & Breakdown'}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {language === 'vi' ? 'Theo dõi mức độ tập trung theo chủ đề' : 'Completed quests & streaks across categories'}
              </p>
            </div>

            {categoryStats.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {language === 'vi' ? 'Chưa có danh mục nào.' : 'No completed categories recorded yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {categoryStats.map(cat => {
                  const streakObj = categoryStreaks.find(cs => cs.category === cat.category);
                  const streakVal = streakObj?.currentStreak ?? 0;

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{cat.category}</span>
                          {streakVal > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold text-[var(--color-xp)] bg-[rgba(245,158,11,0.1)]">
                              🔥 {streakVal}d streak
                            </span>
                          )}
                        </div>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {cat.completed} {language === 'vi' ? 'xong' : 'done'} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: 'var(--color-accent)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-2 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            <span>{language === 'vi' ? 'Danh mục nhiều nhất' : 'Top Category'}</span>
            <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
              {summary?.mostCompletedCategory ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Feature 11 & Achievements System */}
      <div className="p-5 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--color-xp)]" />
            <h3 className="text-sm font-semibold">{language === 'vi' ? 'Huy Hiệu & Thành Tựu' : 'Achievements & Badges'}</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)]" style={{ color: 'var(--color-accent)' }}>
              {achievements.filter(a => a.unlocked).length} / {achievements.length} {language === 'vi' ? 'Đã mở khóa' : 'Unlocked'}
            </span>
          </div>
        </div>

        {/* Filter Pills for Badges */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] w-fit">
          {[
            { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
            { id: 'unlocked', label: language === 'vi' ? 'Đã đạt' : 'Unlocked' },
            { id: 'rank', label: '✦ Rank' },
            { id: 'milestones', label: language === 'vi' ? 'Cột mốc' : 'Milestones' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAchFilter(tab.id as typeof achFilter)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 active:scale-95 ${
                achFilter === tab.id
                  ? 'bg-[var(--color-accent)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {(() => {
            let filteredList = [...achievements];
            if (achFilter === 'unlocked') {
              filteredList = filteredList.filter(a => a.unlocked);
            } else if (achFilter === 'rank') {
              filteredList = filteredList.filter(a => a.id.startsWith('rank-'));
            } else if (achFilter === 'milestones') {
              filteredList = filteredList.filter(a => !a.id.startsWith('rank-'));
            }

            const sortedList = filteredList.sort((a, b) => {
              // 1. Unlocked always first
              if (a.unlocked && !b.unlocked) return -1;
              if (!a.unlocked && b.unlocked) return 1;
              // 2. Rank progression prioritized within unlocked
              const aIsRank = a.id.startsWith('rank-');
              const bIsRank = b.id.startsWith('rank-');
              if (aIsRank && !bIsRank) return -1;
              if (!aIsRank && bIsRank) return 1;
              // 3. Higher progress percentage first
              return b.progress - a.progress;
            });

            if (sortedList.length === 0) {
              return (
                <div className="col-span-full py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {language === 'vi' ? 'Không có huy hiệu nào trong danh mục này.' : 'No badges found in this category.'}
                </div>
              );
            }

            return sortedList.map((ach) => {
              const isEquipped = settings.equippedBadgeId === ach.id;
              const isRankBadge = ach.id.startsWith('rank-');

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 relative group ${
                    isRankBadge
                      ? ach.unlocked
                        ? isEquipped
                          ? 'border-amber-400 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] shadow-lg ring-2 ring-amber-400'
                          : 'border-amber-500/50 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] shadow-md hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg'
                        : 'border-amber-500/20 bg-[var(--color-bg-tertiary)] opacity-75 hover:opacity-95'
                      : ach.unlocked
                        ? isEquipped
                          ? 'border-[var(--color-accent)] bg-[var(--color-bg-primary)] shadow-md ring-2 ring-[var(--color-accent)]'
                          : 'border-[var(--color-accent)] bg-[var(--color-bg-primary)] shadow-md hover:-translate-y-0.5'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] opacity-70 hover:opacity-90'
                  }`}
                >
                  <div>
                    {/* Rank Badge Special Tag */}
                    {isRankBadge && (
                      <div className="mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Rank</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2.5">
                      <div
                        className={`flex items-center justify-center text-3xl shadow-2xs ${
                          isRankBadge
                            ? 'w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/15 to-blue-500/20 border border-amber-400/40'
                            : 'w-12 h-12 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                        }`}
                      >
                        {ach.icon}
                      </div>
                      {ach.unlocked ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[rgba(34,197,94,0.15)] text-[var(--color-success)] border border-[rgba(34,197,94,0.3)] shadow-2xs">
                          {language === 'vi' ? '✓ Đã Đạt' : '✓ Unlocked'}
                        </span>
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                          <Lock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                        </div>
                      )}
                    </div>

                    <div className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)] leading-snug">
                      {language === 'vi' ? (ach.titleVi || ach.title) : ach.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {language === 'vi' ? (ach.descriptionVi || ach.description) : ach.description}
                    </div>
                  </div>

                  {ach.unlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        const nextEquipped = isEquipped ? undefined : ach.id;
                        updateSetting('equippedBadgeId', nextEquipped);
                      }}
                      className={`w-full mt-3.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 ${
                        isEquipped
                          ? 'bg-[var(--color-accent)] text-white shadow-xs font-bold'
                          : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Đang trang bị' : 'Equipped'}</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Trang bị Badge' : 'Equip Badge'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="mt-3.5 pt-2 border-t border-[var(--color-border)]">
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                          style={{ width: `${ach.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-tertiary)] mt-1.5">
                        <span>{ach.currentCount ?? 0} / {ach.targetCount ?? 1}</span>
                        <span className="font-bold">{Math.round(ach.progress)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};
