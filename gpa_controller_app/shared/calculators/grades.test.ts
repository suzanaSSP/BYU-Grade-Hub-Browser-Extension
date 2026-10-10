import { describe, expect, it } from 'vitest';
import type { Course, CourseSettings } from '@/shared/types';
import { percentToLetter, resolveProjectedLetter, type GradeCutoff } from './grades';

describe('percentToLetter', () => {
  it.each([
    [100, 'A'],
    [93, 'A'],
    [90, 'A-'],
    [87, 'B+'],
    [83, 'B'],
    [80, 'B-'],
    [77, 'C+'],
    [73, 'C'],
    [70, 'C-'],
    [67, 'D+'],
    [63, 'D'],
    [60, 'D-'],
    [59.99, 'E'],
    [0, 'E'],
  ] as const)('%d%% is %s', (percent, letter) => {
    expect(percentToLetter(percent)).toBe(letter);
  });

  it('does not round up below a cutoff', () => {
    expect(percentToLetter(92.99)).toBe('A-');
    expect(percentToLetter(89.999)).toBe('B+');
  });

  it('treats extra credit above 100 as an A', () => {
    expect(percentToLetter(104.5)).toBe('A');
  });

  it('treats negative percentages as an E', () => {
    expect(percentToLetter(-5)).toBe('E');
  });

  it('uses a custom scale when given one', () => {
    const customScale: GradeCutoff[] = [
      { letter: 'A', minPercent: 95 },
      { letter: 'B', minPercent: 85 },
    ];
    expect(percentToLetter(94, customScale)).toBe('B');
    expect(percentToLetter(84, customScale)).toBe('E');
  });
});

describe('resolveProjectedLetter', () => {
  const course: Course = {
    key: 'canvas:1',
    platform: 'canvas',
    name: 'CS 142',
    currentPercent: 85,
    currentLetter: 'B',
  };
  const settings: CourseSettings = { creditHours: 3, projectedLetter: null, hidden: false };

  it('prefers the projection over the current letter', () => {
    expect(resolveProjectedLetter(course, { ...settings, projectedLetter: 'A-' })).toBe('A-');
  });

  it('falls back to the current letter', () => {
    expect(resolveProjectedLetter(course, settings)).toBe('B');
  });

  it('falls back to the current letter when there are no settings', () => {
    expect(resolveProjectedLetter(course, undefined)).toBe('B');
  });

  it('returns null when there is no grade and no projection', () => {
    const ungraded = { ...course, currentPercent: null, currentLetter: null };
    expect(resolveProjectedLetter(ungraded, settings)).toBeNull();
  });

  it('uses a projection on a course with no grade yet', () => {
    const ungraded = { ...course, currentPercent: null, currentLetter: null };
    expect(resolveProjectedLetter(ungraded, { ...settings, projectedLetter: 'C' })).toBe('C');
  });
});
