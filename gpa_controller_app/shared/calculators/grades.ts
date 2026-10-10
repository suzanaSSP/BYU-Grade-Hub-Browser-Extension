import type { Course, CourseSettings, LetterGrade } from '@/shared/types';

export interface GradeCutoff {
  letter: LetterGrade;
  minPercent: number;
}

/**
 * Common BYU percentage cutoffs. Instructors can set their own scale; v1.1 reads
 * the course's scale when available (FR-18). Ordered from highest to lowest.
 */
export const BYU_DEFAULT_SCALE: readonly GradeCutoff[] = [
  { letter: 'A', minPercent: 93 },
  { letter: 'A-', minPercent: 90 },
  { letter: 'B+', minPercent: 87 },
  { letter: 'B', minPercent: 83 },
  { letter: 'B-', minPercent: 80 },
  { letter: 'C+', minPercent: 77 },
  { letter: 'C', minPercent: 73 },
  { letter: 'C-', minPercent: 70 },
  { letter: 'D+', minPercent: 67 },
  { letter: 'D', minPercent: 63 },
  { letter: 'D-', minPercent: 60 },
  { letter: 'E', minPercent: 0 },
];

export const GPA_POINTS: Record<LetterGrade, number> = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.4,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.4,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.4,
  D: 1.0,
  'D-': 0.7,
  E: 0.0,
};

/**
 * Converts a percentage to a letter grade. The percentage is not rounded, so
 * 92.99 is an A-. Above 100 (extra credit) is an A; below every cutoff is an E.
 */
export function percentToLetter(
  percent: number,
  scale: readonly GradeCutoff[] = BYU_DEFAULT_SCALE
): LetterGrade {
  const match = scale.find((cutoff) => percent >= cutoff.minPercent);
  return match ? match.letter : 'E';
}

/** Course-level projection, else the current letter, else null (no grade yet). */
export function resolveProjectedLetter(
  course: Course,
  settings: CourseSettings | undefined
): LetterGrade | null {
  return settings?.projectedLetter ?? course.currentLetter;
}
