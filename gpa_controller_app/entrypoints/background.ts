import { SYNC_CANVAS_MESSAGE, syncCanvas } from '@/shared/canvas/sync';
import { LS_SCRAPED_MESSAGE, saveLearningSuiteScrape } from '@/shared/scrapers/ls-sync';

// Runs Canvas syncs for the popup, so a sync finishes even if the popup closes,
// and stores what the Learning Suite content script scrapes.
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === SYNC_CANVAS_MESSAGE) {
      syncCanvas().then(sendResponse);
      return true; // keeps the channel open for the async response
    }
    if (message?.type === LS_SCRAPED_MESSAGE) {
      saveLearningSuiteScrape(message.result).then(() => sendResponse());
      return true;
    }
  });
});
