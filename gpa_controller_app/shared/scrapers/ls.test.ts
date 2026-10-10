// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import summaryHtml from './__fixtures__/ls-summary.html?raw';
import { parsePercent, scrapeGradeSummary } from './ls';

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('parsePercent', () => {
  it.each([
    ['89.71%', 89.71],
    ['  100%\n\t', 100],
    ['133.58%', 133.58],
    ['unpublished', null],
    ['', null],
    [null, null],
  ])('%j → %j', (text, expected) => {
    expect(parsePercent(text)).toBe(expected);
  });
});

describe('scrapeGradeSummary', () => {
  it('reads current progress for each Learning Suite course', () => {
    const result = scrapeGradeSummary(parse(summaryHtml));
    expect(result).toEqual({
      ok: true,
      courses: [
        {
          key: 'learning-suite:fakeCourse1',
          platform: 'learning-suite',
          name: 'HIST 201 (001) - Fake History',
          currentPercent: 100,
          currentLetter: 'A',
        },
        {
          key: 'learning-suite:fakeCourse2',
          platform: 'learning-suite',
          name: 'MATH 999 (001) - Fake Math',
          currentPercent: 91.5,
          currentLetter: 'A-',
        },
        {
          key: 'learning-suite:fakeCourse3',
          platform: 'learning-suite',
          name: 'STAT 999 (001) - Fake Statistics',
          currentPercent: 104.2,
          currentLetter: 'A',
        },
        {
          key: 'learning-suite:fakeCourse4',
          platform: 'learning-suite',
          name: 'DANCE 180 (010) - Fake Dance',
          currentPercent: 79.95,
          currentLetter: 'C+',
        },
      ],
    });
  });

  it('skips Canvas-hosted courses shown as "unpublished"', () => {
    const result = scrapeGradeSummary(parse(summaryHtml));
    const names = result.ok ? result.courses.map((c) => c.name) : [];
    expect(names).not.toContain('C S 101 (001) - Intro to Testing');
  });

  it('uses current progress, not total course progress', () => {
    const result = scrapeGradeSummary(parse(summaryHtml));
    // Fake Math: current 91.5%, total 18.3%
    expect(result.ok && result.courses[1]?.currentPercent).toBe(91.5);
  });

  it('has no grade when the current progress cell has no percentage', () => {
    const html = summaryHtml.replace(/(clicky">\s*)100%/, '$1—');
    const result = scrapeGradeSummary(parse(html));
    expect(result.ok && result.courses[0]).toMatchObject({
      currentPercent: null,
      currentLetter: null,
    });
  });

  it('fails when the grid is missing', () => {
    expect(scrapeGradeSummary(parse('<main><h1>Course Grade Summary</h1></main>'))).toEqual({
      ok: false,
    });
  });

  it('fails when the grid has no course rows', () => {
    const html =
      '<div class="mobileGridColsStyle"><div class="contents"><h2>Fall 2026</h2></div></div>';
    expect(scrapeGradeSummary(parse(html))).toEqual({ ok: false });
  });
});
