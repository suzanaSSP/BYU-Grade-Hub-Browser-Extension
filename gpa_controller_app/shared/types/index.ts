// v1.0 types. v1.1 will add Assignment, AssignmentGroup, and Hypotheticals here.

export type LetterGrade =
  'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'E';

export type Platform = 'canvas' | 'learning-suite';

/** A course as synced from Canvas or Learning Suite. */
export interface Course {
  key: string; // e.g. "canvas:12345"
  platform: Platform;
  name: string;
  currentPercent: number | null;
  currentLetter: LetterGrade | null;
}

/** User input per course, keyed by Course.key so re-syncs don't wipe it. */
export interface CourseSettings {
  creditHours: number;
  projectedLetter: LetterGrade | null; // course-level What-If (FR-42)
  hidden: boolean;
}

/**
 * Grades from earlier semesters. Grade points (from the transcript) are exact;
 * a GPA is the fallback, but it's rounded, so grade points rebuilt from it are approximate.
 * `credits` are GPA hours: the credit hours already completed that count toward the GPA.
 */
export type PriorGpa =
  | { kind: 'grade-points'; gradePoints: number; credits: number }
  | { kind: 'gpa'; gpa: number; credits: number };

/** Everything the GPA engine needs to compute semester and cumulative GPA. */
export interface GpaInputs {
  courses: Course[];
  settings: Record<string, CourseSettings>;
  priorGpa: PriorGpa | null;
}

export type SyncError = 'logged-out' | 'failed';

/** Per-platform sync state. A failed sync keeps the last synced courses. */
export interface SyncStatus {
  lastSyncedAt: number | null;
  error: SyncError | null;
}
