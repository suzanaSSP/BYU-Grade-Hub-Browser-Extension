// Receives scraped Learning Suite data and writes it to chrome.storage (Phase 4).
export default defineBackground(() => {
  console.log('BYU Grade Hub background started.', { id: browser.runtime.id });
});
