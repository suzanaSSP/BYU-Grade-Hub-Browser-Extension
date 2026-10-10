import { describe, expect, it } from 'vitest';
import { getNextPageUrl, parseCanvasJson } from './api';

describe('parseCanvasJson', () => {
  it('strips the while(1); prefix', () => {
    expect(parseCanvasJson('while(1);[{"id":1}]')).toEqual([{ id: 1 }]);
  });

  it('parses plain JSON', () => {
    expect(parseCanvasJson('[{"id":1}]')).toEqual([{ id: 1 }]);
  });
});

describe('getNextPageUrl', () => {
  it('finds the next page', () => {
    const header =
      '<https://byu.instructure.com/api/v1/courses?page=1>; rel="current",' +
      '<https://byu.instructure.com/api/v1/courses?page=2>; rel="next",' +
      '<https://byu.instructure.com/api/v1/courses?page=3>; rel="last"';
    expect(getNextPageUrl(header)).toBe('https://byu.instructure.com/api/v1/courses?page=2');
  });

  it('returns null on the last page', () => {
    const header = '<https://byu.instructure.com/api/v1/courses?page=3>; rel="current"';
    expect(getNextPageUrl(header)).toBeNull();
  });

  it('returns null without a Link header', () => {
    expect(getNextPageUrl(null)).toBeNull();
  });
});
