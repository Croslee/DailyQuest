import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    {icon && <div className="mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{icon}</div>}
    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
    {description && (
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-3 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        style={{ color: 'var(--color-accent)' }}
      >
        {action.label}
      </button>
    )}
  </div>
);
