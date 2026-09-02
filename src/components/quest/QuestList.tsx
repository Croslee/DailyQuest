import React, { useState, useEffect } from 'react';
import type { TodayInstance } from '@/hooks/useTodayInstances';
import type { Quest } from '@/types/quest';
import { QuestItem } from './QuestItem';
import { EmptyState } from '../ui/EmptyState';
import { Swords } from 'lucide-react';
import { questInstanceRepository } from '@/db/index';

interface QuestListProps {
  instances: TodayInstance[];
  onComplete: (instanceId: string) => void;
  onSkip: (instanceId: string) => void;
  onPostpone: (instanceId: string) => void;
  onStartFocus?: (instance: TodayInstance) => void;
  onEditQuest?: (quest: Quest) => void;
  hideCompleted?: boolean;
  onAddQuest?: () => void;
  onUpdated?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  isCompletedTab?: boolean;
}

export const QuestList: React.FC<QuestListProps> = ({
  instances,
  onComplete,
  onSkip,
  onPostpone,
  onStartFocus,
  onEditQuest,
  hideCompleted = true,
  onAddQuest,
  onUpdated,
  emptyTitle,
  emptyDescription,
  isCompletedTab = false,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Filter visible items
  const visibleInstances = hideCompleted
    ? instances.filter(i => i.status === 'pending')
    : instances;

  // Keyboard navigation listener (J/K or Arrow Down/Up)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea or when a modal is open
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT';
      const isModalOpen = Boolean(document.querySelector('[role="dialog"], [role="alertdialog"]'));

      if (isInput || isModalOpen || visibleInstances.length === 0) {
        if (!isInput && !isModalOpen && (e.key === 'n' || e.key === 'N') && onAddQuest) {
          e.preventDefault();
          onAddQuest();
        }
        return;
      }

      if ((e.key === 'n' || e.key === 'N') && onAddQuest) {
        e.preventDefault();
        onAddQuest();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % visibleInstances.length);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev <= 0 ? visibleInstances.length - 1 : prev - 1));
      } else if (selectedIndex >= 0 && selectedIndex < visibleInstances.length) {
        const current = visibleInstances[selectedIndex];
        if (e.key === 'x' || e.key === 'X') {
          onComplete(current.id);
        } else if (e.key === 's' || e.key === 'S') {
          onSkip(current.id);
        } else if ((e.key === 'p' || e.key === 'P') && onStartFocus) {
          onStartFocus(current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleInstances, selectedIndex, onComplete, onSkip, onStartFocus]);

  if (isCompletedTab && instances.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No completed quests yet.'}
        description={emptyDescription || 'Complete quests today to see them here.'}
      />
    );
  }

  if (instances.length === 0) {
    return (
      <EmptyState
        icon={<Swords className="w-8 h-8" />}
        title={emptyTitle || 'No quests for today.'}
        description={emptyDescription || 'Start small.'}
        action={!isCompletedTab && onAddQuest ? { label: '+ Add your first quest', onClick: onAddQuest } : undefined}
      />
    );
  }

  if (visibleInstances.length === 0 && hideCompleted) {
    return (
      <EmptyState
        title="All quests completed!"
        description="Great work today."
      />
    );
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const fromIdx = instances.findIndex(i => i.id === draggedId);
    const toIdx = instances.findIndex(i => i.id === targetId);

    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...instances];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Update order values in database
    await Promise.all(
      reordered.map((inst, index) =>
        questInstanceRepository.update({
          ...inst,
          order: index,
        })
      )
    );

    setDraggedId(null);
    onUpdated?.();
  };

  return (
    <div className="flex flex-col gap-0.5">
      {visibleInstances.map((instance, idx) => (
        <QuestItem
          key={instance.id}
          instance={instance}
          onComplete={onComplete}
          onSkip={onSkip}
          onPostpone={onPostpone}
          onStartFocus={onStartFocus}
          onEditQuest={onEditQuest}
          hideCompleted={hideCompleted}
          onUpdated={onUpdated}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isFocusedKeyboard={idx === selectedIndex}
        />
      ))}
    </div>
  );
};
