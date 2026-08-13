# Implementation Plan — BYU Grade Hub Browser Extension

> **Version**: 1.0 — Draft  
> **Date**: July 2026  
> **Author**: Suzana Pinheiro  
> **Total Estimated Duration**: 6-8 weeks (according to Claude)

---

## Phase 1 — Foundation & Setup

**Duration**: 1 week  
**Goal**: Establish the project scaffold, tooling, and developer environment.

### Tasks

- [✅ ] Initialize the repository on GitHub with a clear folder structure
- [✅] Scaffold the extension using **WXT + React + TypeScript**
- [ ] Configure **Tailwind CSS v4** with a custom design system (color tokens, typography, spacing)
- [ ] Set up **ESLint + Prettier** (run on save via editor integration)
- [ ] Configure **Vitest** for calculator unit tests
- [ ] Create the `manifest.json` with minimum required permissions:
  - `storage`, `alarms`, `notifications`, `tabs`
  - Host permissions: `*://*.instructure.com/*`, `*://learningsuite.byu.edu/*`
- [ ] Define all shared **TypeScript interfaces** (`Course`, `Assignment`, `AssignmentGroup`, `Grade`, `Scenario`)
- [ ] Stub out all entry points: popup, dashboard, options, canvas content script, LS content script

### Deliverable
A working "Hello World" extension that loads in Chrome with a blank popup and dashboard tab.

### Success Criteria
- Extension loads without errors in Chrome
- TypeScript compiles with zero errors

---

## Phase 2 — Canvas Integration

**Duration**: 2 weeks  
**Goal**: Fetch and display real course and assignment data from Canvas.

### Week 1 — API Integration

- [ ] Build the `canvas.ts` content script that detects when the user is on `*.instructure.com`
- [ ] Implement authenticated API calls using the user's session to extract and store the auth token:
  - `GET /api/v1/courses` — enrolled courses
  - `GET /api/v1/courses/:id/assignment_groups` — categories + weights
  - `GET /api/v1/courses/:id/assignments` — all assignments with due dates and scores
  - `GET /api/v1/users/self/enrollments` — current grades across courses
- [ ] Store the fetched data in `chrome.storage.local`
- [ ] Set up the background service worker to receive messages from the content script
- [ ] Set up `chrome.alarms` for the daily background Canvas refresh
- [ ] Write Vitest unit tests for the token extraction and storage logic

### Week 2 — Popup Course Display

- [ ] Build the **Course List** component in the popup (React):
  - Shows all Canvas courses with current grade and letter grade
  - Platform badge labeled "Canvas"
  - Click to expand and see assignment groups
- [ ] Build the **Assignment Group** component:
  - Shows category name, weight percentage, and assignments within
  - Each assignment row: title, due date, score/max score, % of grade
  - Visual state for: submitted, unsubmitted, dropped
- [ ] Implement a **manual "Sync Canvas Now" button** with last-sync timestamp

### Deliverable
Extension popup shows all Canvas courses, assignment categories, weights, and individual assignment grades.

### Success Criteria
- All Canvas assignments visible in popup with correct scores and weights
- Data persists after closing and reopening the popup
- Manual sync refreshes data correctly

---

## Phase 3 — Learning Suite Integration

**Duration**: 2.5 weeks  
**Goal**: Scrape Learning Suite grade data and merge it with Canvas data.

### Week 1 — DOM Scraping Engine

- [ ] Build the `ls.ts` content script injected on `learningsuite.byu.edu`
- [ ] Implement scrapers for the following pages:
  - `/student/gradebook` → assignment categories, weights, scores, current grade
  - `/student/assignments` → assignment list with due dates and submission status
  - `/student/gradebook/whatif` → grade scale for the course
- [ ] Abstract all CSS selectors into a versioned `scrapers/ls-selectors.ts` file
- [ ] Parse and normalize scraped data into the shared TypeScript `Course`/`Assignment` interfaces
- [ ] Post data to background service worker and store in `chrome.storage.local`

### Week 2 — Unified Course View

- [ ] Add Learning Suite courses to the unified Course List in the popup
  - Platform badge labeled "Learning Suite"
- [ ] Build the **Course Linking UI** in the options page: let the user link a Canvas and Learning Suite course that represent the same class
- [ ] If courses are linked, merge their data and display as a single entry
- [ ] Implement **hide/show course** toggle (stored in `chrome.storage.local`)
- [ ] Implement semester/term filter

### Week 3 (partial) — Resilience & Error Handling

- [ ] Add scraper version detection: if the LS DOM structure changes, log a warning and display a "Data may be outdated" notice
- [ ] Add graceful handling for when the user is not logged in to either platform
- [ ] Add retry logic for failed scrapes/API calls

### Deliverable
Extension popup shows unified course list from both Canvas and Learning Suite.

### Success Criteria
- Learning Suite grades visible alongside Canvas grades
- Linked courses show as a single merged entry
- Extension does not crash or break LS/Canvas pages

---

## Phase 4 — Grade Calculator & GPA Engine

**Duration**: 3 weeks  
**Goal**: Implement the core "What If" calculator, the GPA tracker, and the "Points Needed" calculator.

### Week 1 — Core Calculation Engine

- [ ] Implement pure TypeScript functions in `shared/calculators/`:
  - `computeWeightedGrade(assignments, groups)` → final percentage for a course
  - `computeLetterGrade(percentage, gradeScale)` → letter grade
  - `computeGPA(courses, creditHours)` → semester GPA (4.0 scale)
  - `computeCumulativeGPA(semesterGPA, semesterCredits, historicGPA, historicCredits)` → overall GPA
  - `computePointsNeeded(target, current, remaining, weights)` → minimum score per remaining assignment
