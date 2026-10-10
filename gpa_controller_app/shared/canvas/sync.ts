import { canvasCourses, canvasSyncStatus } from '@/shared/storage';
import type { SyncStatus } from '@/shared/types';
import { CANVAS_ORIGIN, CanvasAuthError, fetchActiveCourses } from './api';
import { normalizeCanvasCourses } from './normalize';

export const SYNC_CANVAS_MESSAGE = 'canvas:sync';
export const STALE_AFTER_MS = 5 * 60 * 1000;

/** Data is stale if it's never synced, the last sync failed, or it's over 5 minutes old. */
export function isStale(status: SyncStatus, now = Date.now()): boolean {
  return (
    status.lastSyncedAt === null ||
    status.error !== null ||
    now - status.lastSyncedAt > STALE_AFTER_MS
  );
}

/** Fetches Canvas courses and saves them. On failure, keeps the last synced courses. */
export async function syncCanvas(origin = CANVAS_ORIGIN): Promise<SyncStatus> {
  let status: SyncStatus;
  try {
    const raw = await fetchActiveCourses(origin);
    const now = Date.now();
    await canvasCourses.setValue(normalizeCanvasCourses(raw, new Date(now)));
    status = { lastSyncedAt: now, error: null };
  } catch (error) {
    console.warn('Canvas sync failed:', error);
    const previous = await canvasSyncStatus.getValue();
    status = { ...previous, error: error instanceof CanvasAuthError ? 'logged-out' : 'failed' };
  }
  await canvasSyncStatus.setValue(status);
  return status;
}
