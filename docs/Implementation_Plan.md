# Implementation Plan — BYU Grade Hub Browser Extension

> **Version**: 1.1 — Draft  
> **Date**: October 2026  
> **Author**: Suzana Pinheiro  
> **Estimated Duration**: v1.0 ≈ 4 weeks · v1.1 ≈ 3–4 weeks

The plan is split into two releases (see `Requirements.md`):

- **v1.0 — Course-level GPA planner** (Phases 1–6): current grade per course + a projected-grade dropdown → semester and cumulative GPA.
- **v1.1 — Assignment-level What-If** (Phases 7–8): an assignment tab per course with hypothetical score inputs that feed the projected course grade.

---

# v1.0 — Course-Level GPA Planner

## Phase 1 — Foundation & Setup

**Duration**: 1 week  
**Goal**: Establish the project scaffold, tooling, and developer environment.

### Tasks

- [✅] Initialize the repository on GitHub with a clear folder structure
- [✅] Scaffold the extension using **WXT + React + TypeScript**
- [✅] Configure **Tailwind CSS v4** with a custom design system (color tokens, typography, spacing)
- [✅] Set up **ESLint + Prettier** (run on save via editor integration)
- [✅] Configure **Vitest** for calculator unit tests
- [✅] Configure the manifest (via `wxt.config.ts`) with minimum required permissions:
  - `storage`
  - Host permissions: `*://*.instructure.com/*`, `*://learningsuite.byu.edu/*`
- [✅] Define the v1.0 **TypeScript interfaces** (`Course`, `LetterGrade`, `CourseSettings`, `GpaInputs`) — leave room for v1.1 types (`Assignment`, `AssignmentGroup`, `Hypotheticals`) without defining them yet
- [✅] Stub out entry points: popup, Canvas content script, LS content script, background

### Deliverable
A working "Hello World" extension that loads in Chrome with a blank popup.

### Success Criteria
- Extension loads without errors in Chrome
- TypeScript compiles with zero errors

---

## Phase 2 — GPA Engine

**Duration**: 3–4 days  
**Goal**: Pure, tested functions for all v1.0 math. Done first so the UI and data phases build on known-correct logic.

### Tasks

- [✅] Implement pure TypeScript functions in `shared/calculators/`:
  - `percentToLetter(percent, scale = BYU_DEFAULT_SCALE)` → letter grade
  - `resolveProjectedLetter(course, settings)` → course-level projection, else current letter, else `null` (v1.1 adds the assignment-level step in the middle)
  - `computeSemesterGPA(courses, settings)` → GPA over visible courses that have a resolved letter
  - `computeCumulativeGPA(semesterGPA, semesterCredits, priorGPA, priorCredits)` → blended GPA
- [✅] Unit tests: rounding, courses with no grade (excluded), hidden courses (excluded), zero credits, no prior GPA entered, E grades

### Success Criteria
- All calculator tests pass
- GPA results match a hand-calculated example with 4–5 real courses

---

## Phase 3 — Canvas Current Grades

**Duration**: 1 week  
**Goal**: Pull current-semester Canvas courses and their current grade.

### Tasks

- [ ] **Auth spike first (1 day)**: confirm how API calls authenticate with the user's session. Same-origin `fetch('/api/v1/...')` from the Canvas content script is the known-working baseline; test whether calls from the popup/background with host permissions also carry the session. Record the result in `Technical_Plan.md`.
- [ ] Fetch courses + scores in one call: `GET /api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=term`
- [ ] Filter to the current term (FR-41) and normalize into `Course` (`id`, `name`, `platform: 'canvas'`, `currentPercent`, `currentLetter`)
- [ ] Store in `chrome.storage.local` with a `lastSyncedAt` timestamp
- [ ] Refresh when the popup opens if data is stale, plus a **"Sync Canvas Now"** button
- [ ] Handle logged-out / 401: show "Visit Canvas to reconnect"

### Success Criteria
- All current Canvas courses appear with the same grade Canvas shows
- Data persists after closing and reopening the popup

---

## Phase 4 — Learning Suite Current Grades

**Duration**: 1 week  
**Goal**: Scrape the LS course list and current grade per course.

### Tasks

- [ ] Build the `ls.ts` content script on `learningsuite.byu.edu`
- [ ] Scrape the course list and the current/final grade for each course (gradebook page only)
- [ ] Put all CSS selectors in `scrapers/ls-selectors.ts`
- [ ] Normalize into `Course` (`platform: 'learning-suite'`) and send to the background to store, with an LS `lastSyncedAt`
- [ ] If expected elements are missing, keep the old data and show "Learning Suite data may be outdated"