- [ ] Write comprehensive **unit tests** for all calculator functions with edge cases (dropped assignments, extra credit, incomplete categories)

### Week 2 — What If Calculator UI

- [ ] Add **editable score fields** to every unsubmitted assignment row in the popup
  - Input shows placeholder "Enter score" in a visually distinct style (e.g., blue outline, pencil icon)
  - Accepts raw points or percentage
- [ ] Wire inputs to Zustand state for the "hypothetical" scenario
- [ ] Grade display updates **in real time** as the user types (debounced at 300ms)
- [ ] The projected final grade and letter grade update live at the top of the course view
- [ ] Add a **Reset All** button that clears all hypothetical inputs back to actual scores

### Week 3 — Scenario Saving, GPA Tracker & Points Needed

- [ ] **Scenario saving**:
  - "Save Scenario" button stores the current set of hypothetical scores under a named scenario
  - Scenarios stored in `chrome.storage.local`
  - User can switch between saved scenarios from a dropdown (e.g., "Optimistic", "Realistic", "Passing")
  - "Delete Scenario" button
- [ ] **Points Needed calculator**:
  - Input field for a target final grade (e.g., "I want an A-")
  - Extension calculates and displays the required average score on remaining assignments
  - If the goal is mathematically impossible, display a friendly warning
- [ ] **GPA Tracker panel**:
  - Section in the popup showing all courses with their current/projected grade
  - Credit hours editable per course (stored in `chrome.storage.local`)
  - Semester GPA displayed, updating as What-If scores change
  - Historical GPA input fields: prior cumulative GPA and total credits earned
  - Overall (cumulative) GPA displayed

### Deliverable
Fully functional "What If" grade calculator with real-time updates, scenario saving, GPA tracking, and "points needed" tool.

### Success Criteria
- Changing a hypothetical score updates the course grade and GPA in under 300ms
- Scenarios save and reload correctly
- "Points needed" calculation is mathematically accurate
- Calculator works on both Canvas and Learning Suite courses

---

## Phase 5 — Unified Dashboard & UI Polish

**Duration**: 2.5 weeks  
**Goal**: Elevate the UI to a premium, production-quality experience.

### Week 1 — Dashboard View

- [ ] Build a **Dashboard home screen** showing all courses in a card grid:
  - Course name, platform badge, current grade (large), letter grade
  - Upcoming assignments count (assignments due in next 7 days)
  - Quick GPA summary at the top

### Week 2 — Polish & Micro-interactions

- [ ] Implement **dark mode** toggle (persisted in `chrome.storage.sync` for cross-device sync)
- [ ] Add hover states, focus styles, and transition animations throughout the popup
- [ ] Build the **Options page** with:
  - Notification settings (on/off, time thresholds per course)
  - Course visibility toggles
  - Historical GPA input
  - Manual course linking
- [ ] Implement **badge on extension icon** showing count of assignments due in 48 hours
- [ ] Implement browser notifications via the Alarms API

### Week 3 (partial) — Accessibility & Responsiveness

- [ ] Ensure all interactive elements are keyboard-navigable (Tab order, focus rings)
- [ ] Add ARIA labels to all chart and data elements
- [ ] Test and fix layout at various popup widths (380px to 600px)

### Deliverable
A polished, premium-looking extension that feels production-ready.

### Success Criteria
- Dark mode works consistently
- Extension icon badge updates correctly

---

## Phase 6 — Testing & QA

**Duration**: 1 week  
**Goal**: Verify calculator correctness and manually test the full extension on real BYU data.

### Calculator Unit Tests (Vitest)

- [ ] Achieve **>90% coverage** on all calculator functions
- [ ] Cover edge cases: dropped assignments, extra credit, incomplete categories, impossible grade targets

### Manual QA in Chrome

- [ ] Test on real BYU Canvas and Learning Suite with a real student account
- [ ] Test across multiple enrolled courses with different grade structures
- [ ] Test the What-If calculator: changing scores updates grade and GPA correctly
- [ ] Test scenario save/load works correctly
- [ ] Test notification timing and badge updates
- [ ] Test offline behavior (dashboard shows cached data when network is unavailable)
- [ ] Test daily Canvas background refresh fires and updates data

### Deliverable
Extension verified as correct and stable on real BYU data.

---


## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BYU Learning Suite changes its DOM structure | Medium | High | Abstract all selectors into a versioned module; monitor for changes |
| Canvas API rate limiting | Low | Medium | Batch requests, cache aggressively, respect retry-after headers |
| BYU changes authentication/SSO flow | Low | High | Rely on session token stored in chrome.storage.local; prompt user to re-login |
| Scope creep (adding features before core is stable) | High | Medium | Strictly follow phase gates; defer all v2 features to a backlog |

---

## Backlog (v2 Features)

- AI-powered study recommendations based on grade trends
- Integration with VitalSource for course materials
- Export grades to CSV/PDF
- Shared "what-if" links (read-only shareable URL)
- Firefox full support
- Mobile companion app (React Native)
- Push notifications via a companion web service

---

## Definition of Done

A feature is "done" when:
1. It is implemented and working on real BYU data
2. Calculator functions have Vitest unit tests covering edge cases
3. It has been manually verified by loading the extension in Chrome
4. TypeScript compiles with zero errors and ESLint reports no warnings
