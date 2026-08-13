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
| **WXT (Web Extension Tools)** | The primary build framework. Sits on top of Vite and handles Manifest V3 boilerplate, multiple entry points (popup, dashboard, content scripts, background), Hot Module Replacement during development, and cross-browser builds automatically. |

---

### 2.3 UI Framework & Styling

| Tool | Version | Reason |
|------|---------|--------|
| **React 18** | 18.x | Most in-demand UI library in the job market. Concurrent rendering, React hooks, and the ecosystem (React Query, Zustand) are perfectly suited to the full-page dashboard tab. |
| **Tailwind CSS v4** | 4.x | Top CSS framework in job postings. Utility-first approach accelerates building pixel-perfect UI across the full-width dashboard. Zero unused CSS in production. |
| **Lucide React** | Latest | Modern icon library, the successor to Feather Icons. Used widely in 2025 SaaS products. |

---

### 2.4 State Management & Data Layer

| Tool | Reason |
|------|--------|
| **Zustand** | Lightweight, unopinionated state management. Preferred over Redux in 2025 for its minimal boilerplate. Will manage the in-memory state of courses, assignments, and hypothetical scenarios. |
| **Plain React Hooks** (`useEffect`, `useState`, `useCallback`) | Used for all data loading and syncing from `chrome.storage.local`. Straightforward and sufficient — no external data-fetching library needed since the data source is local storage, not a remote server. |
| **Chrome Storage API (`chrome.storage.local`)** | All persistent data storage — user settings, cached grade data, auth tokens, and what-if scenarios. Simple, built-in, and sufficient for a single-user personal extension. |

---

### 2.5 Data Access Strategy

#### Canvas (REST API + Background Auto-Refresh)

BYU uses Instructure's standard Canvas LMS, which exposes a documented REST API.

| Endpoint | Data Retrieved |
|----------|---------------|
| `GET /api/v1/courses` | List of enrolled courses |
| `GET /api/v1/courses/:id/assignments` | All assignments for a course |
| `GET /api/v1/courses/:id/enrollments` | Current grade and score |
| `GET /api/v1/courses/:id/assignment_groups` | Assignment categories and weights |
| `GET /api/v1/users/self/enrollments` | Grades across all courses |

- **Auth method**: On the user's first visit to `*.instructure.com`, the content script extracts the Canvas API auth token from the active session and saves it securely in `chrome.storage.local`. Subsequent API calls are made directly from the **background service worker** using this stored token — no Canvas tab needs to be open.
- **Background refresh**: A `chrome.alarms` timer fires **once daily**, triggering the service worker to call the Canvas REST API and update cached data automatically.
- **Manual refresh**: The user can also trigger an on-demand Canvas sync from the popup or dashboard at any time.
- **Token expiry**: If a Canvas API call returns a 401 (unauthorized), the extension clears the stored token and prompts the user to visit Canvas to re-authenticate.
- **Rate limiting**: Requests are batched and throttled to respect Canvas API rate limits (typically 3,000 requests per hour per user).

#### Learning Suite (DOM Scraping — Visit-Based)

BYU Learning Suite has no public API. Data is extracted via a **content script** injected on `learningsuite.byu.edu` only when the user visits those pages. No background scraping is performed.

| Page | Data Extracted |
|------|---------------|
| `/student/gradebook` | Assignment categories, weights, scores, final grade |
| `/student/gradebook/whatif` | Grade scale, current projected score |
| `/student/assignments` | Assignment list with due dates and submission status |

- **Parsing strategy**: Use `document.querySelector` / `querySelectorAll` to parse DOM tables. Data is serialized to JSON and sent to the background service worker via `chrome.runtime.sendMessage`.
- **Sync trigger**: The content script runs automatically every time the user navigates to any LS gradebook page — no manual action needed beyond visiting the site.
- **One-click helper**: The dashboard displays an **"Open Learning Suite"** button that opens the LS gradebook directly, so the user never has to remember the URL or dig through bookmarks to trigger a sync.
- **Last synced indicator**: The dashboard shows "Learning Suite: last synced X minutes ago" so the user always knows how fresh the data is.
- **Resilience**: Selectors are abstracted into a versioned `scrapers/ls-selectors.ts` file so they can be updated if BYU changes the HTML structure without touching core logic.

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
├── ai/                  → [FUTURE] AI chatbot, study tips, study plan generator
│   └── .gitkeep         → Placeholder — not implemented in v1.0
└── shared/
    ├── types/           → TypeScript interfaces shared across all entry points
    ├── storage/         → chrome.storage.local access helpers
    └── calculators/     → Pure functions: grade computation, GPA calculation, "what-if" engine
