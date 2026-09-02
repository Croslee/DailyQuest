import { exportService } from './exportService';
import { importService } from './importService';
import { getLocalDateKey, daysAgo } from '@/utils/date';

export interface GistSyncResult {
  success: boolean;
  message: string;
  gistId?: string;
  updatedAt?: string;
}

const GIST_FILENAME = 'dailyquest-backup.json';

export const gistSyncService = {
  /**
   * Push full local backup to GitHub Gist.
   * If gistId is empty, creates a new secret Gist.
   */
  async pushToGist(token: string, gistId?: string): Promise<GistSyncResult> {
    if (!token.trim()) {
      return { success: false, message: 'GitHub Personal Access Token is required.' };
    }

    try {
      // Export wide range (from beginning to today)
      const from = daysAgo(365 * 2);
      const to = getLocalDateKey();
      const { data: backupData } = await exportService.generateJSON(from, to);
      const content = JSON.stringify(backupData, null, 2);

      if (gistId && gistId.trim()) {
        // Update existing Gist
        const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: 'DailyQuest Automated Backup (Local-first Sync)',
            files: {
              [GIST_FILENAME]: { content },
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.message || `GitHub error: ${res.statusText}` };
        }

        const data = await res.json();
        return {
          success: true,
          message: 'Successfully pushed backup to GitHub Gist!',
          gistId: data.id,
          updatedAt: data.updated_at,
        };
      } else {
        // Create new secret Gist
        const res = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: 'DailyQuest Automated Backup (Local-first Sync)',
            public: false,
            files: {
              [GIST_FILENAME]: { content },
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, message: err.message || `GitHub error: ${res.statusText}` };
        }

        const data = await res.json();
        return {
          success: true,
          message: 'Created new Secret Gist and uploaded backup!',
          gistId: data.id,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Network error' };
    }
  },

  /**
   * Pull and restore backup from GitHub Gist.
   */
  async pullFromGist(token: string, gistId: string): Promise<GistSyncResult> {
    if (!token.trim() || !gistId.trim()) {
      return { success: false, message: 'Both GitHub Token and Gist ID are required to pull.' };
    }

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.message || `GitHub error: ${res.statusText}` };
      }

      const data = await res.json();
      const file = data.files?.[GIST_FILENAME];
      if (!file || !file.content) {
        return { success: false, message: `Could not find ${GIST_FILENAME} in this Gist.` };
      }

      const parsed = importService.validateJSON(file.content);
      if (!parsed.valid || !parsed.data) {
        return { success: false, message: `Invalid backup JSON in Gist: ${parsed.errors.join(', ')}` };
      }

      const importResult = await importService.importData(parsed.data);

      return {
        success: true,
        message: `Restored: ${importResult.inserted.quests} quests, ${importResult.inserted.completionRecords} completions.`,
        gistId: data.id,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Restore error' };
    }
  },
};
