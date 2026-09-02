import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ContributionDay } from '@/types/statistics';
import { statisticsService } from '@/services/statisticsService';
import { getLocalDateKey, formatDateKey, parseDateKey } from '@/utils/date';
import { useTranslation } from '@/i18n/I18nContext';
import { onDataChanged } from '@/services/syncChannel';
import { Trophy, Zap, Flame, Target } from 'lucide-react';

interface ContributionChartProps {
  onSelectDate?: (dateKey: string) => void;
  selectedDate?: string;
  className?: string;
  refreshTrigger?: unknown;
}

interface WeekData {
  days: (ContributionDay | null)[];
  monthLabel?: string;
}

export const ContributionChart: React.FC<ContributionChartProps> = ({
  onSelectDate,
  selectedDate,
  className = '',
  refreshTrigger,
}) => {
  const { language } = useTranslation();
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ day: ContributionDay; x: number; y: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const days = await statisticsService.getContributionData();
      setData(days);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = onDataChanged(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData, refreshTrigger]);

  const currentYearNum = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>('last12'); // 'last12', '2026', '2025', '2024'

  const availableYears = useMemo(() => {
    const list = [
      { id: 'last12', label: language === 'vi' ? '12 Tháng' : '12 Months' },
      { id: String(currentYearNum), label: String(currentYearNum) },
      { id: String(currentYearNum - 1), label: String(currentYearNum - 1) },
      { id: String(currentYearNum - 2), label: String(currentYearNum - 2) },
    ];
    return list;
  }, [currentYearNum, language]);

  // Filter data according to selected year or last 12 months
  const filteredData = useMemo(() => {
    if (selectedYear === 'last12') return data;
    const yearStr = selectedYear;
    return data.filter(d => d.date.startsWith(yearStr));
  }, [data, selectedYear]);

  // Compute metrics for the active window
  const yearlyStats = useMemo(() => {
    let activeDays = 0;
    let totalCompleted = 0;
    let totalXP = 0;
    let successfulDays = 0;

    for (const d of filteredData) {
      if (d.completed > 0 || d.score > 0) {
        activeDays++;
        totalCompleted += d.completed;
        totalXP += d.xpEarned;
        if (d.score >= 70) successfulDays++;
      }
    }

    const maxDays = selectedYear === 'last12' ? 365 : 365;
    const consistencyRate = filteredData.length > 0 ? Math.round((activeDays / Math.min(maxDays, Math.max(1, filteredData.length))) * 100) : 0;

    return {
      activeDays,
      totalCompleted,
      totalXP,
      successfulDays,
      consistencyRate,
    };
  }, [filteredData, selectedYear]);

  // Organize 52-53 weeks of the selected 12-month period
  const { weeks, monthLabels } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [] };

    const dataMap = new Map<string, ContributionDay>();
    for (const d of data) {
      dataMap.set(d.date, d);
    }

    const today = getLocalDateKey();
    let startDate: Date;
    let endDate: Date;

    if (selectedYear === 'last12') {
      const todayDate = parseDateKey(today);
      const currentDayOfWeek = (todayDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
      endDate = new Date(todayDate);
      endDate.setDate(todayDate.getDate() + (6 - currentDayOfWeek));

      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (53 * 7 - 1));
    } else {
      const year = parseInt(selectedYear, 10);
      startDate = new Date(year, 0, 1);
      const dayOfWeek = (startDate.getDay() + 6) % 7;
      startDate.setDate(startDate.getDate() - dayOfWeek); // Start on Monday

      endDate = new Date(year, 11, 31);
      const endDayOfWeek = (endDate.getDay() + 6) % 7;
      endDate.setDate(endDate.getDate() + (6 - endDayOfWeek)); // End on Sunday
    }

    const weeksList: WeekData[] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    for (let w = 0; w < totalWeeks; w++) {
      const daysInWeek: (ContributionDay | null)[] = [];
      let monthLabelForWeek: string | undefined;

      for (let d = 0; d < 7; d++) {
        const dateKey = getLocalDateKey(cursor);
        const dayMonth = cursor.getMonth();

        // Check if month changed and it's near start of month
        if (dayMonth !== lastMonth && cursor.getDate() <= 7) {
          lastMonth = dayMonth;
          const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthNamesVi = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
          monthLabelForWeek = language === 'vi' ? monthNamesVi[dayMonth] : monthNamesEn[dayMonth];
          months.push({ label: monthLabelForWeek, weekIndex: w });
        }

        if (dateKey <= today || selectedYear !== 'last12') {
          const item = dataMap.get(dateKey) ?? {
            date: dateKey,
            score: 0,
            level: 0,
            xpEarned: 0,
            completed: 0,
            total: 0,
          };
          daysInWeek.push(item);
        } else {
          daysInWeek.push(null);
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      weeksList.push({ days: daysInWeek, monthLabel: monthLabelForWeek });
    }

    return { weeks: weeksList, monthLabels: months };
  }, [data, selectedYear, language]);

  const levelColors = [
    'var(--color-contrib-0)',
    'var(--color-contrib-1)',
    'var(--color-contrib-2)',
    'var(--color-contrib-3)',
    'var(--color-contrib-4)',
  ];

  if (loading) {
    return (
      <div className={`p-5 rounded-xl border flex items-center justify-center min-h-[160px] ${className}`} style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {language === 'vi' ? 'Đang tải biểu đồ hoạt động...' : 'Loading activity chart...'}
        </span>
      </div>
    );
  }

  const selectedYearLabel = selectedYear === 'last12'
    ? (language === 'vi' ? '12 tháng gần nhất' : 'the last 12 months')
    : selectedYear;

  return (
    <div
      className={`p-5 rounded-xl border relative space-y-3.5 ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Top Header Row (GitHub style) */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {language === 'vi'
            ? `${yearlyStats.totalCompleted} Complete quests trong ${selectedYearLabel}`
            : `${yearlyStats.totalCompleted} Complete quests in ${selectedYearLabel}`}
        </h3>
      </div>

      {/* Main Row: Heatmap on Left, Year Selector on Right (Exact GitHub Style) */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Main Heatmap Box */}
        <div
          className="flex-1 w-full p-4 rounded-xl border overflow-x-auto custom-scrollbar"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="inline-flex flex-col gap-1 min-w-[700px] w-full pb-1">
            {/* Month headers */}
            <div className="flex text-[10px] pl-7 h-4 relative font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `${m.weekIndex * 13.5 + 28}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid with Day of week labels */}
            <div className="flex gap-1.5 items-start">
              {/* Day labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[9px] pr-1 h-[92px] font-medium select-none" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>{language === 'vi' ? 'T2' : 'Mon'}</span>
                <span>{language === 'vi' ? 'T4' : 'Wed'}</span>
                <span>{language === 'vi' ? 'T6' : 'Fri'}</span>
              </div>

              {/* Week columns */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.days.map((day, dIdx) => {
                      if (!day) {
                        return <div key={dIdx} className="w-[10.5px] h-[10.5px] rounded-xs opacity-0" />;
                      }

                      const isSelected = selectedDate === day.date;

                      return (
                        <button
                          key={day.date}
                          onClick={() => onSelectDate?.(day.date)}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredDay({ day, x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-[10.5px] h-[10.5px] rounded-xs transition-all ${
                            isSelected ? 'ring-2 ring-[var(--color-accent)] z-10 scale-125' : 'hover:ring-1 hover:ring-[var(--color-border-hover)]'
                          }`}
                          style={{
                            backgroundColor: levelColors[day.level],
                          }}
                          aria-label={`${formatDateKey(day.date)}: ${day.completed}/${day.total} quests, ${Math.round(day.score)}%`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Footer Legend */}
            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-[var(--color-border)] text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="text-[10px] text-[var(--color-text-secondary)]">
                {language === 'vi' ? 'Tìm hiểu cách tính Complete quests' : 'Learn how we count complete quests'}
              </span>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span>{language === 'vi' ? 'Ít' : 'Less'}</span>
                <div className="flex items-center gap-[3px]">
                  {levelColors.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rounded-xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span>{language === 'vi' ? 'Nhiều' : 'More'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: GitHub Style Vertical Year Buttons */}
        <div className="flex lg:flex-col flex-row gap-1.5 shrink-0 w-full lg:w-24">
          {availableYears.map(yr => {
            const isCurrentActive = selectedYear === yr.id;
            return (
              <button
                key={yr.id}
                type="button"
                onClick={() => setSelectedYear(yr.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-left transition-all duration-150 active:scale-95 ${
                  isCurrentActive
                    ? 'bg-[var(--color-accent)] text-white font-bold shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                }`}
              >
                {yr.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Annual Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
        {/* Completed Quests */}
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[11px]">
            <Target className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>{language === 'vi' ? 'Nhiệm vụ xong' : 'Quests Done'}</span>
          </div>
          <div className="text-lg font-extrabold mt-1 text-[var(--color-text-primary)]">
            {yearlyStats.totalCompleted}
          </div>
        </div>

        {/* Total XP */}
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[11px]">
            <Zap className="w-3.5 h-3.5 text-[var(--color-xp)]" />
            <span>{language === 'vi' ? 'Tổng XP tích lũy' : 'XP Earned'}</span>
          </div>
          <div className="text-lg font-extrabold mt-1 text-[var(--color-xp)] font-mono">
            +{yearlyStats.totalXP.toLocaleString()}
          </div>
        </div>

        {/* Active Days */}
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[11px]">
            <Flame className="w-3.5 h-3.5 text-[var(--color-danger)]" />
            <span>{language === 'vi' ? 'Ngày có hoạt động' : 'Active Days'}</span>
          </div>
          <div className="text-lg font-extrabold mt-1 text-[var(--color-text-primary)]">
            {yearlyStats.activeDays} <span className="text-xs font-normal text-[var(--color-text-tertiary)]">/ 365d</span>
          </div>
        </div>

        {/* Goal Days (≥70%) */}
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-[var(--color-success)]" />
            <span>{language === 'vi' ? 'Ngày đạt chuẩn (≥70%)' : 'Goal Days'}</span>
          </div>
          <div className="text-lg font-extrabold mt-1 text-[var(--color-success)]">
            {yearlyStats.successfulDays} <span className="text-xs font-normal text-[var(--color-text-tertiary)]">{language === 'vi' ? 'ngày' : 'days'}</span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg shadow-xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mb-1.5 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 6}px`,
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <div className="font-semibold">{formatDateKey(hoveredDay.day.date)}</div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{hoveredDay.day.completed} / {hoveredDay.day.total} {language === 'vi' ? 'hoàn thành' : 'completed'}</span>
            <span>•</span>
            <span className="font-medium" style={{ color: hoveredDay.day.score >= 70 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
              {Math.round(hoveredDay.day.score)}%
            </span>
            {hoveredDay.day.xpEarned > 0 && (
              <>
                <span>•</span>
                <span className="font-bold font-mono" style={{ color: 'var(--color-xp)' }}>+{hoveredDay.day.xpEarned} XP</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
