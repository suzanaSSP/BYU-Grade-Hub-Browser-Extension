# Requirements — BYU Grade Hub Browser Extension

> **Version**: 1.0 — Draft  
> **Date**: July 2026  
> **Author**: Suzana Pinheiro  

---

## 1. Overview

BYU Grade Hub is a browser extension for Google Chrome that connects **BYU Canvas** and **BYU Learning Suite** into a unified, real-time grade dashboard. Its core feature is an interactive **grade calculator** that lets students model hypothetical future scores and see their projected impact on the final course grade and cumulative GPA.

---

## 2. Target Users

- BYU students enrolled in courses managed on either **Canvas** or **Learning Suite** (or both simultaneously).
- Students who want a single view of all assignments across platforms.
- Students who want to simulate grade scenarios ("What if I get an 80% on the final?").

---

## 3. Functional Requirements

### 3.1 Authentication & Data Access

| ID   | Requirement |
|------|-------------|
| FR-01 | The extension must authenticate with the **BYU Canvas REST API** using the user's existing browser session. On the first visit to Canvas, the auth token must be **extracted and stored locally** so the extension can make Canvas API calls in the background without requiring Canvas to be open. |
| FR-02 | The extension must scrape or use the **BYU Learning Suite** session to pull grade and assignment data, since Learning Suite does not provide a public REST API. |
| FR-03 | Sessions should be persisted locally in the extension's storage so the user does not need to re-authenticate on every browser restart. |
| FR-04 | The extension must gracefully handle expired sessions and prompt the user to refresh by visiting the respective platform. |

---

### 3.2 Course Aggregation

| ID   | Requirement |
|------|-------------|
| FR-05 | The extension must detect and list **all active courses** from both Canvas and Learning Suite. |
| FR-06 | Courses from both platforms must be displayed in a **single unified course list**, with a visual tag indicating the source platform (Canvas / Learning Suite). |
| FR-07 | The user must be able to **manually link** a Canvas course to a Learning Suite course if they represent the same class. |
| FR-08 | The user must be able to **hide** specific courses from the dashboard. |
| FR-09 | The extension should support filtering by semester/term. |
| FR-10| Only focuses on currect semester classes and does not include past or future semesters

---

### 3.3 Assignment Display

| ID   | Requirement |
|------|-------------|
| FR-10 | For each course, the extension must display all assignments grouped by **category/weight group** (e.g., Homework, Midterms, Final). |
| FR-11 | Each assignment must display: title, due date, score earned, maximum score, percentage contribution to the final grade, and submission status. |
| FR-12 | Dropped assignments must be visually distinguished (e.g., strikethrough, muted color). |
| FR-13 | Assignments must be sortable by: due date, score, category, and status (submitted/unsubmitted). |
| FR-14 | Upcoming (unsubmitted) assignments must be visually highlighted. |
| FR-15 | The extension must display the **weight percentage** of each assignment category (e.g., Written Homework = 20%, Midterms = 40%, Final = 25%). |

---

### 3.4 Grade Display

| ID   | Requirement |
|------|-------------|
| FR-16 | The extension must show the **current computed grade** for each course (letter grade + percentage). |
| FR-17 | The current grade must be broken down **per category**, showing earned vs. possible points within each weight group. |
| FR-18 | The extension must display the **grade scale** for each course (A = 93–100%, A- = 90–92%, etc.). |
| FR-19 | The extension must display a **summary dashboard** showing the current grade and letter grade for all enrolled courses in one place. |
| FR-20 | Grades from Canvas and Learning Suite should be normalized to the same display format. |

---

### 3.5 GPA Tracker

| ID   | Requirement |
|------|-------------|
| FR-21 | The extension must display the user's **current cumulative GPA** based on current course grades (using the BYU 4.0 scale). |
| FR-22 | The GPA calculation must allow the user to input **credit hours** per course. |
| FR-23 | The GPA display must show both **semester GPA** and **cumulative GPA** (cumulative may require manual input of historical data). |
| FR-24 | The user must be able to input their **previous cumulative GPA and total credits earned** to enable a blended overall GPA calculation. |

---

### 3.6 Grade Calculator ("What If" Mode)

