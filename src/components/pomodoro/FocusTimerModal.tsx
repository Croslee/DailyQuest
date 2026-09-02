import React from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';

interface FocusTimerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  questTitle?: string;
  onCompleteQuest?: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  questTitle: propQuestTitle,
  onCompleteQuest,
}) => {
  const {
    activeInstance,
    mode,
    isRunning,
    isModalOpen,
    pauseFocus,
    resumeFocus,
    resetFocus,
    setMode,
    closeModal,
    formattedTime,
    progress,
  } = useFocus();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isModalOpen;
  const handleClose = propOnClose || closeModal;
  const displayTitle = propQuestTitle || activeInstance?.quest?.title;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border p-6 mx-4 text-center space-y-5"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Focus Pomodoro
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quest being focused */}
        {displayTitle && (
          <div className="p-2.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs font-medium truncate text-[var(--color-text-primary)]">
            🎯 <span className="font-semibold">{displayTitle}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex p-1 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] gap-1">
          {(['focus', 'shortBreak', 'longBreak'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                mode === m
                  ? 'bg-[var(--color-accent)] text-white font-bold shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {m === 'focus' ? '25m Focus' : m === 'shortBreak' ? '5m Break' : '15m Break'}
            </button>
          ))}
        </div>

        {/* Big Timer Display */}
        <div className="py-2">
          <div className="text-5xl font-mono font-extrabold tracking-tight">
            {formattedTime}
          </div>
          <div className="w-48 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] mx-auto mt-4 overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={resetFocus}
            className="p-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={isRunning ? pauseFocus : resumeFocus}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:opacity-90 transition-transform active:scale-95"
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          {onCompleteQuest && (
            <button
              type="button"
              onClick={() => {
                onCompleteQuest();
                handleClose();
              }}
              className="p-3 rounded-full border border-[var(--color-success)] bg-[rgba(34,197,94,0.1)] text-[var(--color-success)] hover:bg-[rgba(34,197,94,0.2)] transition-colors"
              title="Mark quest completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
