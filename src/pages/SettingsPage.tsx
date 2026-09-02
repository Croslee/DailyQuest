import React, { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import type { Theme, Language } from '@/types/settings';
import type { Difficulty, Priority } from '@/types/quest';
import { DIFFICULTY_LABELS, PRIORITY_LABELS, XP_DEFAULTS } from '@/constants/defaults';
import { THEME_OPTIONS } from '@/constants/theme';
import { ExportModal } from '@/components/export-import/ExportModal';
import { ImportModal } from '@/components/export-import/ImportModal';
import { gistSyncService } from '@/services/gistSyncService';
import { playQuestCompleteSound } from '@/utils/audio';
import { useTranslation } from '@/i18n/I18nContext';
import { db } from '@/db/index';
import {
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Sliders,
  Database,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Volume2,
  Globe,
  Cloud,
  RefreshCw,
  KeyRound,
  Minus,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { FilterDropdown } from '@/components/ui/FilterDropdown';

import { StorageDiagnostics } from '@/components/storage/StorageDiagnostics';

interface SettingsPageProps {
  onDataChanged?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataChanged }) => {
  const { settings, updateSetting, reload } = useSettings();
  const { language, setLanguage, t } = useTranslation();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // GitHub Gist Sync States
  const [gistToken, setGistToken] = useState(settings.githubGistToken || '');
  const [gistId, setGistId] = useState(settings.githubGistId || '');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleThemeChange = async (theme: Theme) => {
    await updateSetting('theme', theme);
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  const handleSaveGistCredentials = async () => {
    await updateSetting('githubGistToken', gistToken.trim());
    await updateSetting('githubGistId', gistId.trim());
    setSyncStatus({ success: true, message: language === 'vi' ? 'Đã lưu cấu hình GitHub Gist.' : 'Saved GitHub Gist settings.' });
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handlePushGist = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await gistSyncService.pushToGist(gistToken, gistId);
      setSyncStatus(res);
      if (res.success && res.gistId) {
        setGistId(res.gistId);
        await updateSetting('githubGistToken', gistToken.trim());
        await updateSetting('githubGistId', res.gistId);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handlePullGist = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await gistSyncService.pullFromGist(gistToken, gistId);
      setSyncStatus(res);
      if (res.success) {
        await reload();
        onDataChanged?.();
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleClearDatabase = async () => {
    setClearing(true);
    try {
      await Promise.all([
        db.quests.clear(),
        db.questInstances.clear(),
        db.completionRecords.clear(),
        db.dailyStats.clear(),
        db.settings.clear(),
      ]);
      await reload();
      setClearSuccess(true);
      setShowClearConfirm(false);
      onDataChanged?.();
      setTimeout(() => setClearSuccess(false), 4000);
    } catch (err) {
      console.error('[Settings] Failed to clear database:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">{t('settings.title')}</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {clearSuccess && (
        <div className="p-3 rounded-lg border text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
          <CheckCircle2 className="w-4 h-4" />
          <span>All local application data has been wiped clean. Database reset to initial state.</span>
        </div>
      )}

      {/* 1. Appearance & Language */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Sun className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-semibold">{t('settings.appearance')}</h3>
        </div>

        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('settings.theme')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(opt => {
                const isSelected = settings.theme === opt.value;
                const Icon = opt.value === 'light' ? Sun : opt.value === 'dark' ? Moon : Laptop;
                const label = opt.value === 'light' ? t('settings.themeLight') : opt.value === 'dark' ? t('settings.themeDark') : t('settings.themeSystem');

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleThemeChange(opt.value)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected ? 'ring-2 ring-[var(--color-accent)] font-bold' : 'hover:border-[var(--color-border-hover)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                      borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Switcher */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('settings.language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'vi', label: '🇻🇳 Tiếng Việt' },
                { val: 'en', label: '🇬🇧 English' },
              ].map(({ val, label }) => {
                const isSelected = language === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleLanguageChange(val as Language)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected ? 'ring-2 ring-[var(--color-accent)] font-bold' : 'hover:border-[var(--color-border-hover)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                      borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    }}
                  >
                    <Globe className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Behavior & Sound */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Sliders className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-semibold">{t('settings.behavior')}</h3>
        </div>

        <div className="space-y-3">
          {/* Sound Effects */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-[var(--color-accent)]" />
              <div>
                <div className="text-xs font-semibold">{t('settings.soundEffects')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('settings.soundEffectsSub')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playQuestCompleteSound(true)}
                className="px-2 py-1 text-[11px] rounded border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {t('settings.testSound')}
              </button>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={e => updateSetting('soundEffects', e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Hide Completed */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div>
              <div className="text-xs font-semibold">{t('settings.hideCompleted')}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {t('settings.hideCompletedSub')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hideCompleted}
              onChange={e => updateSetting('hideCompleted', e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-[var(--color-accent)]"
            />
          </div>

          {/* Completion Animations */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div>
              <div className="text-xs font-semibold">{t('settings.animations')}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {t('settings.animationsSub')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.completionAnimation}
              onChange={e => updateSetting('completionAnimation', e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-[var(--color-accent)]"
            />
          </div>

          {/* Daily Goal */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div>
              <div className="text-xs font-semibold">{t('settings.dailyGoal')}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {t('settings.dailyGoalSub')}
              </div>
            </div>

            <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => updateSetting('dailyGoal', Math.max(1, settings.dailyGoal - 1))}
                disabled={settings.dailyGoal <= 1}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-90 transition-all disabled:opacity-30 align-middle leading-none"
                aria-label="Decrease daily goal"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-9 text-center text-xs font-mono font-bold select-none text-[var(--color-text-primary)]">
                {settings.dailyGoal}
              </span>
              <button
                type="button"
                onClick={() => updateSetting('dailyGoal', Math.min(50, settings.dailyGoal + 1))}
                disabled={settings.dailyGoal >= 50}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-90 transition-all disabled:opacity-30 align-middle leading-none"
                aria-label="Increase daily goal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Quest Defaults */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />
          <h3 className="text-sm font-semibold">{t('settings.questDefaults')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Default Difficulty */}
          <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <label className="block text-xs font-semibold mb-1.5">{t('quest.difficulty')}</label>
            <FilterDropdown
              value={settings.defaultDifficulty}
              options={Object.entries(DIFFICULTY_LABELS).map(([k, label]) => ({
                value: k,
                label,
              }))}
              onChange={val => {
                const diff = val as Difficulty;
                updateSetting('defaultDifficulty', diff);
                updateSetting('defaultXP', XP_DEFAULTS[diff]);
              }}
              defaultValue="normal"
            />
          </div>

          {/* Default XP */}
          <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <label className="block text-xs font-semibold mb-1.5">{t('quest.xp')}</label>
            <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-0.5 shadow-2xs w-full justify-between">
              <button
                type="button"
                onClick={() => updateSetting('defaultXP', Math.max(5, settings.defaultXP - 5))}
                disabled={settings.defaultXP <= 5}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-90 transition-all disabled:opacity-30 align-middle leading-none"
                aria-label="Decrease default XP"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold select-none text-[var(--color-xp)]">
                +{settings.defaultXP} XP
              </span>
              <button
                type="button"
                onClick={() => updateSetting('defaultXP', Math.min(500, settings.defaultXP + 5))}
                disabled={settings.defaultXP >= 500}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:scale-90 transition-all disabled:opacity-30 align-middle leading-none"
                aria-label="Increase default XP"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Default Priority */}
          <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <label className="block text-xs font-semibold mb-1.5">{t('quest.priority')}</label>
            <FilterDropdown
              value={settings.defaultPriority}
              options={Object.entries(PRIORITY_LABELS).map(([k, label]) => ({
                value: k,
                label,
              }))}
              onChange={val => updateSetting('defaultPriority', val as Priority)}
              defaultValue="medium"
            />
          </div>
        </div>
      </section>

      {/* 4. Local-First Cloud Sync (GitHub Gist) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Cloud className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-semibold">{language === 'vi' ? 'Đồng Bộ Đám Mây Cá Nhân (GitHub Gist Sync)' : 'Personal Cloud Sync (GitHub Gist)'}</h3>
        </div>

        <div className="p-4 rounded-xl border space-y-3.5" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {language === 'vi'
              ? 'Lưu trữ bản sao lưu an toàn trên Secret Gist riêng của tài khoản GitHub của bạn. Hoàn toàn riêng tư, miễn phí và không phụ thuộc máy chủ bên thứ ba.'
              : 'Sync your data securely to a private Secret Gist on your GitHub account. 100% private, free, and serverless.'}
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                GitHub Personal Access Token (PAT with 'gist' scope)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={gistToken}
                  onChange={(e) => setGistToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border outline-none font-mono"
                  style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                />
                <KeyRound className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-text-tertiary)]" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Gist ID (Optional - leave empty to auto-create a new Secret Gist)
              </label>
              <input
                type="text"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
                placeholder="e.g. 7f8a9b1c2d3e4f5..."
                className="w-full px-3 py-1.5 text-xs rounded-md border outline-none font-mono"
                style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
              />
            </div>
          </div>

          {syncStatus && (
            <div
              className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                syncStatus.success
                  ? 'bg-[rgba(34,197,94,0.1)] text-[var(--color-success)] border border-[var(--color-success)]'
                  : 'bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[var(--color-danger)]'
              }`}
            >
              <span>{syncStatus.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveGistCredentials}
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 active:scale-[0.97] align-middle leading-none cursor-pointer"
            >
              <span>{language === 'vi' ? 'Lưu cấu hình' : 'Save Config'}</span>
            </button>

            <button
              type="button"
              disabled={syncing || !gistToken.trim()}
              onClick={handlePushGist}
              className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm disabled:opacity-50 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200 active:scale-[0.97] align-middle leading-none cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Upload className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
              <span>{syncing ? 'Pushing...' : language === 'vi' ? 'Đẩy dữ liệu lên Gist' : 'Push to Gist'}</span>
            </button>

            <button
              type="button"
              disabled={syncing || !gistToken.trim() || !gistId.trim()}
              onClick={handlePullGist}
              className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-xs disabled:opacity-50 transition-all duration-200 active:scale-[0.97] align-middle leading-none cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" />
              <span>{syncing ? 'Pulling...' : language === 'vi' ? 'Tải dữ liệu từ Gist' : 'Pull from Gist'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Storage Quota Diagnostics (P4) */}
      <section className="space-y-3">
        <StorageDiagnostics />
      </section>

      {/* 6. Data Management */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Database className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-semibold">{t('settings.dataBackup')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="group flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] active:scale-[0.99] cursor-pointer"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-accent-light)] text-[var(--color-accent)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-[var(--color-accent)] group-hover:text-white shadow-xs">
                <Download className="w-5 h-5 transition-transform duration-300" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-200">{t('settings.exportData')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {language === 'vi' ? 'Tải JSON backup, CSV Sheets hoặc Markdown Note' : 'Download JSON backup, CSV sheets or Markdown Note'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:text-[var(--color-accent)] group-hover:translate-x-1 shrink-0 ml-2" />
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="group flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-[var(--color-success)] hover:bg-[var(--color-bg-tertiary)] active:scale-[0.99] cursor-pointer"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(34,197,94,0.12)] text-[var(--color-success)] transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-[var(--color-success)] group-hover:text-white shadow-xs">
                <Upload className="w-5 h-5 transition-transform duration-300" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-success)] transition-colors duration-200">{t('settings.importData')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('settings.importDataSub')}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:text-[var(--color-success)] group-hover:translate-x-1 shrink-0 ml-2" />
          </button>
        </div>

        {/* Destructive Clear */}
        <div className="pt-2">
          <div
            className="flex items-center justify-between p-3.5 rounded-xl border transition-colors hover:border-red-400/40"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
                {t('settings.wipeDb')}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                {t('settings.wipeDbSub')}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white hover:shadow-md hover:shadow-red-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-12" />
              <span>{t('settings.clearData')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Privacy & About */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
          <h3 className="text-sm font-semibold">{t('settings.privacy')}</h3>
        </div>

        <div className="p-4 rounded-xl border text-xs space-y-2" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">DailyQuest Browser Extension</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              v1.0.0 (Manifest V3)
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            DailyQuest is 100% offline-first and local-first. All your quests, completion snapshots, and productivity scores are stored strictly inside your browser's IndexedDB engine. No external accounts, no background tracking, and no cloud dependencies.
          </p>
        </div>
      </section>

      {/* Clear Database Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearConfirm(false); }}
        >
          <div
            className="w-full max-w-sm rounded-xl shadow-2xl border p-5 mx-4 space-y-4"
            style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-danger)', color: 'var(--color-text-primary)' }}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-2.5" style={{ color: 'var(--color-danger)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h4 className="text-sm font-bold">Wipe All Local Data?</h4>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              This will permanently delete all your quest templates, completion records, daily stats, and streaks from IndexedDB. This action <strong>cannot be undone</strong> unless you have exported a JSON backup.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1.5 text-xs rounded-md border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                onClick={handleClearDatabase}
                disabled={clearing}
                className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors"
                style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}
              >
                {clearing ? 'Clearing...' : 'Confirm Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          reload();
          onDataChanged?.();
        }}
      />
    </div>
  );
};
