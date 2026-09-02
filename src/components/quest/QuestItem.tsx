import React, { useState, useRef, useEffect } from 'react';
import type { TodayInstance } from '@/hooks/useTodayInstances';
import type { Quest } from '@/types/quest';
import {
  MoreVertical,
  SkipForward,
  CalendarClock,
  GripVertical,
  CheckSquare2,
  Square,
  Clock,
  Plus,
  Trash2,
  CheckCheck,
  Edit,
  RotateCcw,
} from 'lucide-react';
import { questService } from '@/services/questService';
import { completionService } from '@/services/completionService';
import { questInstanceRepository } from '@/db/index';
import { useTranslation } from '@/i18n/I18nContext';
import { generateId } from '@/utils/id';
import { renderFormattedText } from '@/utils/text';
import { playQuestCompleteSound } from '@/utils/audio';
import { useSettings } from '@/hooks/useSettings';
import { useFocus } from '@/contexts/FocusContext';

interface QuestItemProps {
  instance: TodayInstance;
  onComplete: (instanceId: string) => void;
  onSkip: (instanceId: string) => void;
  onPostpone: (instanceId: string) => void;
  onStartFocus?: (instance: TodayInstance) => void;
  onEditQuest?: (quest: Quest) => void;
  hideCompleted?: boolean;
  onUpdated?: () => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
  isFocusedKeyboard?: boolean;
}

