import type { Difficulty, Priority } from './quest';

/** Theme options */
export type Theme = 'light' | 'dark' | 'system';

/** Language options */
export type Language = 'en' | 'vi';

/** Settings stored as key-value pairs in IndexedDB */
export interface SettingsRecord {
  key: string;
  value: unknown;
}

/** Typed application settings */
export interface AppSettings {
  theme: Theme;
  language: Language;
  hideCompleted: boolean;
  completionAnimation: boolean;
  soundEffects: boolean;
  dailyGoal: number;
  defaultDifficulty: Difficulty;
  defaultXP: number;
  defaultPriority: Priority;
  customCategories: string[];
  lastBackupDate?: string;
  lastBackupDismissedDate?: string;
  githubGistToken?: string;
  githubGistId?: string;
  equippedBadgeId?: string;
}

/** Default settings values */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'vi',
  hideCompleted: true,
  completionAnimation: true,
  soundEffects: true,
  dailyGoal: 5,
  defaultDifficulty: 'normal',
  defaultXP: 20,
  defaultPriority: 'medium',
  customCategories: [],
  lastBackupDate: undefined,
  lastBackupDismissedDate: undefined,
  githubGistToken: '',
  githubGistId: '',
  equippedBadgeId: undefined,
};
