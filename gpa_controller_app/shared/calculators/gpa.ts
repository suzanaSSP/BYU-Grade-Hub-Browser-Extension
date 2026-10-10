import type { Course, CourseSettings } from '@/shared/types';
import { GPA_POINTS, resolveProjectedLetter } from './grades';

export interface SemesterGpa {
  gpa: number | null; // null when no course counts toward the GPA
  credits: number; // credit hours that counted
}

/**
 * GPA over the courses that count: not hidden, more than 0 credit hours, and a
 * resolved letter. A course without settings has 0 credits, so it doesn't count.
 * The result is unrounded; round it for display.
 */
export function computeSemesterGPA(
  courses: Course[],
  settings: Record<string, CourseSettings>
): SemesterGpa {
  let points = 0;
  let credits = 0;

  for (const course of courses) {
    const courseSettings = settings[course.key];
    if (!courseSettings || courseSettings.hidden || courseSettings.creditHours <= 0) continue;

    const letter = resolveProjectedLetter(course, courseSettings);
    if (letter === null) continue;

    points += GPA_POINTS[letter] * courseSettings.creditHours;
    credits += courseSettings.creditHours;
  }

  return { gpa: credits > 0 ? points / credits : null, credits };
}

/**
 * Blends the semester GPA with the prior cumulative GPA, weighted by credits.
 * Falls back to whichever side has credits, or null if neither does.
 */
export function computeCumulativeGPA(
  semesterGPA: number | null,
  semesterCredits: number,
  priorGPA: number | null,
  priorCredits: number
): number | null {
  const semesterWeight = semesterGPA === null ? 0 : semesterCredits;
  const priorWeight = priorGPA === null ? 0 : priorCredits;
  const totalCredits = semesterWeight + priorWeight;
  if (totalCredits <= 0) return null;

  return ((semesterGPA ?? 0) * semesterWeight + (priorGPA ?? 0) * priorWeight) / totalCredits;
}