```

#### Communication Flow

**Canvas (background auto-refresh path):**
1. On first visit to `*.instructure.com`, `canvas.ts` content script extracts the auth token and sends it to the service worker to store in `chrome.storage.local`.
2. A `chrome.alarms` timer fires **once daily** — the service worker calls the Canvas REST API directly using the stored token.
3. Fetched data is saved to `chrome.storage.local` and the toolbar badge is updated.
4. The user can also click **"Sync Canvas Now"** in the popup/dashboard to trigger an immediate refresh.

**Learning Suite (visit-based path):**
1. When the user navigates to any `learningsuite.byu.edu` gradebook page, `ls.ts` content script scrapes the DOM.
2. Scraped data is posted to the background service worker via `chrome.runtime.sendMessage`.
3. The service worker stores it in `chrome.storage.local` and records the LS last-sync timestamp.
4. If the user hasn't visited LS recently, the dashboard shows a **"Open Learning Suite"** button to make it easy.

**Dashboard & Popup:**
1. Clicking **"Open Dashboard"** in the popup triggers `chrome.tabs.create({ url: 'dashboard.html' })`.
2. The dashboard reads from `chrome.storage.local` on load using plain `useEffect` hooks and populates the Zustand store.
3. Both surfaces show per-platform last-sync timestamps: *"Canvas: 5 min ago — Learning Suite: 2 hours ago"*.
4. What-If scenario changes are written back to `chrome.storage.local` immediately.

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

Testing is focused on the **grade calculation engine only** — the pure TypeScript functions that compute grades, GPA, and what-if projections. These are the highest-risk logic in the app and the most important to verify are correct.

| Tool | Use |
|------|-----|
| **Vitest** | Unit tests for all calculator pure functions (`computeCourseGrade`, `computeGPA`, `computeProjectedGrade`, `computePointsNeeded`). Fast, co-located with Vite, zero extra config. |

UI components, content scripts, and the extension popup/dashboard are verified manually by loading the extension in Chrome during development.

---

### 2.9 Developer Tooling & CI/CD

| Tool | Use |
|------|-----|
| **ESLint + Prettier** | Code linting and formatting. Configured with TypeScript and React rules. Run manually or on save via editor integration. |
| **GitHub Releases** | Distributes the `.zip` artifact for manual installation via Load Unpacked. |
| **Sentry (optional, v2)** | Error monitoring if the extension is published publicly. |

---

### 2.10 Design System

| Tool | Use |
|------|-----|
| **CSS Custom Properties** | Theme tokens (colors, spacing, typography) defined once and used across Tailwind configuration. |
| **Google Fonts — Inter** | Clean, modern sans-serif typeface widely used in 2025 SaaS products. |
| **Dark mode** | Supported via Tailwind's `dark:` variant and a user-controlled toggle stored in `chrome.storage.sync`. |

---

### 2.11 Future AI Integration (Not in v1.0)

AI features (chatbot, study tips, study plan generator) are planned for a future version. The v1.0 architecture is designed to make this addition seamless:

| Design Decision | Why it Helps AI Later |
|---|---|
| All course data stored in a clean, typed schema in `chrome.storage.local` | Can be serialized directly as context for an AI model prompt |
| Dedicated `ai/` folder already in the project structure | Drop in the AI module without restructuring the project |
| Dashboard UI built with a sidebar/panel layout | A collapsible AI chat panel can be added without redesigning the page |
| Shared TypeScript interfaces for `Course`, `Assignment`, `Grade` | AI module can import the same types with no adaptation layer |

**Likely AI stack when the time comes:**

| Tool | Role |
|------|------|
| **OpenAI API / Google Gemini API** | LLM backend for the chatbot and study plan generation |
| **Vercel AI SDK** | Streaming chat responses in React with minimal boilerplate |
| **Prompt templates** | Pre-built prompts that inject the user's grade data as structured context |

> No AI API keys, network calls to AI services, or AI-related UI are included in v1.0.

**Visual enhancements planned for later versions:**

| Tool | Role |
|------|------|
| **Recharts** | Grade trend sparklines and GPA trajectory charts (deferred from v1.0) |
| **Framer Motion** | Smooth animations and transitions throughout the dashboard (deferred from v1.0) |

---

## 3. Security Considerations

- No data ever leaves the user's machine — everything is stored in `chrome.storage.local`.
- The extension requests **minimum permissions**: `storage`, `alarms`, `notifications`, `tabs` (to open the dashboard tab), `cookies` (to read LS session state if needed in future), and host permissions limited to `*.instructure.com` and `learningsuite.byu.edu`.
- Content Security Policy (CSP) is configured strictly in `manifest.json` to prevent XSS.
- The Canvas auth token is stored in `chrome.storage.local` (never in plain-text logs or exposed in the UI).
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
