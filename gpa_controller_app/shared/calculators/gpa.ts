import type { Course, CourseSettings, PriorGpa } from '@/shared/types';
import { GPA_POINTS, resolveProjectedLetter } from './grades';

export interface SemesterGpa {
  gpa: number | null; // null when no course counts toward the GPA
  gradePoints: number; // sum of letter points × credit hours
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
  let gradePoints = 0;
  let credits = 0;

  for (const course of courses) {
    const courseSettings = settings[course.key];
    if (!courseSettings || courseSettings.hidden || courseSettings.creditHours <= 0) continue;

    const letter = resolveProjectedLetter(course, courseSettings);
    if (letter === null) continue;

    gradePoints += GPA_POINTS[letter] * courseSettings.creditHours;
    credits += courseSettings.creditHours;
  }

  return { gpa: credits > 0 ? gradePoints / credits : null, gradePoints, credits };
}

/** Grade points earned before this semester, rebuilt from the GPA when that's all we have. */
export function priorGradePoints(prior: PriorGpa): number {
  return prior.kind === 'grade-points' ? prior.gradePoints : prior.gpa * prior.credits;
}

/**
 * Cumulative GPA = (prior grade points + semester grade points) ÷ (prior credits +
 * semester credits). Returns null when there are no credits on either side.
 */
export function computeCumulativeGPA(semester: SemesterGpa, prior: PriorGpa | null): number | null {
  const priorCredits = prior && prior.credits > 0 ? prior.credits : 0;
  const priorPoints = prior && priorCredits > 0 ? priorGradePoints(prior) : 0;
  const totalCredits = semester.credits + priorCredits;
  if (totalCredits <= 0) return null;

  return (semester.gradePoints + priorPoints) / totalCredits;
}
