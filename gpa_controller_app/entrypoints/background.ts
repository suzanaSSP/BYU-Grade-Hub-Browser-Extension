import { SYNC_CANVAS_MESSAGE, syncCanvas } from '@/shared/canvas/sync';

// Runs Canvas syncs for the popup, so a sync finishes even if the popup closes.
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== SYNC_CANVAS_MESSAGE) return;
    syncCanvas().then(sendResponse);
    return true; // keeps the channel open for the async response
  });
});
