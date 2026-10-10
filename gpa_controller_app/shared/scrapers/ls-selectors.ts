// Every Learning Suite selector lives here, so a Learning Suite redesign only means
// updating this file. Page: Course Grade Summary (/student/top/summary).
// Avoid Vue's data-v-* attributes and Tailwind utility classes where possible; both
// change easily.

export const LS_SELECTORS = {
  /** The grade table: one header row, then one row per course. */
  grid: '.mobileGridColsStyle',
  /** A row of the grid: name cell, current progress cell, total course progress cell. */
  row: '.contents',
  /** Only the header row has a term heading (e.g. "Fall 2026"). */
  headerMarker: 'h2',
  /** Learning Suite courses link to their home page; Canvas-hosted ones show "unpublished" instead. */
  courseLink: 'a[href*="cid-"]',
  /** The big percentage inside a progress cell. */
  percent: '.font-bold',
} as const;

/** The course ID in a link like ".AbC1/cid-iEtKJG15an9U/student/home". */
export const COURSE_ID_PATTERN = /cid-([A-Za-z0-9_-]+)/;
