export const CANVAS_ORIGIN = 'https://byu.instructure.com';

const ACTIVE_COURSES_PATH =
  '/api/v1/courses?enrollment_state=active&enrollment_type=student' +
  '&include[]=total_scores&include[]=term&per_page=100';

/** The subset of Canvas's course object that v1.0 reads. */
export interface CanvasCourse {
  id: number;
  name?: string;
  course_code?: string;
  access_restricted_by_date?: boolean;
  term?: { name: string; start_at: string | null; end_at: string | null };
  enrollments?: {
    type: string;
    computed_current_score?: number | null;
    computed_current_grade?: string | null;
  }[];
}

/** Thrown on a 401: the user isn't logged in to Canvas (or the session isn't sent). */
export class CanvasAuthError extends Error {
  constructor() {
    super('Not logged in to Canvas');
  }
}

/** Canvas prefixes session-authenticated JSON with "while(1);" to block JSON hijacking. */
export function parseCanvasJson(text: string): unknown {
  return JSON.parse(text.replace(/^while\(1\);/, ''));
}

/** Returns the rel="next" URL from a Link header, or null on the last page. */
export function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Fetches every active student course, following pagination. */
export async function fetchActiveCourses(origin = CANVAS_ORIGIN): Promise<CanvasCourse[]> {
  const courses: CanvasCourse[] = [];
  let url: string | null = origin + ACTIVE_COURSES_PATH;

  while (url) {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 401) throw new CanvasAuthError();
    if (!response.ok) throw new Error(`Canvas returned ${response.status}`);

    courses.push(...(parseCanvasJson(await response.text()) as CanvasCourse[]));
    url = getNextPageUrl(response.headers.get('Link'));
  }

  return courses;
}
