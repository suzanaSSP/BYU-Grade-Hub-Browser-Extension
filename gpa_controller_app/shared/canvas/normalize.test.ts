import { describe, expect, it } from 'vitest';
import type { CanvasCourse } from './api';
import { isInCurrentTerm, normalizeCanvasCourses } from './normalize';

const now = new Date('2026-10-09T12:00:00Z');
const fall = {
  name: 'Fall 2026',
  start_at: '2026-08-31T06:00:00Z',
  end_at: '2026-12-20T06:00:00Z',
};

function canvasCourse(overrides: Partial<CanvasCourse> = {}): CanvasCourse {
  return {
    id: 1,
    name: 'CS 142',
    term: fall,
    enrollments: [{ type: 'student', computed_current_score: 91.5, computed_current_grade: 'A-' }],
    ...overrides,
  };
}

describe('isInCurrentTerm', () => {
  it('includes a term that contains today', () => {
    expect(isInCurrentTerm(canvasCourse(), now)).toBe(true);
  });

  it('excludes past and future terms', () => {
    const past = {
      name: 'Winter 2026',
      start_at: '2026-01-05T07:00:00Z',
      end_at: '2026-04-20T06:00:00Z',
    };
    const future = {
      name: 'Winter 2027',
      start_at: '2027-01-04T07:00:00Z',
      end_at: '2027-04-20T06:00:00Z',
    };
    expect(isInCurrentTerm(canvasCourse({ term: past }), now)).toBe(false);
    expect(isInCurrentTerm(canvasCourse({ term: future }), now)).toBe(false);
  });

  it('excludes terms without a start date', () => {
    const defaultTerm = { name: 'Default Term', start_at: null, end_at: null };
    expect(isInCurrentTerm(canvasCourse({ term: defaultTerm }), now)).toBe(false);
  });

  it('includes a started term with no end date', () => {
    expect(isInCurrentTerm(canvasCourse({ term: { ...fall, end_at: null } }), now)).toBe(true);
  });
});

describe('normalizeCanvasCourses', () => {
  it('converts a Canvas course to a Course', () => {
    expect(normalizeCanvasCourses([canvasCourse()], now)).toEqual([
      {
        key: 'canvas:1',
        platform: 'canvas',
        name: 'CS 142',
        currentPercent: 91.5,
        currentLetter: 'A-',
      },
    ]);
  });

  it("uses Canvas's letter even when the default scale disagrees", () => {
    const course = canvasCourse({
      enrollments: [{ type: 'student', computed_current_score: 92.5, computed_current_grade: 'A' }],
    });
    expect(normalizeCanvasCourses([course], now)[0]?.currentLetter).toBe('A');
  });

  it('derives the letter from the percentage when Canvas has no letter', () => {
    const course = canvasCourse({
      enrollments: [{ type: 'student', computed_current_score: 84, computed_current_grade: null }],
    });
    expect(normalizeCanvasCourses([course], now)[0]?.currentLetter).toBe('B');
  });

  it("derives the letter when Canvas's letter isn't a BYU letter", () => {
    const course = canvasCourse({
      enrollments: [
        { type: 'student', computed_current_score: 95, computed_current_grade: 'Pass' },
      ],
    });
    expect(normalizeCanvasCourses([course], now)[0]?.currentLetter).toBe('A');
  });

  it('has no grade when Canvas has no score', () => {
    const course = canvasCourse({
      enrollments: [{ type: 'student', computed_current_score: null }],
    });
    const [result] = normalizeCanvasCourses([course], now);
    expect(result?.currentPercent).toBeNull();
    expect(result?.currentLetter).toBeNull();
  });

  it('drops date-restricted and non-current courses', () => {
    const restricted = canvasCourse({ id: 2, access_restricted_by_date: true });
    const old = canvasCourse({
      id: 3,
      term: { name: 'Old', start_at: '2020-01-01', end_at: '2020-05-01' },
    });
    expect(normalizeCanvasCourses([canvasCourse(), restricted, old], now)).toHaveLength(1);
  });
});
