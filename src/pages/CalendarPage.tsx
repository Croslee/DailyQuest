import React, { useState, useEffect, useCallback } from 'react';
import {
  formatDateKey,
  getLocalDateKey,
  getDayOfWeek,
  parseDateKey,
} from '@/utils/date';
import {
  completionRepository,
  questInstanceRepository,
  dailyStatsRepository,
  questRepository,
} from '@/db/index';
import type { QuestCompletion } from '@/types/completion';
import type { DailyStats } from '@/types/statistics';
import type { QuestInstance } from '@/types/quest';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/i18n/I18nContext';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MinusCircle,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';

interface DaySummary {
  date: string;
  stats?: DailyStats;
  completions: QuestCompletion[];
  pendingInstances: { instance: QuestInstance; title: string; xp: number; category: string }[];
}

export const CalendarPage: React.FC = () => {
  const todayKey = getLocalDateKey();
  const { language } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [currentYear, setCurrentYear] = useState<number>(() => parseDateKey(todayKey).getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => parseDateKey(todayKey).getMonth());
  const [monthStats, setMonthStats] = useState<Map<string, DailyStats>>(new Map());
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Load stats for the entire viewed month
  const loadMonthData = useCallback(async (year: number, month: number) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const stats = await dailyStatsRepository.getByDateRange(startDate, endDate);
      const map = new Map<string, DailyStats>();
      for (const s of stats) {
        map.set(s.date, s);
      }
      setMonthStats(map);
    } catch (err) {
      console.error('[CalendarPage] Failed to load month stats:', err);
    }
  }, []);

  // Load detailed data for the currently selected day
  const loadDayDetail = useCallback(async (dateKey: string) => {
    setLoading(true);
    try {
      const [stats, completions, instances] = await Promise.all([
        dailyStatsRepository.getByDate(dateKey),
        completionRepository.getByDate(dateKey),
        questInstanceRepository.getByDate(dateKey),
      ]);

      const pendingInstances = [];
      const pendingOnes = instances.filter(i => i.status === 'pending');
      for (const inst of pendingOnes) {
        const quest = await questRepository.getById(inst.questId);
        pendingInstances.push({
          instance: inst,
          title: quest?.title ?? 'Unknown Quest',
          xp: quest?.xp ?? 0,
          category: quest?.category ?? 'Other',
        });
      }

      setDaySummary({
        date: dateKey,
        stats,
        completions,
        pendingInstances,
      });
    } catch (err) {
      console.error('[CalendarPage] Failed to load day detail:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonthData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadMonthData]);

  useEffect(() => {
    loadDayDetail(selectedDate);
  }, [selectedDate, loadDayDetail]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = parseDateKey(todayKey);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayKey);
  };

  // Build calendar matrix (Monday start)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const daysArray: (string | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    daysArray.push(key);
  }

  const monthName = language === 'vi'
    ? `Tháng ${currentMonth + 1}, ${currentYear}`
    : new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

  const weekDayHeaders = language === 'vi'
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const completedCompletions = daySummary?.completions.filter(c => c.status === 'completed') ?? [];
  const skippedCompletions = daySummary?.completions.filter(c => c.status === 'skipped') ?? [];
  const missedCompletions = daySummary?.completions.filter(c => c.status === 'missed') ?? [];
  const pendingItems = daySummary?.pendingInstances ?? [];

  const totalEntries =
    completedCompletions.length +
    skippedCompletions.length +
    missedCompletions.length +
    pendingItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{language === 'vi' ? 'Lịch & Lịch Sử Nhiệm Vụ' : 'History & Calendar'}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {language === 'vi' ? 'Xem lại nhật ký hoàn thành, điểm số và thành tích từng ngày' : 'Review past quest completions, scores, and permanent records'}
          </p>
        </div>

        <button
          onClick={handleJumpToToday}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 active:scale-[0.97] align-middle hover:opacity-90 leading-none shadow-2xs"
          style={{
            borderColor: 'var(--color-accent)',
            color: 'var(--color-accent)',
            backgroundColor: 'var(--color-accent-light)',
          }}
        >
          <span>{language === 'vi' ? 'Về hôm nay' : 'Jump to Today'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid Section */}
        <div
          className="lg:col-span-6 p-4 rounded-xl border self-start"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{monthName}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-all duration-150 active:scale-95 text-[var(--color-text-secondary)]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-all duration-150 active:scale-95 text-[var(--color-text-secondary)]"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
            {weekDayHeaders.map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((dateKey, idx) => {
              if (!dateKey) {
                return <div key={`empty-${idx}`} className="h-10 rounded-md" />;
              }

              const dayNum = parseInt(dateKey.split('-')[2], 10);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;
              const stat = monthStats.get(dateKey);

              let dotColor = 'transparent';
              if (stat && stat.totalQuests > 0) {
                if (stat.isSuccessful) {
                  dotColor = 'var(--color-success)';
                } else if (stat.score > 0) {
                  dotColor = 'var(--color-warning)';
                } else {
                  dotColor = 'var(--color-danger)';
                }
              }

              const statLabel = stat && stat.totalQuests > 0
                ? `${Math.round(stat.score)}%`
                : (language === 'vi' ? 'Chưa có dữ liệu' : 'No records');

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  aria-label={`${formatDateKey(dateKey)} - ${statLabel}`}
                  className={`h-10 flex flex-col items-center justify-center rounded-lg text-xs font-medium relative transition-all ${
                    isSelected ? 'ring-2 ring-[var(--color-accent)] font-bold' : 'hover:bg-[var(--color-bg-tertiary)]'
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--color-accent-light)'
                      : isToday
                      ? 'var(--color-bg-tertiary)'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--color-accent)'
                      : isToday
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  <span>{dayNum}</span>
                  {dotColor !== 'transparent' && (
                    <span
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ backgroundColor: dotColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-5 pt-3 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
              <span>{language === 'vi' ? 'Đạt mục tiêu (≥70%)' : 'Successful (≥70%)'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-warning)' }} />
              <span>{language === 'vi' ? 'Một phần (<70%)' : 'Partial (<70%)'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-danger)' }} />
              <span>{language === 'vi' ? 'Bỏ lỡ' : 'Missed'}</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details Section */}
        <div
          className="lg:col-span-6 p-5 rounded-xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            {/* Header info */}
            <div className="flex items-start justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{formatDateKey(selectedDate)}</h3>
                  {selectedDate === todayKey && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                      {language === 'vi' ? 'HÔM NAY' : 'TODAY'}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {getDayOfWeek(selectedDate)}
                </p>
              </div>

              {/* Day Score & XP Badges */}
              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{language === 'vi' ? 'Điểm số' : 'Score'}</div>
                  <div className="text-sm font-bold" style={{ color: daySummary?.stats?.isSuccessful ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                    {daySummary?.stats ? `${Math.round(daySummary.stats.score)}%` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">XP</div>
                  <div className="text-sm font-bold flex items-center gap-0.5" style={{ color: 'var(--color-xp)' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{daySummary?.stats?.xpEarned ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Lists */}
            <div className="py-4 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {language === 'vi' ? 'Đang tải dữ liệu ngày...' : 'Loading records...'}
                </div>
              ) : totalEntries === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="w-8 h-8" />}
                  title={language === 'vi' ? 'Không có nhiệm vụ nào.' : 'No quests recorded.'}
                  description={language === 'vi' ? 'Không có nhiệm vụ nào được lên lịch hoặc hoàn thành vào ngày này.' : 'No quests were scheduled or completed on this date.'}
                />
              ) : (
                <>
                  {/* Completed list */}
                  {completedCompletions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Đã hoàn thành' : 'Completed'} ({completedCompletions.length})</span>
                      </div>
                      <div className="space-y-1">
                        {completedCompletions.map(c => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-2 rounded-md text-xs border"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="line-through" style={{ color: 'var(--color-text-secondary)' }}>
                                {c.questTitle}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                                {c.questCategory}
                              </span>
                            </div>
                            <span className="font-bold flex-shrink-0" style={{ color: 'var(--color-xp)' }}>
                              +{c.xpEarned} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped list */}
                  {skippedCompletions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-warning)' }}>
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Đã bỏ qua' : 'Skipped'} ({skippedCompletions.length})</span>
                      </div>
                      <div className="space-y-1">
                        {skippedCompletions.map(c => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-2 rounded-md text-xs border"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="line-through" style={{ color: 'var(--color-text-tertiary)' }}>
                                {c.questTitle}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                                {c.questCategory}
                              </span>
                            </div>
                            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                              {language === 'vi' ? 'Không tính vào điểm' : 'Excluded from score'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missed list */}
                  {missedCompletions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Bỏ lỡ' : 'Missed'} ({missedCompletions.length})</span>
                      </div>
                      <div className="space-y-1">
                        {missedCompletions.map(c => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-2 rounded-md text-xs border"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span style={{ color: 'var(--color-danger)' }}>{c.questTitle}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                                {c.questCategory}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--color-danger)' }}>
                              0 XP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending list */}
                  {pendingItems.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-accent)' }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Đang chờ làm' : 'Pending'} ({pendingItems.length})</span>
                      </div>
                      <div className="space-y-1">
                        {pendingItems.map(p => (
                          <div
                            key={p.instance.id}
                            className="flex items-center justify-between p-2 rounded-md text-xs border"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span>{p.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                                {p.category}
                              </span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: 'var(--color-xp)' }}>
                              +{p.xp} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Historical integrity note */}
          <div className="pt-3 border-t text-[11px] flex items-center justify-between" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            <span>{language === 'vi' ? 'Dữ liệu lịch sử được lưu trữ vĩnh viễn cục bộ' : 'Historical snapshots are permanently preserved'}</span>
            {daySummary?.stats && (
              <span>
                {daySummary.stats.completed}/{daySummary.stats.totalQuests - daySummary.stats.skipped} {language === 'vi' ? 'nhiệm vụ xong' : 'actionable completed'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
