import { db } from '@/db/index';
import { generateId } from '@/utils/id';
import { getLocalDateKey, nowISO } from '@/utils/date';
import type { Quest, QuestInstance } from '@/types/quest';

/**
 * DailyQuest Service Worker (Manifest V3 Background Script)
 *
 * Responsibilities:
 * 1. Daily alarm for midnight badge refresh & daily check
 * 2. Extension install/update lifecycle
 * 3. Badge counter with live pending quest count
 * 4. Context Menu quick capture (right-click selection -> Add Quest)
 * 5. Omnibox shortcut (type `dq <quest title>` in address bar)
 */

const DAILY_ALARM_NAME = 'dailyquest-midnight';
const CONTEXT_MENU_ID = 'dailyquest-add-selection';

/**
 * Handle extension installation or update.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[DailyQuest] Extension installed');
    await setupDailyAlarm();
    setupContextMenu();
    await updateBadge();
  } else if (details.reason === 'update') {
    console.log(`[DailyQuest] Extension updated to v${chrome.runtime.getManifest().version}`);
    await setupDailyAlarm();
    setupContextMenu();
    await updateBadge();
  }
});

/**
 * Setup context menu item for quick capturing selected text.
 */
function setupContextMenu(): void {
  try {
    chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
      // Ignore error if menu item didn't exist
      if (chrome.runtime.lastError) {
        /* no-op */
      }
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: 'Add "%s" to DailyQuest',
        contexts: ['selection'],
      });
    });
  } catch (err) {
    console.error('[DailyQuest] Failed to create context menu:', err);
  }
}

/**
 * Handle context menu clicks.
 */
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText) {
    const title = info.selectionText.trim();
    if (!title) return;

    await createQuickQuest(title);
  }
});

/**
 * Omnibox: Suggestion while typing in Chrome address bar (dq <text>).
 */
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const trimmed = text.trim();
  if (!trimmed) {
    chrome.omnibox.setDefaultSuggestion({
      description: 'DailyQuest: Type a quest title and press Enter to capture',
    });
    return;
  }

  chrome.omnibox.setDefaultSuggestion({
    description: `DailyQuest: Create quest "<match>${trimmed}</match>" (+20 XP)`,
  });

  suggest([
    {
      content: `${trimmed} (Daily)`,
      description: `Create as recurring daily quest: "<match>${trimmed}</match>"`,
    },
  ]);
});

/**
 * Omnibox: Handle Enter key on address bar input.
 */
chrome.omnibox.onInputEntered.addListener(async (text) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const isDaily = trimmed.toLowerCase().endsWith('(daily)');
  const title = isDaily ? trimmed.replace(/\(daily\)$/i, '').trim() : trimmed;

  await createQuickQuest(title, isDaily ? 'daily' : 'once');
});

/**
 * Helper to quickly create a quest template and materialize today's instance.
 */
async function createQuickQuest(title: string, recurrenceType: 'once' | 'daily' = 'once'): Promise<void> {
  try {
    const now = nowISO();
    const today = getLocalDateKey();
    const questId = generateId();

    const quest: Quest = {
      id: questId,
      title,
      category: 'Other',
      difficulty: 'normal',
      xp: 20,
      recurrence: { type: recurrenceType },
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    await db.quests.add(quest);

    // Create instance for today
    const instance: QuestInstance = {
      id: generateId(),
      questId,
      date: today,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await db.questInstances.add(instance);
    await updateBadge();
  } catch (err) {
    console.error('[DailyQuest] Failed to create quick quest:', err);
  }
}

/**
 * Handle alarm events.
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === DAILY_ALARM_NAME) {
    console.log('[DailyQuest] Daily alarm fired');
    await updateBadge();
    // Re-schedule for next midnight (DST-safe)
    await setupDailyAlarm();
  }
});

/**
 * Set up a daily alarm that fires near midnight.
 * Uses a one-shot alarm that re-schedules itself on each fire
 * to avoid DST drift from fixed periodInMinutes.
 */
async function setupDailyAlarm(): Promise<void> {
  await chrome.alarms.clear(DAILY_ALARM_NAME);

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 1, 0); // 1 second after next midnight
  const delayInMinutes = (midnight.getTime() - now.getTime()) / (1000 * 60);

  chrome.alarms.create(DAILY_ALARM_NAME, {
    delayInMinutes: Math.max(1, delayInMinutes),
    // No periodInMinutes — re-scheduled in the alarm handler to avoid DST drift
  });
}

/**
 * Update the extension badge with pending quest count for today.
 */
async function updateBadge(): Promise<void> {
  try {
    const today = getLocalDateKey();
    const pendingCount = await db.questInstances
      .where('date')
      .equals(today)
      .and(inst => inst.status === 'pending')
      .count();

    const text = pendingCount > 0 ? String(pendingCount) : '';
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch (error) {
    console.error('[DailyQuest] Failed to update badge:', error);
  }
}

/**
 * Listen for messages from the popup/dashboard.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    const count = message.count as number;
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text })
      .then(() => chrome.action.setBadgeBackgroundColor({ color: '#6366f1' }))
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: String(error) }));
    return true; // Keep message channel open for async response
  }

  if (message.type === 'PING') {
    sendResponse({ pong: true, timestamp: Date.now() });
    return false;
  }
});
