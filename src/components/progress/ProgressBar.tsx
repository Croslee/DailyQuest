import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
  score: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ completed, total, score, className = '' }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">Today</span>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {completed} / {total}
          </span>
          {total > 0 && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              {Math.round(score)}%
            </span>
          )}
        </div>
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage >= 70 ? 'var(--color-success)' : 'var(--color-accent)',
          }}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${completed} of ${total} quests completed`}
        />
      </div>
    </div>
  );
};
