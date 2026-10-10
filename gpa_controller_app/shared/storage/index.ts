import { storage } from '#imports';
import type { Course, SyncStatus } from '@/shared/types';

export const canvasCourses = storage.defineItem<Course[]>('local:courses:canvas', {
  fallback: [],
});

export const canvasSyncStatus = storage.defineItem<SyncStatus>('local:sync:canvas', {
  fallback: { lastSyncedAt: null, error: null },
});

export const learningSuiteCourses = storage.defineItem<Course[]>('local:courses:learning-suite', {
  fallback: [],
});

export const learningSuiteSyncStatus = storage.defineItem<SyncStatus>('local:sync:learning-suite', {
  fallback: { lastSyncedAt: null, error: null },
});
