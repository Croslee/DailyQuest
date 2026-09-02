import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, Theme } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { settingsRepository } from '@/db/index';
import { applyTheme } from '@/constants/theme';
import { notifyDataChanged, onDataChanged } from '@/services/syncChannel';

/** Hook to access and update application settings with instant live sync */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const loaded = await settingsRepository.getAll();
      setSettings(loaded);
      applyTheme(loaded.theme);
    } catch (error) {
      console.error('[useSettings] Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    const unsubscribe = onDataChanged(() => {
      loadSettings();
    });
    return () => {
      unsubscribe();
    };
  }, [loadSettings]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await settingsRepository.set(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      applyTheme(value as Theme);
    }
    notifyDataChanged('settings');
  }, []);

  return { settings, loading, updateSetting, reload: loadSettings };
}
