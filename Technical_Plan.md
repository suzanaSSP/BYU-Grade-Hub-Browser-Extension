# Technical Plan — BYU Grade Hub Browser Extension

> **Version**: 1.0 — Draft  
> **Date**: July 2026  
> **Author**: Suzana Pinheiro  

---

## 1. Technology Rationale

All tools listed below were selected based on **current job-market demand** (2025–2026) for front-end and browser extension development, balancing developer experience, performance, and ecosystem maturity.

---

## 2. Core Technology Stack

### 2.1 Runtime & Language

| Tool | Version | Reason |
|------|---------|--------|
| **TypeScript** | 5.x | Industry standard for large front-end projects. Provides type safety, better IDE autocomplete, and fewer runtime bugs — heavily demanded in job listings. |
| **Node.js** | 22 LTS | Runtime for build tooling and scripts. |

---

### 2.2 Browser Extension Framework

| Tool | Reason |
|------|--------|
| **Chrome Extension Manifest V3** | The current and required format for all new Chrome extensions. Mandatory for Chrome Web Store submissions as of 2024. |
| **CRXJS + Vite** | CRXJS is a Vite plugin that enables Hot Module Replacement (HMR) for Chrome extensions during development, dramatically speeding up the dev loop. Vite is the fastest bundler in the current market and is overwhelmingly preferred over Webpack in 2025. |
| **WXT (Web Extension Tools)** | Optional scaffolding layer on top of Vite that handles Manifest V3 boilerplate, multiple entry points (popup, content scripts, background), and cross-browser (Chrome + Firefox) builds automatically. |

---

### 2.3 UI Framework & Styling

| Tool | Version | Reason |
|------|---------|--------|
| **React 18** | 18.x | Most in-demand UI library in the job market. Concurrent rendering, React hooks, and the ecosystem (React Query, Zustand) are perfectly suited to the full-page dashboard tab. |
| **Tailwind CSS v4** | 4.x | Top CSS framework in job postings. Utility-first approach accelerates building pixel-perfect UI across the full-width dashboard. Zero unused CSS in production. |
| **Framer Motion** | 11.x | Industry-leading animation library for React. Used for smooth transitions in the grade calculator, scenario switching, and card animations. |
| **Recharts** | 2.x | Composable chart library built on top of D3 and React. Will be used for grade trend sparklines and GPA trajectory charts. |
| **Lucide React** | Latest | Modern icon library, the successor to Feather Icons. Used widely in 2025 SaaS products. |

---

### 2.4 State Management & Data Layer

| Tool | Reason |
|------|--------|
| **Zustand** | Lightweight, unopinionated state management. Preferred over Redux in 2025 for its minimal boilerplate. Will manage the in-memory state of courses, assignments, and hypothetical scenarios. |
| **TanStack Query (React Query) v5** | Asynchronous data fetching, caching, and background sync. Handles the refresh-on-focus and stale-while-revalidate patterns perfectly for syncing from Canvas and Learning Suite. |
| **Chrome Storage API (`chrome.storage.local`)** | Native browser extension storage for persisting user settings, cached grade data, and what-if scenarios. |
| **IndexedDB via Dexie.js** | For larger structured datasets (full assignment history, all courses). Dexie provides a clean, Promise-based API over IndexedDB. |

---

### 2.5 Data Access Strategy

#### Canvas (REST API)

BYU uses Instructure's standard Canvas LMS, which exposes a documented REST API.

| Endpoint | Data Retrieved |
|----------|---------------|
| `GET /api/v1/courses` | List of enrolled courses |
| `GET /api/v1/courses/:id/assignments` | All assignments for a course |
| `GET /api/v1/courses/:id/enrollments` | Current grade and score |
| `GET /api/v1/courses/:id/assignment_groups` | Assignment categories and weights |
| `GET /api/v1/users/self/enrollments` | Grades across all courses |

- **Auth method**: The user's active Canvas session cookie is automatically included in fetch requests made from a content script on `*.instructure.com`. No OAuth flow needed.
- **Rate limiting**: Requests are batched and throttled to respect Canvas API rate limits (typically 3,000 requests per hour per user).

