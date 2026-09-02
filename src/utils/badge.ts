/**
 * Update the extension icon badge with the count of pending quests.
 * Can be called safely from UI pages or service worker.
 */
export async function updateBadgeCount(count: number): Promise<void> {
  const text = count > 0 ? String(count) : '';
  try {
    if (typeof chrome !== 'undefined' && chrome.action) {
      await chrome.action.setBadgeText({ text });
      await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    }
  } catch (err) {
    // If chrome.action isn't directly available in current context, send runtime message
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count });
      }
    } catch {
      // Ignore background communication errors
    }
  }
}
