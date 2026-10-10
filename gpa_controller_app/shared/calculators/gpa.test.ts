import { describe, expect, it } from 'vitest';
import type { Course, CourseSettings, LetterGrade } from '@/shared/types';
import { computeCumulativeGPA, computeSemesterGPA } from './gpa';

function course(key: string, currentLetter: LetterGrade | null): Course {
  return { key, platform: 'canvas', name: key, currentPercent: null, currentLetter };
}

function settings(creditHours: number, overrides: Partial<CourseSettings> = {}): CourseSettings {
  return { creditHours, projectedLetter: null, hidden: false, ...overrides };
}

describe('computeSemesterGPA', () => {
  it('matches a hand-calculated semester', () => {
    // CS 142    3 cr  A          4.0 × 3 = 12.0
    // MATH 112  4 cr  B+         3.4 × 4 = 13.6
    // REL 121   2 cr  A-         3.7 × 2 =  7.4
    // PHYS 121  3 cr  C+ → B     3.0 × 3 =  9.0
    // WRTG 150  3 cr  E          0.0 × 3 =  0.0
    //                     15 cr           42.0  → 2.8
    const courses = [
      course('cs', 'A'),
      course('math', 'B+'),
      course('rel', 'A-'),
      course('phys', 'C+'),
      course('wrtg', 'E'),
    ];
    const result = computeSemesterGPA(courses, {
      cs: settings(3),
      math: settings(4),
      rel: settings(2),
      phys: settings(3, { projectedLetter: 'B' }),
      wrtg: settings(3),
    });
    expect(result.gpa).toBeCloseTo(2.8, 10);
    expect(result.credits).toBe(15);
  });

  it('counts an E as 0 points with its credits', () => {
    const result = computeSemesterGPA([course('a', 'A'), course('e', 'E')], {
      a: settings(3),
      e: settings(3),
    });
    expect(result.gpa).toBeCloseTo(2.0, 10);
    expect(result.credits).toBe(6);
  });

  it('excludes hidden courses', () => {
    const result = computeSemesterGPA([course('a', 'A'), course('hidden', 'E')], {
      a: settings(3),
      hidden: settings(3, { hidden: true }),
    });
    expect(result.gpa).toBe(4.0);
    expect(result.credits).toBe(3);
  });

  it('excludes courses with no grade and no projection', () => {
    const result = computeSemesterGPA([course('a', 'B'), course('ungraded', null)], {
      a: settings(3),
      ungraded: settings(3),
    });
    expect(result.gpa).toBe(3.0);
    expect(result.credits).toBe(3);
  });

  it('includes an ungraded course once it has a projection', () => {
    const result = computeSemesterGPA([course('a', 'B'), course('ungraded', null)], {
      a: settings(3),
      ungraded: settings(3, { projectedLetter: 'A' }),
    });
    expect(result.gpa).toBeCloseTo(3.5, 10);
  });

  it('excludes courses with zero credits or no settings', () => {
    const result = computeSemesterGPA(
      [course('a', 'A'), course('zero', 'E'), course('unset', 'E')],
      { a: settings(3), zero: settings(0) }
    );
    expect(result.gpa).toBe(4.0);
    expect(result.credits).toBe(3);
  });

  it('returns a null GPA when nothing counts', () => {
    expect(computeSemesterGPA([], {})).toEqual({ gpa: null, credits: 0 });
  });
});

describe('computeCumulativeGPA', () => {
  it('blends semester and prior GPA by credits', () => {
    // (2.8 × 15 + 3.5 × 45) / 60 = 199.5 / 60 = 3.325
    expect(computeCumulativeGPA(2.8, 15, 3.5, 45)).toBeCloseTo(3.325, 10);
  });

  it('equals the semester GPA when no prior GPA is entered', () => {
    expect(computeCumulativeGPA(3.2, 15, null, 0)).toBe(3.2);
  });

  it('ignores a prior GPA with zero prior credits', () => {
    expect(computeCumulativeGPA(3.2, 15, 3.9, 0)).toBe(3.2);
  });

  it('equals the prior GPA when no semester course counts', () => {
    expect(computeCumulativeGPA(null, 0, 3.5, 45)).toBe(3.5);
  });

  it('returns null when there is nothing to average', () => {
    expect(computeCumulativeGPA(null, 0, null, 0)).toBeNull();
  });
});
