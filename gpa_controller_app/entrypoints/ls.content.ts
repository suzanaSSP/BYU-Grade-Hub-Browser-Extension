import { scrapeGradeSummary, type LsScrapeResult } from '@/shared/scrapers/ls';
import { LS_SCRAPED_MESSAGE } from '@/shared/scrapers/ls-sync';

const RENDER_TIMEOUT_MS = 10_000;

// Scrapes the Course Grade Summary each time the user opens it (FR-36).
export default defineContentScript({
  matches: ['*://learningsuite.byu.edu/*/student/top/summary*'],
  async main() {
    const result = await scrapeWhenRendered(RENDER_TIMEOUT_MS);
    console.info('[BYU Grade Hub] Learning Suite scrape:', result);
    await browser.runtime.sendMessage({ type: LS_SCRAPED_MESSAGE, result });
  },
});

/**
 * Learning Suite renders with Vue and can show the grid before its course rows,
 * so re-scrape on every DOM change until it succeeds or the timeout passes.
 */
function scrapeWhenRendered(timeoutMs: number): Promise<LsScrapeResult> {
  const first = scrapeGradeSummary(document);
  if (first.ok) return Promise.resolve(first);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const result = scrapeGradeSummary(document);
      if (result.ok) finish(result);
    });
    const timer = setTimeout(() => finish(scrapeGradeSummary(document)), timeoutMs);

    function finish(result: LsScrapeResult) {
      observer.disconnect();
      clearTimeout(timer);
      resolve(result);
    }

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}
