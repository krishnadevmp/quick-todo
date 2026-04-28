# Quick Todo App — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-04-28  
**Status:** Draft  

---

## 1. Overview

### 1.1 Product Vision
A fast, frictionless, cross-device task management app that lets you capture any thought — work task, personal errand, project step, or routine — the instant it comes to mind, without breaking your flow.

### 1.2 Problem Statement
Current tools (sticky notes, phone reminders) are fragmented, slow to open, and lack a unified view. Critical tasks slip through because there's no single, always-ready place to capture them and track their status.

### 1.3 Design Philosophy
- **Zero friction first** — Adding a task should take under 5 seconds
- **Visual clarity** — You should understand everything at a glance
- **Progressive disclosure** — Simple by default, powerful when needed
- **Offline-first** — Always works, regardless of connectivity

---

## 2. User Persona

**Krishna (Primary User)**
- Solo user managing tasks across work, personal projects, and daily routines
- Switches between desktop (work) and mobile (on the go)
- Frustrated by fragmented tools — sticky notes are forgotten, phone reminders lack context
- Needs instant capture with just enough structure to stay organized
- Values a clean, dark-mode-capable interface that is intuitive without a learning curve

---

## 3. Platform & Architecture

### 3.1 Platform
**Progressive Web App (PWA)**
- Runs in any browser (Chrome, Safari, Firefox, Edge)
- Installable on desktop (Windows/Mac) and mobile (iOS/Android) — appears as a native app
- Offline-first: fully functional without internet
- Push notifications via Web Push API

### 3.2 Storage Strategy
| Phase | Storage | Notes |
|-------|---------|-------|
| MVP | Browser IndexedDB (via Dexie.js) | Fast, persistent, offline, large capacity |
| V2 | + Cloud sync (Supabase / Firebase) | Opt-in, real-time cross-device sync |

**Architecture must be storage-agnostic from day one.** A repository/adapter pattern will isolate the storage layer so swapping or layering cloud sync requires no UI changes.

### 3.3 Tech Stack (Recommended)
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | React 18 + TypeScript | Component model, strong ecosystem, type safety |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, dark mode baked in, accessible components |
| State | Zustand | Lightweight, minimal boilerplate |
| Local DB | Dexie.js (IndexedDB wrapper) | Reactive queries, excellent DX, large storage |
| Notifications | Web Push API + Service Worker | Native-feel push alerts on mobile and desktop |
| Recurring | Custom scheduler in Service Worker | Checks due/recurring tasks in background |
| Build | Vite | Fast HMR, PWA plugin available |
| Testing | Vitest + React Testing Library | Co-located with Vite |

---

## 4. Core Features

---

### 4.1 Quick Capture (P0 — Must Have)

The single most critical flow. Task entry must be reachable in one action from anywhere in the app.

#### 4.1.1 Quick Add Bar
- A persistent, prominent input bar on the home screen (always visible, auto-focused on load)
- Press **Enter** to save the task instantly
- Supports **inline shortcuts** typed directly into the input:

| Shortcut | Example | Effect |
|----------|---------|--------|
| `#tag` | `#work` | Assigns category |
| `!priority` | `!high` | Sets priority |
| `due:date` | `due:tomorrow`, `due:fri`, `due:2026-05-01` | Sets due date |
| `every:pattern` | `every:day`, `every:week`, `every:mon` | Makes task recurring |

**Example input:**
```
Submit project report #work !high due:tomorrow
```
This creates a High priority Work task due tomorrow — in one line, no extra clicks.

#### 4.1.2 Global Keyboard Shortcut
- Press **N** anywhere in the app to open a Quick Add overlay
- Overlay floats above any screen (no navigation required)
- Esc to dismiss without saving

#### 4.1.3 Floating Action Button (Mobile)
- Bottom-right FAB (+ button) opens the Quick Add sheet on mobile
- Sheet slides up from the bottom (thumb-friendly)

#### 4.1.4 Natural Language Date Parsing
The due date field should understand plain English:
- `today`, `tomorrow`, `yesterday`
- `monday`, `next friday`, `this weekend`
- `in 3 days`, `in 2 weeks`
- `2026-05-15` (ISO format fallback)

---

### 4.2 Task Properties