#### Learning Suite (DOM Scraping)

BYU Learning Suite has no public API. Data will be extracted via a **content script** injected on `learningsuite.byu.edu`.

| Page | Data Extracted |
|------|---------------|
| `/student/gradebook` | Assignment categories, weights, scores, final grade |
| `/student/gradebook/whatif` | Grade scale, current projected score |
| `/student/assignments` | Assignment list with due dates and submission status |

- **Parsing strategy**: Use `document.querySelector` / `querySelectorAll` to parse DOM tables. Data is then serialized to JSON and sent to the extension background service worker via `chrome.runtime.sendMessage`.
- **Resilience**: Selectors will be version-tagged and abstracted into a separate `scrapers/` module so they can be updated if BYU changes the HTML structure without touching core logic.

---

### 2.6 Extension Architecture (Manifest V3)

#### Entry Points

The extension has two distinct UI surfaces:

| Entry Point | Role |
|-------------|------|
| **Popup** (mini) | Lightweight launcher — shows GPA at a glance, upcoming assignment badge count, and a single **"Open Dashboard"** button that opens the full tab. |
| **Dashboard** (full tab) | The main application. A full-browser-tab React app with the grade dashboard, What-If calculator, GPA tracker, and all course details. Opened via `chrome.tabs.create()`. |
| **Options page** | Settings: notification preferences, credit hours per course, historical GPA input, course visibility. |

#### Folder Structure

```
Extension
├── popup/               → Minimal React app: GPA summary + "Open Dashboard" button
├── dashboard/           → Full React app: main grade dashboard, What-If calculator, GPA tracker
├── options/             → React app: settings page
├── content_scripts/
│   ├── canvas.ts        → Injected on canvas.instructure.com — fetches Canvas REST API
│   └── ls.ts            → Injected on learningsuite.byu.edu — scrapes DOM
├── background/
│   └── service_worker.ts → Syncs data, manages alarms (notifications), updates badge
└── shared/
    ├── types/           → TypeScript interfaces shared across all entry points
    ├── storage/         → Dexie.js database schema and access layer
    └── calculators/     → Pure functions: grade computation, GPA calculation, "what-if" engine
```

#### Communication Flow

1. Content scripts detect when the user is on a Canvas or Learning Suite page and extract data.
2. Content scripts post data to the **background service worker** via `chrome.runtime.sendMessage`.
3. The service worker stores data in `chrome.storage.local` / IndexedDB and updates the toolbar badge.
4. The **popup** reads the latest GPA snapshot and assignment count from storage for its mini-summary.
5. Clicking **"Open Dashboard"** triggers `chrome.tabs.create({ url: 'dashboard.html' })`.
6. The **dashboard** tab hydrates its full Zustand store from `chrome.storage.local` on load.
7. TanStack Query manages background refresh and keeps both the popup and dashboard in sync.
8. All What-If scenario changes made in the dashboard are written back to `chrome.storage.local` and reflected in the popup badge immediately.

#### Personal Use — Load Unpacked

Since this extension is for personal use only, **no Chrome Web Store submission is needed**. The extension is installed via:

> `chrome://extensions` → Enable **Developer Mode** → **Load unpacked** → select the `dist/` folder after running `npm run build`.

During development, WXT's dev mode (`npm run dev`) enables **Hot Module Replacement** so the dashboard tab auto-reloads on code changes, just like a normal web app.

---

### 2.7 Grade Calculation Engine

The grade calculation engine is a set of **pure TypeScript functions** with no side effects, making them independently testable:

- `computeCourseGrade(assignments, weights)` → weighted average → letter grade
- `computeProjectedGrade(assignments, hypotheticals, weights)` → what-if final grade
- `computeGPA(courses, creditHours)` → semester and cumulative GPA on BYU 4.0 scale
- `computePointsNeeded(targetGrade, currentGrade, remainingAssignments, weights)` → minimum score needed per remaining assignment

