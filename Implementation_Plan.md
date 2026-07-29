# Implementation Plan — BYU Grade Hub Browser Extension

> **Version**: 1.0 — Draft  
> **Date**: July 2026  
> **Author**: Suzana Pinheiro  
> **Total Estimated Duration**: ~14 weeks (part-time, ~10–15 hrs/week)

---

## Summary

| Phase | Name | Duration | Status |
|-------|------|----------|--------|
| 1 | Foundation & Setup | 1 week | ⬜ Not Started |
| 2 | Canvas Integration | 2 weeks | ⬜ Not Started |
| 3 | Learning Suite Integration | 2.5 weeks | ⬜ Not Started |
| 4 | Grade Calculator & GPA Engine | 3 weeks | ⬜ Not Started |
| 5 | Unified Dashboard & Polish | 2.5 weeks | ⬜ Not Started |
| 6 | Testing & QA | 2 weeks | ⬜ Not Started |
| 7 | Publishing & Launch | 1 week | ⬜ Not Started |

---

## Phase 1 — Foundation & Setup

**Duration**: 1 week  
**Goal**: Establish the project scaffold, tooling, and developer environment.

### Tasks

- [ ] Initialize the repository on GitHub with a clear folder structure
- [ ] Scaffold the extension using **WXT + Vite + React + TypeScript**
- [ ] Configure **Tailwind CSS v4** with a custom design system (color tokens, typography, spacing)
- [ ] Set up **ESLint, Prettier, and Husky** pre-commit hooks
- [ ] Configure **Vitest** for unit testing and **Playwright** for E2E
- [ ] Set up **GitHub Actions** CI pipeline (lint + test + build)
- [ ] Create the `manifest.json` with minimum required permissions:
  - `storage`, `alarms`, `notifications`, `activeTab`
  - Host permissions: `*://*.instructure.com/*`, `*://learningsuite.byu.edu/*`
- [ ] Define all shared **TypeScript interfaces** (`Course`, `Assignment`, `AssignmentGroup`, `Grade`, `Scenario`)
- [ ] Create the basic Dexie.js **database schema**
- [ ] Stub out all four entry points: popup, options, canvas content script, LS content script

### Deliverable
A working "Hello World" extension that loads in Chrome, shows a blank popup, and passes all CI checks.

### Success Criteria
- Extension loads without errors in Chrome
- CI pipeline runs green
- TypeScript compiles with zero errors

---

## Phase 2 — Canvas Integration

**Duration**: 2 weeks  
**Goal**: Fetch and display real course and assignment data from Canvas.

### Week 1 — API Integration

- [ ] Build the `canvas.ts` content script that detects when the user is on `*.instructure.com`
- [ ] Implement authenticated API calls using the user's session cookie:
  - `GET /api/v1/courses` — enrolled courses
  - `GET /api/v1/courses/:id/assignment_groups` — categories + weights
  - `GET /api/v1/courses/:id/assignments` — all assignments with due dates and scores
  - `GET /api/v1/users/self/enrollments` — current grades across courses
- [ ] Store the fetched data in **IndexedDB (Dexie.js)** and `chrome.storage.local`
- [ ] Set up the background service worker to receive messages from the content script
- [ ] Write unit tests for API parsing and storage logic

### Week 2 — Popup Course Display

- [ ] Build the **Course List** component in the popup (React):
  - Shows all Canvas courses with current grade and letter grade
  - Platform badge labeled "Canvas"
  - Click to expand and see assignment groups
- [ ] Build the **Assignment Group** component:
  - Shows category name, weight percentage, and assignments within
  - Each assignment row: title, due date, score/max score, % of grade
  - Visual state for: submitted, unsubmitted, dropped
- [ ] Implement a **manual sync button** with last-sync timestamp
- [ ] Write Vitest tests for all new components

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
- [ ] Post data to background service worker and store in Dexie.js

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

- [ ] Build a **Dashboard home screen** in the popup showing all courses in a card grid:
  - Course name, platform badge, current grade (large), letter grade
  - Upcoming assignments count (assignments due in next 7 days)
  - Quick GPA summary at the top
- [ ] Add **grade trend sparklines** (Recharts) showing grade evolution over time if historical data is available
- [ ] Animate grade changes using **Framer Motion** (smooth number counting transitions)

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
- All animations run at 60fps with no jank
- Passes basic accessibility audit (axe-core)

---

## Phase 6 — Testing & QA

**Duration**: 2 weeks  
**Goal**: Comprehensive testing before publication.

### Week 1 — Automated Testing

- [ ] Achieve **>80% unit test coverage** on calculator functions
- [ ] Write component tests for all major UI components (React Testing Library)
- [ ] Write E2E tests with Playwright:
  - Extension loads in Chromium
  - Canvas data fetched and displayed (mocked via MSW)
  - What-If calculator updates correctly
  - Scenario save/load works
- [ ] Run all tests in CI on every pull request

### Week 2 — Manual QA

- [ ] Test on real BYU Canvas and Learning Suite with a real student account
- [ ] Test across multiple enrolled courses with different grade structures
- [ ] Test edge cases: courses with no assignments, extra credit, dropped assignments, courses from prior semesters
- [ ] Test notification timing and badge updates
- [ ] Test offline behavior (popup shows cached data when network is unavailable)
- [ ] Cross-browser test on Firefox (if supporting it in v1)

### Deliverable
Bug-free extension verified on real BYU data.

---

## Phase 7 — Publishing & Launch

**Duration**: 1 week  
**Goal**: Package and publish the extension.

### Tasks

- [ ] Write the **Privacy Policy** document (required for Chrome Web Store)
- [ ] Create Chrome Web Store listing:
  - Store description and feature list
  - Screenshots (minimum 3, 1280×800)
  - Promotional tile image (440×280)
- [ ] Package the extension as a production `.zip` using `wxt build`
- [ ] Submit to **Chrome Web Store** for review (typically 1–7 business days)
- [ ] Create a GitHub Release with the `.zip` artifact for manual installation
- [ ] Write a `README.md` with installation instructions, feature overview, and contribution guide
- [ ] Optionally: post about the extension on BYU student communities (Reddit, Discord)

### Deliverable
Live extension available on the Chrome Web Store (or as a side-loadable `.zip`).

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BYU Learning Suite changes its DOM structure | Medium | High | Abstract all selectors into a versioned module; monitor for changes |
| Canvas API rate limiting | Low | Medium | Batch requests, cache aggressively, respect retry-after headers |
| BYU changes authentication/SSO flow | Low | High | Rely on session cookies rather than storing credentials; prompt user to re-login |
| Chrome Web Store review rejection | Medium | Medium | Follow all policies strictly; avoid screenshots that reference third-party trademarks without permission |
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
2. It has unit/component tests with >80% coverage
3. It passes all CI checks (lint, type-check, test, build)
4. It is documented in code (JSDoc for calculator functions) and in the README if user-facing
5. It has been manually verified in a real Chrome browser
