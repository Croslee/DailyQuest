import type { DailyQuestDB } from '../database';
import type { SettingsRecord } from '@/types/settings';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';

/**
 * Repository for application settings.
 * Settings are stored as key-value pairs for flexibility.
 */
export class SettingsRepository {
  constructor(private db: DailyQuestDB) {}

  /** Get a single setting value by key */
  async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const record = await this.db.settings.get(key);
    if (record === undefined) return DEFAULT_SETTINGS[key];
    return record.value as AppSettings[K];
  }

  /** Set a single setting value */
  async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    await this.db.settings.put({ key, value });
  }

  /** Get all settings, merged with defaults */
  async getAll(): Promise<AppSettings> {
    const records = await this.db.settings.toArray();
    let initialLang = DEFAULT_SETTINGS.language;
    try {
      const saved = localStorage.getItem('dailyquest_language');
      if (saved === 'vi' || saved === 'en') {
        initialLang = saved;
      }
    } catch {}
    const settings: AppSettings = { ...DEFAULT_SETTINGS, language: initialLang };
    for (const record of records) {
      if (record.key in settings) {
        (settings as unknown as Record<string, unknown>)[record.key] = record.value;
      }
    }
    return settings;
  }

  /** Reset all settings to defaults */
  async resetAll(): Promise<void> {
    await this.db.settings.clear();
  }

  /** Delete a single setting (reverts to default) */
  async delete(key: string): Promise<void> {
    await this.db.settings.delete(key);
  }
}
