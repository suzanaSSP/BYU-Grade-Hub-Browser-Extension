import { storage } from '#imports';
import type { Course, SyncStatus } from '@/shared/types';

export const canvasCourses = storage.defineItem<Course[]>('local:courses:canvas', {
  fallback: [],
});

export const canvasSyncStatus = storage.defineItem<SyncStatus>('local:sync:canvas', {
  fallback: { lastSyncedAt: null, error: null },
});