BYU GPA scale:
| Letter | GPA Points |
|--------|-----------|
| A | 4.0 |
| A- | 3.7 |
| B+ | 3.4 |
| B | 3.0 |
| B- | 2.7 |
| C+ | 2.4 |
| C | 2.0 |
| C- | 1.7 |
| D+ | 1.4 |
| D | 1.0 |
| D- | 0.7 |
| E/F | 0.0 |

---

### 2.8 Testing Stack

| Tool | Use |
|------|-----|
| **Vitest** | Unit and integration tests. Co-located with Vite, faster than Jest. Used for all calculator pure functions. |
| **React Testing Library** | Component tests for the popup and dashboard UI. |
| **Playwright** | End-to-end tests (loading the extension in a real Chromium browser, opening the dashboard tab, and verifying grade display and calculator behaviour). |
| **MSW (Mock Service Worker)** | Intercepts Canvas API calls in tests without hitting real endpoints. |

---

### 2.9 Developer Tooling & CI/CD

| Tool | Use |
|------|-----|
| **ESLint + Prettier** | Code linting and formatting. Configured with TypeScript and React rules. |
| **Husky + lint-staged** | Pre-commit hooks to enforce linting before every commit. |
| **GitHub Actions** | CI pipeline: runs tests, type checks, and builds the extension on every push. |
| **GitHub Releases** | Distributes the `.crx` / `.zip` artifact for Chrome Web Store or manual installation. |
| **Sentry (optional, v2)** | Error monitoring if the extension is published publicly. |

---

### 2.10 Design System

| Tool | Use |
|------|-----|
| **Figma** | UI/UX design mockups and design system tokens before implementation. |
| **CSS Custom Properties** | Theme tokens (colors, spacing, typography) defined once and used across Tailwind configuration. |
| **Google Fonts — Inter** | Clean, modern sans-serif typeface widely used in 2025 SaaS products. |
| **Dark mode** | Supported via Tailwind's `dark:` variant and a user-controlled toggle stored in `chrome.storage.sync`. |

---

## 3. Security Considerations

- No data ever leaves the user's machine — everything is stored in `chrome.storage.local` and IndexedDB.
- The extension requests **minimum permissions**: `storage`, `alarms`, `notifications`, `tabs` (to open the dashboard tab), and host permissions limited to `*.instructure.com` and `learningsuite.byu.edu`.
- Content Security Policy (CSP) is configured strictly in `manifest.json` to prevent XSS.
- API tokens (Canvas session tokens) are never logged or exposed in the popup or dashboard.

---

## 4. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser Extension                           │
│                                                                   │
│  ┌─────────────────┐      ┌──────────────────────────────────┐   │
│  │   Popup (mini)  │      │    Background Service Worker     │   │
│  │─────────────────│      │──────────────────────────────────│   │
│  │ • GPA snapshot  │◄────►│ • Data orchestration & storage   │   │
│  │ • Badge count   │      │ • Alarm scheduling (notifs)      │   │
│  │ • [Open Dashboard]──┐  │ • Toolbar badge updates          │   │
│  └─────────────────┘   │  └──────────────┬───────────────────┘   │
│                         │                │ chrome.runtime.msg     │
│           chrome.tabs   │  ┌─────────────┴──────────────────┐    │
│           .create()     │  │        Content Scripts         │    │
│                         │  │  canvas.ts     │    ls.ts      │    │
│  ┌──────────────────┐   │  │ (API fetches)  │ (DOM scraping)│    │
│  │  Dashboard Tab   │◄──┘  └────────────────┴───────────────┘    │
│  │──────────────────│               │              │              │
│  │ • Course list    │               │              │              │
│  │ • Grade view     │  └────────────┘──────────────┘             │
│  │ • What-If calc   │       (data written to chrome.storage)      │
│  │ • GPA tracker    │                                             │
│  │ • Scenario saving│                                             │
│  └──────────────────┘                                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          │               │
                  ┌───────▼───┐   ┌───────▼────────┐
                  │  Canvas   │   │ Learning Suite  │
                  │  REST API │   │  (DOM parsing)  │
                  └───────────┘   └────────────────┘
```
