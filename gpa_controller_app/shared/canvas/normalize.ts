import { GPA_POINTS, percentToLetter } from '@/shared/calculators/grades';
import type { Course, LetterGrade } from '@/shared/types';
import type { CanvasCourse } from './api';

function isLetterGrade(value: string): value is LetterGrade {
  return value in GPA_POINTS;
}

/**
 * True when the course's term has started and hasn't ended (FR-41). Courses in
 * terms without dates (e.g. Canvas's "Default Term") are treated as not current.
 */
export function isInCurrentTerm(course: CanvasCourse, now: Date): boolean {
  const start = course.term?.start_at;
  const end = course.term?.end_at;
  if (!start) return false;
  return new Date(start) <= now && (!end || now <= new Date(end));
}

/**
 * Keeps current-term courses and converts them to Course. Uses the letter Canvas
 * reports when it's a BYU letter, otherwise derives it from the percentage.
 */
export function normalizeCanvasCourses(raw: CanvasCourse[], now: Date): Course[] {
  return raw
    .filter((course) => !course.access_restricted_by_date && isInCurrentTerm(course, now))
    .map((course) => {
      const enrollment = course.enrollments?.find((e) => e.type === 'student');
      const percent = enrollment?.computed_current_score ?? null;
      const grade = enrollment?.computed_current_grade?.trim() ?? null;
      const letter =
        grade && isLetterGrade(grade) ? grade : percent === null ? null : percentToLetter(percent);

      return {
        key: `canvas:${course.id}`,
        platform: 'canvas',
        name: course.name ?? course.course_code ?? `Course ${course.id}`,
        currentPercent: percent,
        currentLetter: letter,
      };
    });
}