Each task has the following fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | Auto | Generated on creation |
| `title` | string | Yes | The task text |
| `category` | enum | No | Work, Personal, Project, Routine |
| `priority` | enum | No | High, Medium, Low (default: None) |
| `status` | enum | Auto | Todo, In Progress, Done |
| `dueDate` | datetime | No | Optional deadline |
| `reminder` | datetime | No | When to send push notification |
| `recurrence` | object | No | See section 4.5 |
| `notes` | string | No | Optional short description |
| `createdAt` | datetime | Auto | Creation timestamp |
| `completedAt` | datetime | Auto | Set when marked Done |
| `archivedAt` | datetime | Auto | Set when archived |

---

### 4.3 Task Organization

#### 4.3.1 Categories
Four built-in categories, color-coded and icon-tagged:

| Category | Color | Icon | Use Case |
|----------|-------|------|----------|
| Work | Blue | Briefcase | Office tasks, meetings, deadlines |
| Personal | Green | Person | Errands, health, life admin |
| Project | Purple | Rocket | Side projects, goals |
| Routine | Orange | Repeat | Daily/weekly habits, recurring chores |

- User can filter the task list by one or more categories
- Category shown as a color badge on each task card

#### 4.3.2 Priority Levels
| Level | Visual | Indicator |
|-------|--------|-----------|
| High | Red dot / border | Shown at top of list |
| Medium | Yellow dot | Default for explicit !medium |
| Low | Gray dot | De-emphasized in list |
| None | — | No indicator |

#### 4.3.3 Status Flow
```
Todo  ──►  In Progress  ──►  Done  ──►  (Archived after 7 days)
  ▲              │
  └──────────────┘  (can move back)
```
- Single click on the status badge cycles forward
- Done tasks can be reactivated (moved back to Todo)
- Completed tasks auto-archive after 7 days (configurable in settings)

---

### 4.4 Task List Views

#### 4.4.1 Main View (Home)
- Default view: All active tasks, sorted by: **Overdue → High Priority → Due Today → Due Soon → No Date**
- Each task card shows: title, category badge, priority dot, due date chip, status toggle
- Swipe left on mobile to reveal quick-action buttons (Complete, Delete)
- Click a task to open the detail panel (inline expand, no page navigation)

#### 4.4.2 View Filters (Tabs or Sidebar)
- **All** — Everything active
- **Today** — Due today + overdue
- **Upcoming** — Due in the next 7 days
- **By Category** — Work / Personal / Project / Routine
- **Done** — Completed tasks (with date)

#### 4.4.3 Search
- Global search bar (Ctrl+K / Cmd+K) that searches task titles and notes
- Results appear instantly as you type (no submit needed)
- Highlights matching text in results

#### 4.4.4 Sorting Options
User can sort the active list by:
- Smart (default — priority + due date combined)
- Due date (earliest first)
- Priority (High → Low)
- Creation date (newest first)
- Alphabetical

---

### 4.5 Recurring Tasks

#### 4.5.1 Recurrence Patterns
| Pattern | Example Input | Schedule |
|---------|--------------|----------|
| Daily | `every:day` | Repeats every day at the same time |
| Weekdays | `every:weekday` | Mon–Fri only |
| Weekly | `every:week` | Same day each week |
| Specific days | `every:mon,wed,fri` | Selected days each week |
| Monthly | `every:month` | Same date each month |
| Custom | `every:2weeks` | Every N days/weeks/months |

