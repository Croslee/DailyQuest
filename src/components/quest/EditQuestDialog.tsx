import React, { useState, useEffect } from 'react';
import type { Quest, UpdateQuestInput, Difficulty, Priority, Recurrence, Subtask } from '@/types/quest';
import { XP_DEFAULTS, DIFFICULTY_LABELS, PRIORITY_LABELS, DEFAULT_CATEGORIES } from '@/constants/defaults';
import { X, Archive, Trash2, RotateCcw, Plus, Minus } from 'lucide-react';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { generateId } from '@/utils/id';
import { useTranslation } from '@/i18n/I18nContext';

interface EditQuestDialogProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, input: UpdateQuestInput) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onUnarchive?: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditQuestDialog: React.FC<EditQuestDialogProps> = ({
  quest,
  isOpen,
  onClose,
  onUpdate,
  onArchive,
  onUnarchive,
  onDelete,
}) => {
  const { language } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [xp, setXp] = useState(XP_DEFAULTS.normal);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Other');
  const [recurrenceType, setRecurrenceType] = useState<'once' | 'daily' | 'weekly'>('once');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const WEEKDAYS = language === 'vi'
    ? [
        { day: 1, label: 'T2' },
        { day: 2, label: 'T3' },
        { day: 3, label: 'T4' },
        { day: 4, label: 'T5' },
        { day: 5, label: 'T6' },
        { day: 6, label: 'T7' },
        { day: 0, label: 'CN' },
      ]
    : [
        { day: 1, label: 'Mon' },
        { day: 2, label: 'Tue' },
        { day: 3, label: 'Wed' },
        { day: 4, label: 'Thu' },
        { day: 5, label: 'Fri' },
        { day: 6, label: 'Sat' },
        { day: 0, label: 'Sun' },
      ];

  useEffect(() => {
    if (quest && isOpen) {
      setTitle(quest.title);
      setDescription(quest.description ?? '');
      setDifficulty(quest.difficulty);
      setXp(quest.xp);
      setPriority(quest.priority);
      setCategory(quest.category);
      setSubtasks(quest.subtasks ?? []);
      setNewSubtaskTitle('');
      if (quest.recurrence.type === 'weekly') {
        setRecurrenceType('weekly');
        setSelectedDays(quest.recurrence.days);
      } else if (quest.recurrence.type === 'daily') {
        setRecurrenceType('daily');
        setSelectedDays([1, 2, 3, 4, 5]);
      } else {
        setRecurrenceType('once');
        setSelectedDays([1, 2, 3, 4, 5]);
      }
      setConfirmDelete(false);
    }
  }, [quest, isOpen]);

  if (!isOpen || !quest) return null;

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setSubtasks([...subtasks, { id: generateId(), title: trimmed, completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let recurrence: Recurrence;
    if (recurrenceType === 'weekly') {
      recurrence = { type: 'weekly', days: selectedDays };
    } else {
      recurrence = { type: recurrenceType };
    }

    await onUpdate(quest.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
      xp,
      priority,
      category,
      recurrence,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });
    onClose();
  };

  const handleArchiveToggle = async () => {
    if (quest.archived && onUnarchive) {
      await onUnarchive(quest.id);
    } else {
      await onArchive(quest.id);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    await onDelete(quest.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !quest) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden max-h-[90vh] bg-[var(--color-bg-primary)] border-[var(--color-border)] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Edit quest"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0 border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              {quest.archived
                ? (language === 'vi' ? 'Nhiệm Vụ Đã Lưu Trữ' : 'Archived Quest')
                : (language === 'vi' ? 'Chỉnh Sửa Nhiệm Vụ' : 'Edit Quest')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Fields */}
          <div className="px-5 py-4 space-y-3.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {/* Title */}
            <div>
              <label htmlFor="edit-quest-title" className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                {language === 'vi' ? 'Tiêu đề nhiệm vụ *' : 'Quest Title *'}
              </label>
              <input
                id="edit-quest-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border outline-none bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] transition-colors"
                required
                maxLength={200}
              />
            </div>

            {/* Description / Notes (Textarea 2-3 lines) */}
            <div>
              <label htmlFor="edit-quest-desc" className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                {language === 'vi' ? 'Ghi chú / Mô tả (tùy chọn)' : 'Notes / Description (optional)'}
              </label>
              <textarea
                id="edit-quest-desc"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={language === 'vi' ? 'Mục tiêu, link tài liệu hoặc lưu ý...' : 'Extra details or links...'}
                className="w-full px-3 py-2 text-xs rounded-lg border outline-none resize-none bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] transition-colors custom-scrollbar"
              />
            </div>

            {/* Difficulty + XP */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                  {language === 'vi' ? 'Độ khó' : 'Difficulty'}
                </label>
                <FilterDropdown
                  value={difficulty}
                  options={Object.entries(DIFFICULTY_LABELS).map(([val, label]) => ({
                    value: val,
                    label,
                  }))}
                  onChange={val => setDifficulty(val as Difficulty)}
                  defaultValue="normal"
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">XP</label>
                <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-0.5 shadow-2xs w-full justify-between h-[34px]">
                  <button
                    type="button"
                    onClick={() => setXp(prev => Math.max(5, prev - 5))}
                    disabled={xp <= 5}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] active:scale-90 transition-all disabled:opacity-30 leading-none"
                    aria-label="Decrease XP"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold select-none text-[var(--color-xp)]">
                    +{xp} XP
                  </span>
                  <button
                    type="button"
                    onClick={() => setXp(prev => Math.min(500, prev + 5))}
                    disabled={xp >= 500}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] active:scale-90 transition-all disabled:opacity-30 leading-none"
                    aria-label="Increase XP"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Priority + Category */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                  {language === 'vi' ? 'Độ ưu tiên' : 'Priority'}
                </label>
                <FilterDropdown
                  value={priority}
                  options={Object.entries(PRIORITY_LABELS).map(([val, label]) => ({
                    value: val,
                    label,
                  }))}
                  onChange={val => setPriority(val as Priority)}
                  defaultValue="medium"
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                  {language === 'vi' ? 'Danh mục' : 'Category'}
                </label>
                <FilterDropdown
                  value={category}
                  options={DEFAULT_CATEGORIES.map(cat => ({
                    value: cat,
                    label: cat,
                  }))}
                  onChange={val => setCategory(val)}
                  defaultValue="Other"
                  fullWidth
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                {language === 'vi' ? 'Tần suất lặp lại' : 'Recurrence'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                {(['once', 'daily', 'weekly'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecurrenceType(type)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 active:scale-95 ${
                      recurrenceType === type
                        ? 'bg-[var(--color-accent)] text-white shadow-xs font-bold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    {type === 'once' ? (language === 'vi' ? 'Một lần' : 'Once') : type === 'daily' ? (language === 'vi' ? 'Hàng ngày' : 'Daily') : (language === 'vi' ? 'Hàng tuần' : 'Weekly')}
                  </button>
                ))}
              </div>

              {/* Weekday selector when 'weekly' is chosen */}
              {recurrenceType === 'weekly' && (
                <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]">
                  <span className="block text-[11px] font-medium mb-1.5 text-[var(--color-text-secondary)]">
                    {language === 'vi' ? 'Lặp vào các ngày:' : 'Repeat on:'}
                  </span>
                  <div className="flex justify-between gap-1">
                    {WEEKDAYS.map(({ day, label }) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`flex-1 h-7 text-xs rounded-lg border font-bold transition-all duration-150 active:scale-90 ${
                            isSelected
                              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-xs'
                              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                {language === 'vi' ? 'Nhiệm vụ con / Subtasks' : 'Subtasks'}
              </label>
              {subtasks.length > 0 && (
                <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs">
                      <span className="truncate flex-1 mr-2 text-[var(--color-text-primary)]">{st.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(st.id)}
                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] p-0.5 rounded transition-colors"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder={language === 'vi' ? '+ Thêm nhiệm vụ con...' : '+ Add subtask...'}
                  className="flex-1 h-8 px-2.5 text-xs rounded-lg border outline-none bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 h-8 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Pinned Bottom Actions */}
          <div className="p-4 border-t bg-[var(--color-bg-primary)] flex-shrink-0 flex items-center justify-between gap-2.5 border-[var(--color-border)]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleArchiveToggle}
                className="flex items-center gap-1 px-2.5 h-8.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] active:scale-95"
                title={quest.archived ? 'Restore to active list' : 'Archive quest'}
              >
                {quest.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                <span>{quest.archived ? (language === 'vi' ? 'Khôi phục' : 'Restore') : (language === 'vi' ? 'Lưu trữ' : 'Archive')}</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className={`flex items-center gap-1 px-2.5 h-8.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                  confirmDelete
                    ? 'border-[var(--color-danger)] bg-[var(--color-danger)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.1)]'
                }`}
                title="Delete quest template"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDelete ? (language === 'vi' ? 'Xác nhận xóa' : 'Confirm') : (language === 'vi' ? 'Xóa' : 'Delete')}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 h-8.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-all active:scale-95"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 h-8.5 text-xs font-bold rounded-lg transition-all text-white shadow-sm hover:opacity-90 active:scale-95 bg-[var(--color-accent)]"
              >
                {language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
