# Technical Plan — BYU Grade Hub Browser Extension

> **Version**: 1.1 — Draft  
> **Date**: October 2026  
> **Author**: Suzana Pinheiro  

---

## 1. Technology Rationale

All tools listed below were selected based on **current job-market demand** (2025–2026) for front-end and browser extension development, balancing developer experience, performance, and ecosystem maturity.

Releases referenced below: **v1.0** = course-level GPA planner, **v1.1** = assignment-level What-If (see `Requirements.md`).

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
| **WXT (Web Extension Tools)** | The primary build framework. Sits on top of Vite and handles Manifest V3 boilerplate, multiple entry points (popup, content scripts, background), Hot Module Replacement during development, and cross-browser builds automatically. |

---

### 2.3 UI Framework & Styling

| Tool | Version | Reason |
|------|---------|--------|
| **React 18** | 18.x | Most in-demand UI library in the job market. |
| **Tailwind CSS v4** | 4.x | Top CSS framework in job postings. Utility-first approach, zero unused CSS in production. |
| **Lucide React** | Latest | Modern icon library, the successor to Feather Icons. |

---

### 2.4 State Management & Data Layer

| Tool | Reason |
|------|--------|
| **Zustand** | Lightweight, unopinionated state management with minimal boilerplate. Manages the in-memory state of courses, projections, and (v1.1) hypothetical scores. |
| **Plain React Hooks** (`useEffect`, `useState`, `useCallback`) | Used for loading and syncing from `chrome.storage.local`. No external data-fetching library needed since the data source is local storage, not a remote server. |
| **Chrome Storage API (`chrome.storage.local`)** | All persistent data — cached grades, credit hours, projections, prior GPA, hidden courses. Simple, built-in, and sufficient for a single-user personal extension. |

#### Storage Schema

Synced data (overwritten on every sync) is kept separate from user input (never overwritten by a sync). User input is keyed by a stable course key (`<platform>:<courseId>`), so re-syncs never wipe projections or credit hours.

```ts
// v1.0
type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'E';

interface Course {                     // synced
  key: string;                         // e.g. "canvas:12345"
  platform: 'canvas' | 'learning-suite';
  name: string;
  currentPercent: number | null;
  currentLetter: LetterGrade | null;
}

interface CourseSettings {             // user input
  creditHours: number;
  projectedLetter: LetterGrade | null; // course-level What-If (FR-42)
  hidden: boolean;
}

// storage keys
// courses:canvas, courses:learning-suite → Course[]
// sync:canvas, sync:learning-suite      → { lastSyncedAt: number }
// courseSettings                        → Record<courseKey, CourseSettings>
// priorGpa                              → { kind: 'grade-points'; gradePoints; credits } | { kind: 'gpa'; gpa; credits } | null

// v1.1 adds (no changes to the keys above):
// assignments:<courseKey>               → { groups: AssignmentGroup[]; assignments: Assignment[]; gradeScale? }
// hypotheticals:<courseKey>             → Record<assignmentId, number>
```

---

### 2.5 Data Access Strategy

#### Canvas (REST API)

BYU uses Instructure's standard Canvas LMS, which exposes a documented REST API.

| Release | Endpoint | Data Retrieved |
|---------|----------|---------------|
| v1.0 | `GET /api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=term` | Active courses, term, current score and grade — everything v1.0 needs in one call |
| v1.1 | `GET /api/v1/courses/:id/assignment_groups?include[]=assignments&include[]=submission` | Categories, weights, assignments, and the user's scores |
| v1.1 | `GET /api/v1/courses/:id?include[]=grading_scheme` *(verify during Phase 7)* | Course grade scale |

