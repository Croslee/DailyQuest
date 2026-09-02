import React from 'react';
import type { LevelResult } from '@/types/statistics';
import { getRankForLevel } from '@/domain/rank';

interface LevelBadgeProps {
  level: LevelResult;
  compact?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, compact = false }) => {
  const rank = getRankForLevel(level.level);

  if (compact) {
    return (
      <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--color-text-secondary)]">Level {level.level} · {level.totalXP} XP</span>
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono tracking-wide shadow-2xs"
            style={{ color: rank.color, backgroundColor: rank.badgeBg, borderColor: rank.badgeBorder }}
          >
            {rank.titleVi.split(' ')[0]}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full mt-1.5" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${level.progress}%`, backgroundColor: rank.color }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">Level {level.level}</span>
          <span
            className="px-2 py-0.5 rounded-md text-xs font-bold border font-mono tracking-wide shadow-2xs"
            style={{ color: rank.color, backgroundColor: rank.badgeBg, borderColor: rank.badgeBorder }}
            title={rank.titleVi}
          >
            {rank.titleVi.split(' ')[0]}
          </span>
        </div>
        <span className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {level.currentLevelXP} / {level.nextLevelXP} XP
        </span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${level.progress}%`, backgroundColor: rank.color }}
          role="progressbar"
          aria-valuenow={level.currentLevelXP}
          aria-valuemin={0}
          aria-valuemax={level.nextLevelXP}
          aria-label={`Level ${level.level}: ${level.currentLevelXP} of ${level.nextLevelXP} XP`}
        />
      </div>
    </div>
  );
};