| ID   | Requirement |
|------|-------------|
| FR-25 | Every unsubmitted or future assignment must have an **editable score field** for hypothetical grade entry. |
| FR-26 | When a hypothetical score is entered, the extension must **immediately recalculate** the projected course final grade (percentage + letter grade). |
| FR-27 | The projected GPA must also update **in real time** as hypothetical scores are changed. |
| FR-28 | The user must be able to **reset all hypothetical entries** back to actual grades with a single button. |
| FR-29 | The extension must display a **"Points needed" calculator**: given a target final grade, show how many points are needed on remaining assignments. |
| FR-30 | The extension must support **scenario saving**: save multiple "what-if" scenarios (e.g., "Optimistic", "Realistic", "Minimum passing"). |
| FR-31 | Hypothetical changes must be visually distinct from real grades (different color or edit icon). |

---

### 3.7 Notifications & Reminders

| ID   | Requirement |
|------|-------------|
| FR-32 | The extension must show a **badge on the extension icon** with the count of assignments due within the next 48 hours. |
| FR-33 | The extension must support optional **browser notifications** for upcoming due dates (24 hours and 1 hour before). |
| FR-34 | The user must be able to configure notification preferences per course or globally. |

---

### 3.8 Data Sync

| ID   | Requirement |
|------|-------------|
| FR-35 | **Canvas** grade and assignment data must be **refreshed automatically in the background once daily** using the stored auth token — no Canvas tab needs to be open. |
| FR-36 | **Learning Suite** data is refreshed automatically whenever the user visits any page on `learningsuite.byu.edu`. No background scraping is performed. |
| FR-37 | The dashboard must display a **"Open Learning Suite"** quick-link button that navigates directly to the LS gradebook page, making it easy to trigger a sync. |
| FR-38 | The user must be able to **manually trigger a Canvas sync** from the extension popup or dashboard at any time. |
| FR-39 | The **last sync time** for each platform must be displayed separately in the UI (e.g., "Canvas: 5 min ago", "Learning Suite: 2 hours ago"). |
| FR-40 | Data must be **cached locally** so the extension works offline with the last known data for both platforms. |

---

## 4. Non-Functional Requirements

| ID    | Requirement |
|-------|-------------|
| NFR-01 | All user data must be stored **locally** in the browser — no external server or cloud database. |
| NFR-02 | The extension must not interfere with the normal operation of Canvas or Learning Suite pages. |
| NFR-03 | The extension must be compatible with **Chrome 120+**. |
| NFR-04 | The UI must be **fully responsive** within the constraints of a browser extension popup (min 380px wide). |
| NFR-05 | All scraping and API calls must comply with BYU's terms of service and usage policies. |

---

## 5. Out of Scope (v1.0)

- Mobile app version  
- Integration with VitalSource or other third-party tools  
- Automated submission of assignments  
- Cloud sync or data sharing between users  
- Integration with non-BYU institutions  

---

## 5.1 Future Features (Post v1.0)

These features are not in scope for the initial release, but the architecture should leave room for them to be added later without major refactoring.

### 🤖 AI Tools

- **AI Study Chatbot** — A conversational assistant embedded in the dashboard that the user can talk to directly. Examples of what it should be able to do:
  - *"I have a midterm in 3 days, can you make me a study plan?"*
  - *"What topics should I focus on based on my weakest assignment scores?"*
  - *"How many hours a day do I need to study to get an A in this class?"*
- **Personalized Study Tips** — Based on grade trends and upcoming deadlines, surface proactive suggestions without the user needing to ask (e.g., *"Your average on Written Homework is 72% — here are some strategies to improve before the next one"*).
- **Study Plan Generator** — Given a list of upcoming assignments and exams, generate a day-by-day study schedule.

> [!NOTE]
> To make adding AI easy later, the codebase should be structured so that:
> - A dedicated `ai/` module can be dropped in without touching existing grade logic
> - The data already collected (assignments, grades, due dates, weights) is accessible in a clean, structured format that can be passed directly to an AI model as context
> - The dashboard UI reserves a collapsible panel or sidebar slot where the chatbot can live

---

## 6. Constraints

- **No public Learning Suite API**: Data must be obtained via DOM scraping through a content script injected on `learningsuite.byu.edu`.  
- **Canvas API**: BYU Canvas exposes the standard Instructure Canvas REST API, accessible via authenticated session tokens.  
- **BYU SSO**: Both platforms use BYU's Central Authentication Service — the extension relies on the user already being logged in.  