#### 4.5.2 Recurrence Behavior
- When a recurring task is marked **Done**, a new instance is automatically created for the next occurrence
- The original record is archived (not deleted), preserving completion history
- Recurring tasks are visually tagged with a repeat icon
- User can **stop recurrence** without deleting history
- User can **skip one occurrence** (e.g., skip this week's Monday task without stopping the pattern)

---

### 4.6 Reminders & Notifications

#### 4.6.1 Reminder Types
| Trigger | Description |
|---------|-------------|
| At due time | Notification fires exactly at the due date/time |
| Before due | User sets offset: 15 min, 30 min, 1 hr, 1 day before |
| Custom time | User picks a specific date/time for the reminder |
| Daily digest | Optional: 8 AM summary of today's tasks |

#### 4.6.2 Notification Behavior
- Uses **Web Push API** via a Service Worker (works even when the browser tab is closed)
- Notification includes: task title, category, due time
- Tapping the notification opens the app directly to that task
- User must grant browser notification permission on first use (onboarding prompts this clearly)
- All reminders stored locally; no server required in MVP

#### 4.6.3 Notification Settings
- Toggle all notifications on/off globally
- Toggle per-category (e.g., mute Routine, keep Work)
- Set quiet hours (e.g., no notifications 10 PM–8 AM)
- Daily digest time (default: 8:00 AM)

---

### 4.7 Progress Dashboard

A dedicated screen giving a bird's-eye view of productivity.

#### 4.7.1 Summary Cards (Top of Dashboard)
- **Total Active** — Tasks not yet done
- **Due Today** — Tasks with today's due date
- **Overdue** — Past due, not completed
- **Completed This Week** — Rolling 7-day count

#### 4.7.2 Completion Chart
- Bar chart: tasks completed per day for the last 14 days
- Color-coded bars by category
- Hover/tap a bar to see the task breakdown for that day

#### 4.7.3 Category Breakdown
- Donut chart showing active task distribution across categories
- Clicking a segment filters the task list to that category

#### 4.7.4 Streak Tracker
- "You've completed at least one task for X days in a row"
- Motivational, not gamified — just a simple counter

---

## 5. User Interface Requirements

### 5.1 Design Principles
1. **One-thumb friendly** — All primary actions reachable without stretching on mobile
2. **Glanceable** — Status, priority, and due date visible without tapping into a task
3. **Consistent feedback** — Every action has immediate visual confirmation (toast, animation, color change)
4. **No dead ends** — Every screen has an obvious next action

### 5.2 Theme
- **Dark mode and Light mode** — user toggleable, respects OS preference on first load
- Color palette: neutral backgrounds, vibrant category colors, clear typography hierarchy
- Minimum contrast ratio: WCAG AA (4.5:1) for all text

### 5.3 Responsive Layout

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, bottom nav bar, FAB for add |
| Tablet (640–1024px) | Two-pane: task list + detail side-by-side |
| Desktop (> 1024px) | Three-pane: sidebar nav + task list + detail panel |

### 5.4 Navigation Structure
```
Bottom Nav (mobile) / Sidebar (desktop)
├── Home (All Tasks)
├── Today
├── Upcoming
├── Dashboard
└── Settings
```

### 5.5 Key Interactions
| Action | Mobile | Desktop |
|--------|--------|---------|
| Add task | FAB (+) or top bar | `N` key or top bar |
| Complete task | Swipe right or tap circle | Click circle or `Space` |
| Delete task | Swipe left → Delete | Hover → Delete icon or `Del` key |
| Search | Tap search icon | `Ctrl+K` / `Cmd+K` |
| Open task detail | Tap card | Click card |
| Change status | Tap status badge | Click status badge |

### 5.6 Empty States
Each empty state should:
- Display a friendly illustration (not a generic "nothing here" message)
- Suggest the next action (e.g., "No tasks for today — add one with the + button")
- Never leave the user stranded

---

## 6. Settings

| Setting | Options | Default |
|---------|---------|---------|
| Theme | Light / Dark / System | System |
| Default category | Work / Personal / Project / Routine / None | None |
| Default priority | High / Medium / Low / None | None |
| Auto-archive completed tasks | Off / After 1 day / 3 days / 7 days / 30 days | 7 days |
| Daily digest | On/Off + time picker | Off |
| Quiet hours | On/Off + start/end time | Off |
| Notification permission | Prompt / Granted / Denied (status display) | — |
| Data export | Export all tasks as JSON | — |
| Clear all data | Destructive action with confirmation | — |

---

## 7. Non-Functional Requirements

### 7.1 Performance
- App loads (first meaningful paint) in **< 2 seconds** on a mid-range mobile device
- Task addition round-trip (tap → saved) in **< 100ms** (local storage, no network)
- Task list renders **500+ tasks** without noticeable lag (virtualized list)
- Search results update in **< 50ms** as the user types

### 7.2 Reliability
- Fully functional with no internet connection
- No data loss on browser crash (IndexedDB is transactional)
- Service Worker keeps notifications firing even when app is closed

### 7.3 Scalability (Future-Proofing)
- Storage layer behind a repository interface — swap IndexedDB for an API call by changing one adapter
- Auth-ready data model — all tasks have a `userId` field (set to `local` in MVP) ready for multi-user cloud sync
- Schema versioning in IndexedDB to support non-breaking migrations

### 7.4 Accessibility
- Keyboard navigable throughout
- Screen reader compatible (ARIA labels, roles, live regions for dynamic updates)
- Focus management in modals and overlays
- No color as the only differentiator (icons + labels alongside colors)

### 7.5 Security & Privacy
- All data stored locally in the browser — no data leaves the device in MVP
- No analytics, no tracking in MVP
- No external API calls except Web Push subscription (which uses no personal data)
- Export data gives the user full ownership

---

## 8. User Stories

### Epic 1: Quick Capture
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| UC-01 | As a user, I want to add a task by typing and pressing Enter so I don't lose my thought | Task appears in the list immediately; input clears and refocuses |
| UC-02 | As a user, I want to add tags/priority inline while typing so I don't need extra clicks | `#work !high due:tomorrow` parsed and applied on save |
| UC-03 | As a user, I want a keyboard shortcut to open the quick-add anywhere so I don't need to navigate | `N` key opens overlay from any screen |
| UC-04 | As a mobile user, I want a FAB to add tasks so it's always one tap away | FAB visible on all screens; opens Quick Add sheet |

### Epic 2: Task Management
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| UC-05 | As a user, I want to mark a task done with one action so completion is effortless | Clicking the circle marks it done; task moves to Done state with animation |
| UC-06 | As a user, I want to edit any task so I can correct mistakes | Clicking a task opens detail; changes saved on blur or Enter |
| UC-07 | As a user, I want to delete tasks so my list stays clean | Delete action requires one confirmation swipe/click; no extra modal |
| UC-08 | As a user, I want to see overdue tasks highlighted so I notice them immediately | Overdue tasks show red date chip and appear at top of list |

### Epic 3: Recurring Tasks
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| UC-09 | As a user, I want to set a task to repeat so I don't re-create it manually | `every:day` in input or selector in detail sets recurrence |
| UC-10 | As a user, I want the next instance created automatically when I complete a recurring task | On completion, new instance created at next occurrence; history preserved |
| UC-11 | As a user, I want to skip one occurrence without stopping the recurrence | "Skip this one" option in detail; next instance still created |

### Epic 4: Reminders
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| UC-12 | As a user, I want a push notification for tasks so I don't forget them | Notification fires at set time; works with browser closed |
| UC-13 | As a user, I want a daily digest of today's tasks so I start with a plan | Optional 8 AM notification listing today's tasks |
| UC-14 | As a user, I want quiet hours so I'm not disturbed at night | No notifications during configured quiet hours |

### Epic 5: Dashboard
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| UC-15 | As a user, I want to see summary counts so I know my workload at a glance | Cards show: active, due today, overdue, completed this week |
| UC-16 | As a user, I want a completion chart so I can see my productivity trend | Bar chart shows last 14 days of completions |

---

## 9. Out of Scope (MVP)

The following are deliberately excluded from the first release:

- Subtasks / checklists (planned V2)
- Cloud sync / multi-device real-time sync (planned V2)
- Collaboration / shared lists (planned V3)
- File/image attachments
- Third-party integrations (Google Calendar, Slack, Notion)
- AI-powered task suggestions
- Time tracking
- Comments or activity log on tasks

---

## 10. Release Phasing

### Phase 1 — MVP (Core Loop)
**Goal:** The app is usable as a daily driver.
- Quick add bar with inline shortcuts
- Task list with category, priority, status, due date
- Today / Upcoming / All views
- Recurring tasks
- Push notifications + reminders
- Dark mode
- PWA install (works on mobile + desktop)

### Phase 2 — Polish & Persistence
**Goal:** Feels complete; data is safe across devices.
- Dashboard with charts
- Search (Ctrl+K)
- Cloud sync (Supabase or Firebase, opt-in)
- Settings page (quiet hours, digest, auto-archive)
- Onboarding flow for new users

### Phase 3 — Power Features
**Goal:** Handles complex needs without losing simplicity.
- Subtasks / checklists
- Labels (user-defined, beyond 4 categories)
- Google Calendar integration
- Bulk actions (multi-select, bulk complete/delete)
- Data export (JSON / CSV)

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Time to add first task (new user) | < 30 seconds from install |
| Time to add a task (returning user) | < 5 seconds |
| Tasks captured vs. missed | User subjectively reports fewer missed tasks |
| Daily active use | Used at least once per day on weekdays |
| Notification opt-in rate | > 70% of users enable notifications |

---

## 12. Open Questions / Decisions Pending

| # | Question | Options | Notes |
|---|----------|---------|-------|
| OQ-1 | Cloud sync provider for V2? | Supabase vs Firebase vs self-hosted | Supabase preferred (open-source, SQL) |
| OQ-2 | Should categories be user-editable in MVP? | Fixed 4 vs. user-customizable | Fixed 4 simplifies MVP; custom in V2 |
| OQ-3 | Onboarding flow — interactive tour or static? | Tooltip tour vs. example tasks pre-loaded | Pre-loaded example tasks is lower friction |
| OQ-4 | Task sort within a priority group — manual drag? | Drag-and-drop vs. auto sort only | Auto-sort MVP; drag in V2 |

---

*End of Requirements Document v1.0*
