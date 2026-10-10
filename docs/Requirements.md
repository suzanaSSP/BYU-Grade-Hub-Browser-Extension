# Requirements — BYU Grade Hub Browser Extension

> **Version**: 1.1 — Draft  
> **Date**: October 2026  
> **Author**: Suzana Pinheiro  

---

## 1. Overview

BYU Grade Hub is a browser extension for Google Chrome that pulls current course grades from **BYU Canvas** and **BYU Learning Suite** into a single **GPA planner**. Its core feature is a "What If" calculator that lets students project their grades and see the impact on their semester and cumulative GPA.

The product ships in two steps:

| Release | Scope |
|---------|-------|
| **v1.0** | **Course-level What-If.** The main (and only) screen is the GPA planner: every course shows its current grade, and the student picks a projected letter grade per course to see the resulting GPA. No assignment-level data or views. |
| **v1.1** | **Assignment-level What-If.** Each course can be opened into an assignment tab where the student enters hypothetical scores on individual assignments; the projected course grade and GPA update from those scores. |

Everything else is deferred to [Section 6 — Later](#6-later-deferred-features).

---

## 2. Target Users

- BYU students enrolled in courses managed on either **Canvas** or **Learning Suite** (or both simultaneously).
- Students who want to plan their GPA ("What if I end up with a B+ in Chem?").
- *(v1.1)* Students who want to simulate assignment-level scenarios ("What if I get an 80% on the final?").

---

## 3. Functional Requirements — v1.0 (Course-Level GPA Planner)

### 3.1 Authentication & Data Access

| ID   | Requirement |
|------|-------------|
| FR-01 | The extension must read Canvas data using the user's **existing BYU Canvas session**. No separate login or API key entry. |
| FR-02 | The extension must read Learning Suite data by **scraping** pages the user visits, since Learning Suite does not provide a public REST API. In v1.0 only the **course list and current course grade** are needed. |
| FR-03 | Sessions should be persisted locally in the extension's storage so the user does not need to re-authenticate on every browser restart. |
| FR-04 | The extension must gracefully handle expired sessions and prompt the user to refresh by visiting the respective platform. |

---

### 3.2 Course List

| ID   | Requirement |
|------|-------------|
| FR-05 | The extension must detect and list **all active courses** from both Canvas and Learning Suite. |
| FR-06 | Courses from both platforms must be displayed in a **single unified course list**, with a visual tag indicating the source platform (Canvas / Learning Suite). |
| FR-08 | The user must be able to **hide** specific courses. Hidden courses are excluded from the GPA. (This is also how the user removes a class that appears on both platforms.) |
| FR-41 | Only **current semester** courses are shown; past and future semesters are ignored. |

---

### 3.3 Current Grades

| ID   | Requirement |
|------|-------------|
| FR-16 | The extension must show the **current grade** for each course (letter grade + percentage). |
| FR-19 | The main screen must show the current grade and letter grade for **all courses in one place** (the GPA planner). |
| FR-20 | Grades from Canvas and Learning Suite must be normalized to the same display format. If a platform reports only a percentage, the letter grade is derived using the default BYU grade scale. |

---

### 3.4 GPA Tracker

| ID   | Requirement |
|------|-------------|
| FR-21 | The extension must display the user's GPA based on current course grades (using the BYU 4.0 scale). |
| FR-22 | The user must be able to input **credit hours** per course. |
| FR-23 | The GPA display must show both **semester GPA** and **cumulative GPA**. |
| FR-24 | The user must be able to input their **total grade points and GPA hours already completed** (from the transcript) to calculate the cumulative GPA. Entering a **previous cumulative GPA** instead of grade points is allowed as a less exact fallback. |

---

### 3.5 Course-Level What-If (GPA Planner)

| ID   | Requirement |
|------|-------------|
| FR-42 | Each course must have a **projected grade** selector (A through E, plus "—" meaning "use current grade"). |
| FR-43 | The semester and cumulative GPA must **recalculate immediately** when a projected grade or credit hour value changes. |
| FR-44 | Projected grades must be **visually distinct** from current grades (different color and/or edit icon), and the GPA header must indicate when it includes projections. |
| FR-45 | The user must be able to **reset all projections** back to current grades with a single button. |
| FR-46 | Projections and credit hours must **persist locally** across popup closes and data re-syncs. |
| FR-47 | A course with **no current grade and no projection** is excluded from the GPA and labeled "No grade yet". |

---

### 3.6 Data Sync

| ID   | Requirement |
|------|-------------|
| FR-35 | **Canvas** grades must refresh automatically when the popup is opened (if the cached data is older than a few minutes). |
| FR-36 | **Learning Suite** data is refreshed automatically whenever the user visits a Learning Suite gradebook page. No background scraping is performed. |
| FR-37 | The popup must display an **"Open Learning Suite"** quick-link button that navigates directly to the LS gradebook page, making it easy to trigger a sync. |
| FR-38 | The user must be able to **manually trigger a Canvas sync** from the popup at any time. |
| FR-39 | The **last sync time** for each platform must be displayed separately (e.g., "Canvas: 5 min ago", "Learning Suite: 2 hours ago"). |
| FR-40 | Data must be **cached locally** so the extension works offline with the last known data for both platforms. |

---

## 4. Functional Requirements — v1.1 (Assignment-Level What-If)

v1.1 builds on v1.0 without changing it: the GPA planner stays the main screen, and clicking a course opens its **assignment tab**.

### 4.1 Assignment Data

| ID   | Requirement |
|------|-------------|
| FR-10 | For each course, the assignment tab must display all assignments grouped by **category/weight group** (e.g., Homework, Midterms, Final). |
| FR-11 | Each assignment must display: title, due date, score earned, maximum score, and submission status. |
| FR-12 | Dropped assignments must be visually distinguished (e.g., strikethrough, muted color). |
| FR-15 | The extension must display the **weight percentage** of each assignment category (e.g., Written Homework = 20%, Midterms = 40%, Final = 25%). |
| FR-18 | The extension must use each course's **grade scale** (A = 93–100%, A- = 90–92%, etc.) when available, falling back to the default BYU scale. |

### 4.2 Assignment-Level What-If

| ID   | Requirement |
|------|-------------|
| FR-25 | Every assignment must have an **editable score field** for hypothetical grade entry (including already graded assignments, e.g. to model a regrade). |
| FR-26 | When a hypothetical score is entered, the extension must **immediately recalculate** the projected course grade (percentage + letter grade). |
| FR-27 | The projected GPA on the GPA planner must also update **in real time** as hypothetical scores change. |
| FR-28 | The user must be able to **reset all hypothetical scores** in a course back to actual grades with a single button. |
| FR-31 | Hypothetical scores must be visually distinct from real grades (same style as FR-44). |
| FR-48 | **Precedence:** a course-level projection (FR-42) overrides an assignment-level projection. When a course-level projection is set, the assignment tab shows that it is active and offers to clear it. Projected grade = course-level projection → else assignment-level projection → else current grade. |

---

## 5. Non-Functional Requirements

| ID    | Requirement |
|-------|-------------|
| NFR-01 | All user data must be stored **locally** in the browser — no external server or cloud database. |
| NFR-02 | The extension must not interfere with the normal operation of Canvas or Learning Suite pages. |
| NFR-03 | The extension must be compatible with **Chrome 120+**. |
| NFR-04 | The UI must work within the constraints of a browser extension popup (min 380px wide). |
| NFR-05 | All scraping and API calls must comply with BYU's terms of service and usage policies. |
| NFR-06 | The v1.0 storage schema must be extendable for v1.1 (adding assignment data and hypothetical scores) without migrating or discarding existing projections and credit hours. |

---

## 6. Later (Deferred Features)

Not planned for v1.0 or v1.1. The architecture should leave room for them, but they are not designed in detail yet.

**Grades & calculator**
- FR-07 — Manually **link** a Canvas course to a Learning Suite course that represent the same class (v1.0 workaround: hide the duplicate).
- FR-09 — Filter by semester/term.
- FR-13 — Sort assignments by due date, score, category, and status.
- FR-14 — Highlight upcoming (unsubmitted) assignments.
- FR-17 — Per-category grade breakdown (earned vs. possible points).
- FR-29 — **"Points needed" calculator**: given a target final grade, show the score needed on remaining assignments.
- FR-30 — **Scenario saving**: save multiple named what-if scenarios (e.g., "Optimistic", "Realistic").
- Exclude pass/fail or audit courses from the GPA without hiding them.
- Future-semester planning (e.g., "15 credits next semester at a 3.8").

**Notifications & reminders**
- FR-32 — Badge on the extension icon with the count of assignments due within 48 hours.
- FR-33 — Browser notifications for upcoming due dates (24 hours and 1 hour before).
- FR-34 — Notification preferences per course or globally.

**UI**
- Full-tab dashboard and a separate options page.
- Dark mode toggle.
- Charts (grade trends, GPA trajectory).

**Other**
- Export grades to CSV/PDF.
- Shared read-only "what-if" links.
- Firefox support.

**🤖 AI tools**
- **AI Study Chatbot** — A conversational assistant the user can talk to directly. Examples:
  - *"I have a midterm in 3 days, can you make me a study plan?"*
  - *"What topics should I focus on based on my weakest assignment scores?"*
  - *"How many hours a day do I need to study to get an A in this class?"*
- **Personalized Study Tips** — Based on grade trends and upcoming deadlines, surface proactive suggestions (e.g., *"Your average on Written Homework is 72% — here are some strategies to improve before the next one"*).
- **Study Plan Generator** — Given a list of upcoming assignments and exams, generate a day-by-day study schedule.

> [!NOTE]
> To make adding AI easy later, the codebase should be structured so that:
> - A dedicated `ai/` module can be dropped in without touching existing grade logic
> - Collected data (grades, and in v1.1 assignments, due dates, weights) is stored in a clean, typed format that can be passed directly to an AI model as context
> - AI features will need a small serverless proxy to hold the LLM API key (keys cannot be shipped inside an extension)

**Out of scope entirely**
- Mobile app version
- Integration with VitalSource or other third-party tools
- Automated submission of assignments
- Cloud sync or data sharing between users
- Integration with non-BYU institutions

---

## 7. Constraints

- **No public Learning Suite API**: Data must be obtained via DOM scraping through a content script injected on `learningsuite.byu.edu`.  
- **Canvas API**: BYU Canvas exposes the standard Instructure Canvas REST API, accessible with the user's logged-in session.  
- **BYU SSO**: Both platforms use BYU's Central Authentication Service — the extension relies on the user already being logged in.  
- **Credit hours are not provided by Canvas**: the user enters them manually (FR-22).