export const QuestItem: React.FC<QuestItemProps> = ({
  instance,
  onComplete,
  onSkip,
  onPostpone,
  onStartFocus,
  onEditQuest,
  hideCompleted = true,
  onUpdated,
  onDragStart,
  onDragOver,
  onDrop,
  isFocusedKeyboard = false,
}) => {
  const { language } = useTranslation();
  const { settings } = useSettings();
  const { activeInstance, isRunning, formattedTime, openModal, startFocus } = useFocus();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const addSubtaskInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCompleted = instance.status === 'completed';
  const isSkipped = instance.status === 'skipped';
  const isPending = instance.status === 'pending';
  const quest = instance.quest;

  // Check if this task currently has an active Pomodoro timer running
  const isPomodoroActive = activeInstance?.id === instance.id;

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Hide completed/skipped if setting enabled and animation is done
  if ((isCompleted || isSkipped) && hideCompleted && !isAnimating) {
    return null;
  }

  const handleComplete = () => {
    if (!isPending) return;
    setIsAnimating(true);
    onComplete(instance.id);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  const handleReopen = async () => {
    await completionService.reopenQuest(instance.id);
    onUpdated?.();
  };

  const handleUndoSkip = async () => {
    await completionService.undoSkip(instance.id);
    onUpdated?.();
  };

  const handleStartEdit = () => {
    if (!isPending) return;
    setEditTitle(quest?.title ?? '');
    setIsEditing(true);
  };

  const handleSaveTitle = async () => {
    if (!isEditing || !quest) return;
    setIsEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== quest.title) {
      await questService.update(quest.id, { title: trimmed });
      onUpdated?.();
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!instance.subtasks) return;
    const updatedSubtasks = instance.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // If an uncompleted subtask is toggled on a completed quest, reopen quest to pending
    const hasUncompleted = updatedSubtasks.some(st => !st.completed);
    const newStatus = hasUncompleted && isCompleted ? 'pending' : instance.status;

    await questInstanceRepository.update({
      ...instance,
      status: newStatus,
      subtasks: updatedSubtasks,
    });

    onUpdated?.();

    // Auto complete quest when all subtasks are finished
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    if (allDone && isPending) {
      playQuestCompleteSound(settings.soundEffects);
      setTimeout(() => {
        handleComplete();
      }, 400);
    }
  };

  const handleAddInlineSubtask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title) return;

    const currentSubtasks = instance.subtasks ?? [];
    const newSt = { id: generateId(), title, completed: false };
    const updated = [...currentSubtasks, newSt];

    // Adding an incomplete subtask reopens a completed quest
    const newStatus = isCompleted ? 'pending' : instance.status;

    await questInstanceRepository.update({
      ...instance,
      status: newStatus,
      subtasks: updated,
    });

    // Also sync to quest blueprint template
    if (quest) {
      await questService.update(quest.id, { subtasks: updated });
    }

    setNewSubtaskTitle('');
    onUpdated?.();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!instance.subtasks) return;
    const updated = instance.subtasks.filter(st => st.id !== subtaskId);
    await questInstanceRepository.update({
      ...instance,
      subtasks: updated,
    });
    if (quest) {
      await questService.update(quest.id, { subtasks: updated });
    }
    onUpdated?.();
  };

  const handleLaunchPomodoro = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartFocus) {
      onStartFocus(instance);
    } else {
      startFocus(instance);
    }
  };

  const xp = quest?.xp ?? 0;
  const subtasks = instance.subtasks ?? [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <div
      draggable={isPending && !isEditing}
      onDragStart={(e) => onDragStart?.(e, instance.id)}
      onDragOver={(e) => onDragOver?.(e, instance.id)}
      onDrop={(e) => onDrop?.(e, instance.id)}
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group relative flex flex-col rounded-xl transition-all duration-150 min-w-0 max-w-full w-full border mb-1 select-none cursor-pointer hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-secondary)] ${
        isFocusedKeyboard ? 'ring-2 ring-[var(--color-accent)]' : ''
      }`}
      style={{
        backgroundColor: isExpanded
          ? 'var(--color-bg-secondary)'
          : 'transparent',
        borderColor: isExpanded
          ? 'var(--color-accent)'
          : menuOpen
          ? 'var(--color-border)'
          : 'transparent',
      }}
    >
      {/* Default Row State: Checkbox | Task title | Secondary Actions on Hover | +XP */}
      <div className="flex items-center justify-between px-3 py-2 min-w-0 max-w-full w-full gap-2">
        {/* Left Side: Drag handle + Checkbox + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Drag handle (hover/focus only) */}
          {isPending && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-3.5 h-3.5 -ml-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 hover:opacity-100 group-focus-within:opacity-50 transition-opacity flex-shrink-0"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={isCompleted}
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
            disabled={!isPending}
            className="flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all flex-shrink-0"
            style={{
              borderColor: isCompleted
                ? 'var(--color-success)'
                : isSkipped
                ? 'var(--color-border)'
                : 'var(--color-border-hover)',
              backgroundColor: isCompleted
                ? 'var(--color-success)'
                : 'transparent',
              cursor: isPending ? 'pointer' : 'default',
            }}
            aria-label={isPending ? `Complete ${quest?.title}` : `${instance.status}`}
          >
            {isCompleted && (
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M2 6l3 3 5-5" />
              </svg>
            )}
            {isSkipped && (
              <SkipForward className="w-3 h-3 text-[var(--color-text-tertiary)]" />
            )}
          </button>

          {/* Task Title (Prominent) */}
          <div
            className="flex-1 min-w-0 max-w-full flex items-center gap-2 py-0.5"
            title={quest?.description ? quest.description : quest?.title ?? 'Quest'}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="flex-1 min-w-0 text-sm px-2 py-0.5 rounded border outline-none bg-[var(--color-bg-primary)] border-[var(--color-accent)] font-medium"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
                className="text-sm font-medium truncate min-w-0 break-words [overflow-wrap:anywhere] transition-all leading-snug"
                style={{
                  textDecoration: isCompleted || isSkipped ? 'line-through' : 'none',
                  color: isCompleted || isSkipped ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  opacity: isCompleted || isSkipped ? 0.75 : 1,
                }}
              >
                {quest?.title ?? 'Unknown Quest'}
              </span>
            )}

            {/* Subtask micro-count if subtasks exist */}
            {subtasks.length > 0 && !isExpanded && (
              <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] flex-shrink-0">
                {completedSubtasks}/{subtasks.length}
              </span>
            )}

            {/* Status Badges: Done / Skipped */}
            {isCompleted && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[rgba(16,185,129,0.2)] flex-shrink-0">
                {language === 'vi' ? 'Đã xong' : 'Done'}
              </span>
            )}
            {isSkipped && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(245,158,11,0.1)] text-[var(--color-xp)] border border-[rgba(245,158,11,0.2)] flex-shrink-0">
                {language === 'vi' ? 'Bỏ qua' : 'Skipped'}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Quick Actions on Hover + Secondary XP + Menu */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Active Pomodoro Timer Countdown (if running for this quest) */}
          {isPomodoroActive ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openModal(instance);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all shadow-xs animate-pulse"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}
              title="Active Pomodoro session - click to view"
            >
              <Clock className="w-3 h-3" />
              <span>{formattedTime}</span>
            </button>
          ) : (
            /* Quick Pomodoro Start (fades in on hover/focus) */
            isPending && (
              <button
                type="button"
                onClick={handleLaunchPomodoro}
                className="p-1 rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all flex-shrink-0"
                style={{ color: 'var(--color-text-tertiary)' }}
                title="Start Pomodoro Focus"
                aria-label="Start Pomodoro Focus"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {/* XP Reward (Secondary Metadata) */}
          {xp > 0 && (
            <span
              className="text-xs font-semibold px-1 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-xp)] transition-colors flex-shrink-0"
            >
              +{xp}
            </span>
          )}

          {/* More Options Menu (⋮) */}
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!menuOpen && menuRef.current) {
                  const rect = menuRef.current.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  setOpenUpward(spaceBelow < 190);
                }
                setMenuOpen(!menuOpen);
              }}
              className={`p-1 rounded transition-all ${
                menuOpen
                  ? 'opacity-100 text-[var(--color-text-primary)]'
                  : isCompleted || isSkipped
                  ? 'opacity-60 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                  : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              }`}
              aria-label="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                className={`absolute right-0 ${
                  openUpward ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'
                } rounded-xl shadow-xl border p-1 z-50 min-w-[170px] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* Edit details */}
                {quest && onEditQuest && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditQuest(quest);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all hover:bg-[var(--color-bg-secondary)] active:scale-[0.98] font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Chỉnh sửa chi tiết' : 'Edit quest details'}</span>
                  </button>
                )}

                {/* Focus Pomodoro */}
                {isPending && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleLaunchPomodoro(e);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all hover:bg-[var(--color-bg-secondary)] active:scale-[0.98] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Focus Pomodoro</span>
                  </button>
                )}

                {/* Reopen quest if completed */}
                {isCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      handleReopen();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all hover:bg-[var(--color-bg-secondary)] active:scale-[0.98] font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Mở lại nhiệm vụ' : 'Reopen quest'}</span>
                  </button>
                )}

                {/* Undo skip if skipped */}
                {isSkipped && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUndoSkip();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all hover:bg-[var(--color-bg-secondary)] active:scale-[0.98] font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Khôi phục nhiệm vụ' : 'Restore / Undo skip'}</span>
                  </button>
                )}

                {/* Skip today */}
                {isPending && (
                  <button
                    type="button"
                    onClick={() => {
                      onSkip(instance.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all hover:bg-[var(--color-bg-secondary)] active:scale-[0.98] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Bỏ qua hôm nay' : 'Skip today'}</span>
                  </button>
                )}

                {/* Postpone to tomorrow */}
                {isPending && (
                  <button
                    type="button"
                    onClick={() => {
                      onPostpone(instance.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all hover:bg-[var(--color-bg-secondary)] active:scale-[0.98] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Dời sang ngày mai' : 'Postpone to tomorrow'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Accordion: Description & Subtasks Checklist */}
      {isExpanded && (
        <div
          className="px-3 pb-3 pt-1 border-t space-y-2.5 text-xs animate-in fade-in duration-150 max-w-full overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Description */}
          {quest?.description && (
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-full break-words break-all [overflow-wrap:anywhere] pt-1">
              <span className="font-semibold text-[11px] text-[var(--color-text-primary)] mb-0.5 block">
                {language === 'vi' ? 'Mô tả:' : 'Description:'}
              </span>
              <div className="max-w-full break-words break-all [overflow-wrap:anywhere]">
                {renderFormattedText(quest.description)}
              </div>
            </div>
          )}

          {/* Subtasks Section */}
          <div className="space-y-1.5 pt-1">
            {subtasks.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <span>Subtasks:</span>
                  <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                    {completedSubtasks}/{subtasks.length} ({Math.round(subtaskProgress)}%)
                  </span>
                </div>

                {subtaskProgress === 100 && isPending && (
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-success)] hover:underline"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Hoàn thành ngay' : 'Complete'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Subtask Progress Bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${subtaskProgress}%`,
                    backgroundColor:
                      subtaskProgress === 100
                        ? 'var(--color-success)'
                        : 'var(--color-accent)',
                  }}
                />
              </div>
            )}

            {/* Subtask items list */}
            {subtasks.length > 0 && (
              <div className="space-y-1 max-w-full overflow-hidden">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="group/st flex items-center justify-between py-1 px-1.5 rounded hover:bg-[var(--color-bg-tertiary)] transition-all cursor-pointer max-w-full"
                    onClick={() => handleToggleSubtask(st.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full mr-1.5">
                      {st.completed ? (
                        <CheckSquare2 className="w-3.5 h-3.5 text-[var(--color-success)] flex-shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] group-hover/st:text-[var(--color-accent)] flex-shrink-0" />
                      )}
                      <span
                        className="text-xs flex-1 break-words break-all [overflow-wrap:anywhere] leading-tight"
                        style={{
                          textDecoration: st.completed ? 'line-through' : 'none',
                          color: st.completed
                            ? 'var(--color-text-tertiary)'
                            : 'var(--color-text-primary)',
                        }}
                      >
                        {st.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubtask(st.id);
                      }}
                      className="opacity-0 group-hover/st:opacity-100 p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-all flex-shrink-0"
                      title={language === 'vi' ? 'Xóa subtask này' : 'Delete subtask'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Streamlined Inline Add Subtask */}
            <form
              onSubmit={handleAddInlineSubtask}
              className="flex items-center gap-1.5 pt-0.5"
            >
              <input
                ref={addSubtaskInputRef}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? '+ Thêm subtask mới...'
                    : '+ Add new subtask...'
                }
                className="flex-1 px-2.5 py-1 text-xs rounded-md border outline-none bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:border-[var(--color-accent)] min-w-0"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-2 py-1 text-xs font-semibold rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-40 flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
