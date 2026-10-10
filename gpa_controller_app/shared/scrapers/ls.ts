import { percentToLetter } from '@/shared/calculators/grades';
import type { Course } from '@/shared/types';
import { COURSE_ID_PATTERN, LS_SELECTORS } from './ls-selectors';

export type LsScrapeResult = { ok: true; courses: Course[] } | { ok: false };

/** "89.71%" → 89.71. Anything else (e.g. "unpublished") → null. */
export function parsePercent(text: string | null | undefined): number | null {
  const match = text?.trim().match(/^(-?\d+(?:\.\d+)?)%$/);
  return match?.[1] ? Number(match[1]) : null;
}

/**
 * Reads each course's current progress from the Course Grade Summary page.
 * Canvas-hosted courses (shown as "unpublished", no link) are skipped. Fails if
 * the grid or its course rows are missing, which means the page has changed.
 */
export function scrapeGradeSummary(root: ParentNode): LsScrapeResult {
  const grid = root.querySelector(LS_SELECTORS.grid);
  if (!grid) return { ok: false };

  const rows = Array.from(grid.children).filter(
    (row) => row.matches(LS_SELECTORS.row) && !row.querySelector(LS_SELECTORS.headerMarker)
  );
  if (rows.length === 0) return { ok: false };

  const courses: Course[] = [];
  for (const row of rows) {
    const [nameCell, currentCell] = Array.from(row.children);
    const link = nameCell?.querySelector(LS_SELECTORS.courseLink);
    const id = link?.getAttribute('href')?.match(COURSE_ID_PATTERN)?.[1];
    if (!link || !id) continue;

    const percent = parsePercent(currentCell?.querySelector(LS_SELECTORS.percent)?.textContent);
    courses.push({
      key: `learning-suite:${id}`,
      platform: 'learning-suite',
      name: (link.textContent ?? '').trim().replace(/\s+/g, ' '),
      currentPercent: percent,
      currentLetter: percent === null ? null : percentToLetter(percent),
    });
  }

  return { ok: true, courses };
}