- **Auth**: API calls use the user's logged-in Canvas session.
  - **Auth spike result (Phase 3, Oct 2026):** requests from the background service worker (`fetch` with `credentials: 'include'`, host permission on `*.instructure.com`) carry the Canvas session. Grades loaded from the popup with no Canvas tab open. The background is the primary sync path.
  - The Canvas content script also syncs when the user visits a Canvas page and the data is stale. It stays as a fallback in case the session stops being sent to extension requests (for example, a change to Chrome's third-party cookie rules).
- **Refresh**: on popup open if cached data is stale, plus a manual **"Sync Canvas Now"** button. No background alarms in v1.0.
- **Session expiry**: a 401 response shows "Visit Canvas to reconnect".
- **Pagination**: follow the `Link` header (`rel="next"`) on list endpoints.

#### Learning Suite (DOM Scraping — Visit-Based)

BYU Learning Suite has no public API. Data is extracted via a **content script** injected on `learningsuite.byu.edu` only when the user visits those pages. No background scraping is performed.

| Release | Page | Data Extracted |
|---------|------|---------------|
| v1.0 | Gradebook | Course list and current grade per course |
| v1.1 | Gradebook (full) | Assignment categories, weights, assignments, scores |
| v1.1 | What-if / grade scale page | Course grade scale |

- **Parsing strategy**: `document.querySelector` / `querySelectorAll` on the gradebook DOM. Data is serialized to JSON and sent to the background service worker via `chrome.runtime.sendMessage`.
- **Sync trigger**: runs automatically every time the user opens an LS gradebook page.
- **One-click helper**: the popup has an **"Open Learning Suite"** button that opens the gradebook directly.
- **Resilience**: selectors live in `scrapers/ls-selectors.ts`. If expected elements are missing, the old data is kept and the popup shows "Learning Suite data may be outdated".

---

### 2.6 Extension Architecture (Manifest V3)

#### Entry Points

| Entry Point | Role |
|-------------|------|
| **Popup** | The whole app. v1.0: GPA planner (GPA header, course rows with credits and projected grade, prior GPA, sync controls). v1.1: clicking a course opens its assignment tab inside the popup. |
| **Canvas content script** | Session/auth fallback for Canvas syncing (see 2.5). |
| **LS content script** | Scrapes Learning Suite pages the user visits. |
| **Background service worker** | Receives scraped data, writes it to storage. |

A full-tab dashboard and an options page are deferred (see "Later" in `Requirements.md`).

#### Folder Structure

```
Extension
├── entrypoints/
│   ├── popup/                → React app: GPA planner (v1.0), assignment tab (v1.1)
│   ├── canvas.content.ts     → Injected on *.instructure.com
│   ├── ls.content.ts         → Injected on learningsuite.byu.edu — scrapes DOM
│   └── background.ts         → Receives scraped data, writes storage
├── ai/                       → [LATER] AI features — placeholder only
└── shared/
    ├── types/                → TypeScript interfaces shared across all entry points
    ├── storage/              → chrome.storage.local access helpers
    ├── scrapers/             → ls-selectors.ts and parsing helpers
    └── calculators/          → Pure functions: GPA, letter grades, (v1.1) weighted grades
```

#### Communication Flow

**Canvas:**
1. Popup opens → if Canvas data is stale (or the user clicks "Sync Canvas Now"), fetch courses + scores.
2. Results are normalized to `Course[]` and saved to `chrome.storage.local` with `lastSyncedAt`.

**Learning Suite:**
1. The user opens an LS gradebook page → `ls.content.ts` scrapes it.
2. Scraped data is posted to the background via `chrome.runtime.sendMessage`.
3. The background stores it and records the LS `lastSyncedAt`.

**Popup:**
1. On load, reads courses, course settings, and prior GPA from `chrome.storage.local` into the Zustand store.
2. Changes to credit hours, projections, hidden courses, or prior GPA are written back immediately.
3. Shows per-platform last-sync times: *"Canvas: 5 min ago — Learning Suite: 2 hours ago"*.

#### Personal Use — Load Unpacked

Since this extension is for personal use only, **no Chrome Web Store submission is needed**. The extension is installed via:

> `chrome://extensions` → Enable **Developer Mode** → **Load unpacked** → select the build output folder after running `npm run build`.

During development, WXT's dev mode (`npm run dev`) enables **Hot Module Replacement**.

---

### 2.7 Grade Calculation Engine

Pure TypeScript functions with no side effects, independently testable.

**v1.0**
- `percentToLetter(percent, scale = BYU_DEFAULT_SCALE)` → letter grade
- `resolveProjectedLetter(course, settings)` → course-level projection, else current letter, else `null`
- `computeSemesterGPA(courses, settings)` → GPA over visible courses with a resolved letter
- `computeCumulativeGPA(semester, prior)` → (prior grade points + semester grade points) ÷ (prior credits + semester credits). Prior grade points come from the transcript; a prior GPA × credits is the less exact fallback, since the GPA is rounded.

**v1.1**
- `computeWeightedGrade(groups, assignments, hypotheticals)` → projected course percentage
- `resolveProjectedLetter` gains a middle step: course-level projection → **assignment-level projection** → current letter (FR-48)

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
| E | 0.0 |

---

### 2.8 Testing Stack

Testing is focused on the **calculation engine** — the pure functions that compute GPA and (v1.1) weighted grades. These are the highest-risk logic in the app.

| Tool | Use |
|------|-----|
| **Vitest** | Unit tests for all calculator functions. Fast, co-located with Vite, zero extra config. |

UI components and content scripts are verified manually by loading the extension in Chrome during development.

---

### 2.9 Developer Tooling & CI/CD

| Tool | Use |
|------|-----|
| **ESLint + Prettier** | Code linting and formatting. Configured with TypeScript and React rules. Run manually or on save via editor integration. |
| **GitHub Releases** | Distributes the `.zip` artifact for manual installation via Load Unpacked. |
| **Sentry (optional, later)** | Error monitoring if the extension is published publicly. |

---

### 2.10 Design System

| Tool | Use |
|------|-----|
| **CSS Custom Properties** | Theme tokens (colors, spacing, typography) defined once and used across Tailwind configuration. |
| **Google Fonts — Inter** | Clean, modern sans-serif typeface. |
| **Projection styling** | One shared visual treatment (color + pencil icon) for anything hypothetical: course-level projections (v1.0) and assignment scores (v1.1). |

Dark mode is deferred.

---

### 2.11 Future AI Integration (Later)

AI features (chatbot, study tips, study plan generator) are planned for a later version. The architecture keeps this addition easy:

| Design Decision | Why it Helps AI Later |
|---|---|
| All course data stored in a clean, typed schema in `chrome.storage.local` | Can be serialized directly as context for an AI model prompt |
| Reserved `ai/` folder | Drop in the AI module without restructuring the project |
| Shared TypeScript interfaces for `Course` (and v1.1 `Assignment`) | AI module can import the same types with no adaptation layer |

**Likely AI stack when the time comes:**

| Tool | Role |
|------|------|
| **OpenAI API / Google Gemini API** | LLM backend for the chatbot and study plan generation |
| **Serverless proxy** (Cloudflare Worker, Vercel function, or AWS Lambda) | Holds the LLM API key — keys cannot be shipped inside an extension |
| **Vercel AI SDK** | Streaming chat responses in React with minimal boilerplate |
| **Prompt templates** | Pre-built prompts that inject the user's grade data as structured context |

> No AI API keys, network calls to AI services, or AI-related UI are included in v1.0 or v1.1.

**Visual enhancements planned for later versions:**

| Tool | Role |
|------|------|
| **Recharts** | Grade trend sparklines and GPA trajectory charts |
| **Framer Motion** | Smooth animations and transitions |

---

## 3. Security Considerations

- No data ever leaves the user's machine — everything is stored in `chrome.storage.local`.
- The extension requests **minimum permissions**: `storage`, and host permissions limited to `*.instructure.com` and `learningsuite.byu.edu`. (`alarms`, `notifications`, and `tabs` are only added if the deferred features that need them are built.)
- Content Security Policy (CSP) is configured strictly in the manifest to prevent XSS.
- Session data and any Canvas credentials are never logged or exposed in the UI.

---

## 4. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser Extension                           │
│                                                                   │
│  ┌──────────────────────────┐      ┌───────────────────────────┐  │
│  │          Popup           │      │ Background Service Worker │  │
│  │──────────────────────────│      │───────────────────────────│  │
│  │ v1.0 GPA planner         │      │ • Receives scraped data   │  │
│  │ • GPA header             │      │ • Writes chrome.storage   │  │
│  │ • Course rows: current,  │      └─────────────▲─────────────┘  │
│  │   credits, projected ▾   │                    │ runtime msg    │
│  │ • Prior GPA, sync status │      ┌─────────────┴─────────────┐  │
│  │ v1.1 assignment tab      │      │      Content Scripts      │  │
│  │ • Hypothetical scores    │      │ canvas.content │ ls.content│  │
│  └────────────┬─────────────┘      │  (auth fallback│ (scraping)│  │
│               │                    └────────────────┴───────────┘  │
│               │  read/write                   │           │       │
│               ▼                               │           │       │
│        chrome.storage.local  ◄────────────────┴───────────┘       │
│                                                                   │
└───────────────┬───────────────────────────────────────────────────┘
                │ fetch (session)                 DOM parsing
        ┌───────▼───┐                     ┌────────────────┐
        │  Canvas   │                     │ Learning Suite │
        │  REST API │                     │   (gradebook)  │
        └───────────┘                     └────────────────┘
```
