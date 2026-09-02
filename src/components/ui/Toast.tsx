import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const TOAST_COLORS = {
  success: 'var(--color-success)',
  info: 'var(--color-accent)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const accentColor = TOAST_COLORS[toast.type ?? 'info'];

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg shadow-lg text-sm max-w-xs"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderLeft: `3px solid ${accentColor}`,
        color: 'var(--color-text-primary)',
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 200ms ease-out, opacity 200ms ease-out',
      }}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-xs font-medium px-2 py-1 rounded"
          style={{ color: accentColor }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 rounded hover:opacity-70"
        style={{ color: 'var(--color-text-tertiary)' }}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/** Toast container that renders at the bottom of the viewport */
export const ToastContainer: React.FC<{
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  className?: string;
}> = ({ toasts, onDismiss, className = 'bottom-3' }) => {
  if (toasts.length === 0) return null;

  // Show at most the 3 latest toasts to prevent screen clutter
  const visibleToasts = toasts.slice(-3);

  return (
    <div className={`fixed ${className} left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1.5 pointer-events-auto`}>
      {visibleToasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
