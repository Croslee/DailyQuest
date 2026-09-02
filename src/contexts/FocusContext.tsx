import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { TodayInstance } from '@/hooks/useTodayInstances';
import { playQuestCompleteSound, playPomodoroCompleteSound } from '@/utils/audio';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

interface FocusContextType {
  activeInstance: TodayInstance | null;
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  isModalOpen: boolean;
  startFocus: (instance: TodayInstance) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  resetFocus: () => void;
  setMode: (mode: TimerMode) => void;
  openModal: (instance?: TodayInstance) => void;
  closeModal: () => void;
  formattedTime: string;
  progress: number;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeInstance, setActiveInstance] = useState<TodayInstance | null>(null);
  const [mode, setModeState] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const startFocus = useCallback((instance: TodayInstance) => {
    setActiveInstance(instance);
    setModeState('focus');
    setTimeLeft(MODE_DURATIONS.focus);
    setIsRunning(true);
    setIsModalOpen(true);
  }, []);

  const openModal = useCallback((instance?: TodayInstance) => {
    if (instance) {
      if (activeInstance?.id !== instance.id) {
        setActiveInstance(instance);
        setModeState('focus');
        setTimeLeft(MODE_DURATIONS.focus);
        setIsRunning(false);
      }
    }
    setIsModalOpen(true);
  }, [activeInstance]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const pauseFocus = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeFocus = useCallback(() => {
    setIsRunning(true);
  }, []);

  const resetFocus = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  }, [mode]);

  const setMode = useCallback((newMode: TimerMode) => {
    setModeState(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playPomodoroCompleteSound(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = MODE_DURATIONS[mode];
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <FocusContext.Provider
      value={{
        activeInstance,
        mode,
        timeLeft,
        isRunning,
        isModalOpen,
        startFocus,
        pauseFocus,
        resumeFocus,
        resetFocus,
        setMode,
        openModal,
        closeModal,
        formattedTime,
        progress,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = (): FocusContextType => {
  const context = useContext(FocusContext);
  if (!context) {
    // Return a safe fallback if not wrapped in provider
    return {
      activeInstance: null,
      mode: 'focus',
      timeLeft: 25 * 60,
      isRunning: false,
      isModalOpen: false,
      startFocus: () => {},
      pauseFocus: () => {},
      resumeFocus: () => {},
      resetFocus: () => {},
      setMode: () => {},
      openModal: () => {},
      closeModal: () => {},
      formattedTime: '25:00',
      progress: 0,
    };
  }
  return context;
};
