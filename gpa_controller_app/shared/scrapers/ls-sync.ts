import { learningSuiteCourses, learningSuiteSyncStatus } from '@/shared/storage';
import type { LsScrapeResult } from './ls';

export const LS_SCRAPED_MESSAGE = 'learning-suite:scraped';

/** Saves a scrape. A failed scrape keeps the old courses and flags them as possibly outdated. */
export async function saveLearningSuiteScrape(result: LsScrapeResult): Promise<void> {
  if (result.ok) {
    await learningSuiteCourses.setValue(result.courses);
    await learningSuiteSyncStatus.setValue({ lastSyncedAt: Date.now(), error: null });
  } else {
    const previous = await learningSuiteSyncStatus.getValue();
    await learningSuiteSyncStatus.setValue({ ...previous, error: 'page-changed' });
  }
}
