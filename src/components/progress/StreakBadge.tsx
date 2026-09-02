import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, className = '' }) => {
  if (streak <= 0) return null;

  return (
    <div
      className={`flex items-center gap-1 text-sm font-medium ${className}`}
      style={{ color: 'var(--color-xp)' }}
      title={`${streak} day streak`}
    >
      <Flame className="w-4 h-4" />
      <span>{streak}</span>
    </div>
  );
};
