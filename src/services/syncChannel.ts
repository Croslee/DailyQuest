/**
 * Real-time synchronization channel between Extension Popup and Dashboard tabs.
 * Uses BroadcastChannel with fallback to chrome.runtime.sendMessage.
 */

const CHANNEL_NAME = 'dailyquest_sync';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

const localListeners = new Set<(message: SyncMessage) => void>();

export interface SyncMessage {
  type: 'DATA_CHANGED';
  source?: string;
  timestamp: number;
}

/**
 * Notify all open extension tabs, popups, and local components that data has changed.
 */
export const notifyDataChanged = (source?: string): void => {
  const message: SyncMessage = {
    type: 'DATA_CHANGED',
    source,
    timestamp: Date.now(),
  };

  // 1. Notify listeners in the same window/tab
  localListeners.forEach(cb => {
    try {
      cb(message);
    } catch (err) {
      console.error('[syncChannel] Local listener error:', err);
    }
  });

  // 2. Broadcast across separate tabs/windows
  try {
    broadcastChannel?.postMessage(message);
  } catch {}

  // 3. Notify extension runtime (e.g. background service worker or popup)
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(message).catch(() => {
        // Ignored: Receiver might not be active
      });
    }
  } catch {}
};

/**
 * Listen for data change notifications from the current window, other tabs, or popups.
 * Returns an unsubscribe function.
 */
export const onDataChanged = (callback: (message: SyncMessage) => void): (() => void) => {
  localListeners.add(callback);

  const handleBroadcast = (event: MessageEvent<SyncMessage>) => {
    if (event.data?.type === 'DATA_CHANGED') {
      callback(event.data);
    }
  };

  broadcastChannel?.addEventListener('message', handleBroadcast);

  const handleChromeMessage = (message: any) => {
    if (message?.type === 'DATA_CHANGED') {
      callback(message);
    }
  };

  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener(handleChromeMessage);
  }

  return () => {
    localListeners.delete(callback);
    broadcastChannel?.removeEventListener('message', handleBroadcast);
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.removeListener(handleChromeMessage);
    }
  };
};