### Success Criteria
- LS courses appear alongside Canvas courses with correct current grades
- The extension never breaks or slows down LS pages

---

## Phase 5 — GPA Planner UI (Popup)

**Duration**: 1 week  
**Goal**: The main and only v1.0 screen.

### Tasks

- [ ] **GPA header**: semester GPA and cumulative GPA, with a "projected" label when any projection is set
- [ ] **Course rows**: name, platform badge, current grade (letter + %), credit hours input, projected grade dropdown (`—`, A … E)
- [ ] Projected values styled distinctly (color + pencil icon)
- [ ] **Reset projections** button
- [ ] **Hide course** action, plus a "Show hidden courses" toggle
- [ ] **Prior GPA** inputs (previous cumulative GPA + credits earned), in a collapsible section
- [ ] Footer: per-platform last sync time, "Sync Canvas Now", "Open Learning Suite"
- [ ] Persist credit hours, projections, hidden courses, and prior GPA in `chrome.storage.local`, keyed by course ID so re-syncs don't wipe them

### Success Criteria
- Changing a projection or credit hours updates the GPA instantly
- Settings survive popup close, browser restart, and re-sync

---

## Phase 6 — v1.0 QA

**Duration**: 2–3 days

- [ ] Test on a real BYU account with both Canvas and LS courses
- [ ] Verify the GPA against a hand calculation
- [ ] Test offline: popup shows cached data
- [ ] Test logged-out states for both platforms

### Deliverable
v1.0 installed and used for real.

---

# v1.1 — Assignment-Level What-If

## Phase 7 — Assignment Data

**Duration**: 1.5–2 weeks  
**Goal**: Fetch assignment-level data for each course.

### Tasks

- [ ] Add v1.1 types: `Assignment`, `AssignmentGroup`, `Hypotheticals` (extend storage; existing v1.0 keys stay unchanged)
- [ ] Canvas: `GET /api/v1/courses/:id/assignment_groups?include[]=assignments&include[]=submission` — categories, weights, assignments, and scores in one call per course
- [ ] Canvas: read the course grading standard (grade scale) when present
- [ ] LS: extend the scraper to the full gradebook (categories, weights, assignments, scores) and the grade scale
- [ ] Fetch assignment data **lazily** when a course's tab is opened, cached afterward

### Success Criteria
- Assignment lists and weights match what Canvas/LS show

---

## Phase 8 — Assignment What-If UI & Engine

**Duration**: 1.5–2 weeks

### Tasks

- [ ] Engine: `computeWeightedGrade(groups, assignments, hypotheticals)` handling weighted vs. unweighted courses, dropped assignments, extra credit, and ungraded assignments
- [ ] Validate the engine against the actual grade Canvas/LS shows (with no hypotheticals, the result should match the current grade)
- [ ] Extend `resolveProjectedLetter`: course-level projection → assignment-level projection → current grade (FR-48)
- [ ] Assignment tab: clicking a course row opens it; assignments grouped by category with weights
- [ ] Editable score field on every assignment; hypothetical values styled like v1.0 projections
- [ ] Projected course grade shown at the top of the tab; GPA planner updates live
- [ ] "Reset this course" button
- [ ] If a course-level projection is set, show a notice in the tab with a "Clear course override" action
- [ ] Unit tests for all weighted-grade edge cases

### Success Criteria
- With no hypotheticals, the computed grade matches the platform's grade for every course
- Entering a hypothetical score updates the course grade and GPA instantly

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Canvas session can't be used outside a Canvas tab | Medium | Medium | Auth spike at the start of Phase 3; fall back to syncing from the Canvas content script when the user visits Canvas (same model as LS) |
| BYU Learning Suite changes its DOM structure | Medium | High | Selectors isolated in one module; v1.0 only scrapes a small amount of data |
| Weighted-grade math doesn't match the platform (v1.1) | Medium | Medium | Validate against the platform's own current grade before trusting projections |
| BYU changes authentication/SSO flow | Low | High | Prompt the user to re-login |
| Scope creep | High | Medium | Ship v1.0 before starting v1.1; everything else stays in "Later" in `Requirements.md` |

---

## Definition of Done

A feature is "done" when:
1. It is implemented and working on real BYU data
2. Calculator functions have Vitest unit tests covering edge cases
3. It has been manually verified by loading the extension in Chrome
4. TypeScript compiles with zero errors and ESLint reports no warnings
