# Quick Todo — Development Plan

> Generated: 2026-05-03
> Stack: React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Dexie.js + vite-plugin-pwa

---

## Status Legend
- ✅ Done
- 🔄 In progress
- ⬜ Not started

---

## Phase 1 — Project Scaffold ✅
**Goal:** Working app shell that builds and runs with all layers wired up.

- [x] Vite + React 18 + TypeScript project setup
- [x] Tailwind CSS v4 (`@tailwindcss/vite`) with CSS custom property token system
- [x] Light/dark theme via `data-theme` attribute on `<html>`
- [x] `vite-plugin-pwa` — web manifest + Workbox service worker config
- [x] `@/` path alias in Vite + TypeScript
- [x] Core type definitions (`Task`, `Priority`, `Category`, `ReminderOffset`, `RecurringPattern`, `FilterState`, `AppSettings`)
- [x] Dexie.js schema with indexed fields (`status`, `priority`, `dueDate`, `*tags`, `recurringParentId`)
- [x] `TaskRepository` adapter pattern (UI never imports `db` directly — enables Supabase swap later)
- [x] `useTaskStore` — CRUD + view queries + filter state (Zustand)
- [x] `useUIStore` — active view, Quick Add open/close, edit task (Zustand)
- [x] `useSettingsStore` — theme, defaults, persisted to localStorage (Zustand + persist middleware)
- [x] `parseInput()` — inline shortcut parser (`#tag`, `!high/m/l`, `due:today/tomorrow/mon-sun/YYYY-MM-DD`, `@work`, `every:daily/weekdays/weekly/monthly`)
- [x] `formatDate()` + `isOverdue()` utilities
- [x] App shell: `Layout`, `Sidebar`, `Topbar` with theme toggle
- [x] `QuickAddOverlay` — full form, live shortcut parsing, keyboard shortcuts (Enter / Cmd+Enter / Escape)
- [x] Placeholder views for Today, Upcoming, All Tasks, Dashboard, Settings
- [x] Zero TypeScript errors, production build passes, PWA SW generated

---

## Phase 2 — Task Card + Today View ⬜
**Goal:** First real interaction — add a task and see it appear in Today view.

- [ ] `TaskCard` component
  - Priority bar (`::before` pseudo-element, never overwritten by hover)
  - Status toggle circle: todo → in-progress → done with tooltip
  - Category badge (neutral grey + emoji icon)
  - Due date chip (colour-coded: overdue = red, today = accent, future = grey)
  - Tag chips
  - Recurring indicator icon
  - Hover actions: Edit, Delete buttons
- [ ] `TodayView` wired to `useTaskStore.loadToday()`
- [ ] Empty state illustration for Today (no tasks due today)
- [ ] Task count badge in Sidebar next to "Today"
- [ ] Optimistic UI — task appears instantly on add, rolls back on error

---

## Phase 3 — Upcoming View ⬜
**Goal:** See what's coming in the next 7 days at a glance.

- [ ] `UpcomingView` wired to `useTaskStore.loadUpcoming()`
- [ ] Date section headers (Today / Tomorrow / day name / date)
- [ ] Collapsible day sections
- [ ] Empty state for upcoming
- [ ] Overdue section at the top (tasks past due, not done)

---

## Phase 4 — All Tasks View ⬜
**Goal:** Browse and filter the full task list.

- [ ] `AllView` wired to `useTaskStore.loadFiltered()`
- [ ] Filter bar component
  - Priority filter chips (All / High / Medium / Low)
  - Category filter chips (All / 💼 Work / 👤 Personal / 🚀 Project / 🔁 Routine)
  - Tag filter (multi-select dropdown of all used tags)
  - Search input (debounced, 300ms)
- [ ] Active filter count badge
- [ ] Clear all filters button
- [ ] Sort options (by created date / due date / priority)
- [ ] Empty state for filtered results ("No tasks match your filters")

---

## Phase 5 — Task Edit & Delete ⬜
**Goal:** Full task lifecycle — create, read, update, delete.

- [ ] Edit overlay (same layout as QuickAddOverlay, pre-filled with task data)
  - Opens from Task Card hover "Edit" button or tap on mobile
  - Saves changes via `useTaskStore.updateTask()`
- [ ] Delete confirmation — inline "Undo" toast (3s window before permanent delete)
- [ ] Keyboard shortcut: `E` to edit focused task, `Delete`/`Backspace` to delete
- [ ] Bulk select mode — checkbox on cards, "Complete selected" / "Delete selected" toolbar

---

## Phase 6 — Recurring Tasks Engine ⬜
**Goal:** Tasks that auto-regenerate on completion.

- [ ] On `completeTask()` — if `recurring !== 'none'`, auto-create the next occurrence
  - `daily`: next day
  - `weekdays`: skip to next Mon if completing on Fri
  - `weekly`: same weekday next week
  - `monthly`: same date next month
- [ ] `recurringParentId` links the chain of tasks
- [ ] Recurring badge/icon on task cards
- [ ] "Edit all in series" vs "Edit this only" choice on edit
- [ ] "Stop repeating" action on a recurring task

---

## Phase 7 — Push Notifications ⬜
**Goal:** Reminders that fire even when the app is closed.

- [ ] Notification permission request flow (Settings page, explain why)
- [ ] Service Worker notification scheduling
  - On task create/update with `reminderOffset !== 'none'` + `dueDate` set
  - Calculate fire time: `dueDate - reminderOffset minutes`
  - Use `setTimeout`-based scheduling for MVP (app open) + SW push for background
- [ ] Notification payload: task title, due time, deep-link to open the task
- [ ] Cancel notification when task is completed or deleted
- [ ] Reschedule on task edit (due date or reminder offset changed)

---

## Phase 8 — Dashboard View ⬜
**Goal:** At-a-glance productivity snapshot.

- [ ] Stats cards row: Total tasks / Completed today / Overdue / Completion rate %
- [ ] Priority breakdown bar chart (High / Medium / Low / None counts)
- [ ] Category breakdown (Work / Personal / Project / Routine — donut or bar)
- [ ] Weekly completion chart (last 7 days — tasks completed per day)
- [ ] Streak counter (consecutive days with at least 1 task completed)
- [ ] "Most productive day" insight
- [ ] All stats computed from `TaskRepository.getStats()`

---

## Phase 9 — Settings View ⬜
**Goal:** User-configurable defaults and preferences.

- [ ] Theme toggle (Dark / Light / System)
- [ ] Default priority for new tasks (dropdown)
- [ ] Default reminder offset for new tasks (dropdown)
- [ ] Show completed tasks in views (toggle)
- [ ] Notification permission status + "Enable / Disable" button
- [ ] "Clear all completed tasks" with confirmation
- [ ] "Export tasks" (JSON download)
- [ ] "Import tasks" (JSON upload, merge strategy)
- [ ] App version number display

---

## Phase 10 — Empty States & Feedback ⬜
**Goal:** The app feels alive and responsive at every state.

- [ ] Empty state illustrations for each view (SVG, themed)
  - Today: "Nothing due today — enjoy your day!"
  - Upcoming: "You're all caught up for the week."
  - All Tasks: "No tasks yet. Add your first one!"
  - Filtered: "No tasks match your filters."
- [ ] Toast notification system (bottom-right, auto-dismiss 3s)
  - Task added / completed / deleted / updated
  - Undo action on delete
- [ ] Loading skeletons for task list (3 placeholder cards while DB query runs)
- [ ] Error state (IndexedDB unavailable, storage quota exceeded)

---

## Phase 11 — Performance ⬜
**Goal:** Smooth at 500+ tasks, no jank.

- [ ] `@tanstack/react-virtual` row virtualisation in All Tasks view
- [ ] `useTaskStore` selectors — components only re-render when their slice changes
- [ ] Debounce search input (300ms)
- [ ] `useMemo` for filtered + sorted task arrays
- [ ] Lazy-load Dashboard and Settings views (code splitting via `React.lazy`)
- [ ] Measure and target: task list scroll at 60fps, Quick Add open < 100ms

---

## Phase 12 — Mobile Layout ⬜
**Goal:** Fully usable on a phone (PWA install on mobile).

- [ ] Sidebar collapses on mobile (< 768px), replaced by bottom tab bar
- [ ] Bottom nav: Today / Upcoming / All / + (Quick Add) / Dashboard
- [ ] Floating "+" FAB button on mobile
- [ ] Touch-friendly tap targets (min 44×44px)
- [ ] Swipe left on task card to reveal Delete, swipe right to complete
- [ ] Full-screen Quick Add sheet on mobile (slides up from bottom)
- [ ] Safe area insets for notched phones (`env(safe-area-inset-*)`)

---

## Phase 13 — PWA Polish ⬜
**Goal:** Installable, offline-capable, feels like a native app.

- [ ] App icon assets: `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `favicon.ico`
- [ ] Install prompt banner (shows after 30s of use, dismissible)
- [ ] Offline indicator banner ("You're offline — changes will sync when reconnected")
- [ ] Splash screen config (`background_color`, `theme_color` in manifest)
- [ ] `beforeinstallprompt` event captured, deferred, shown at right moment
- [ ] Share Target API — share a URL/text to app to create a task

---

## Phase 14 — Testing & Cleanup ⬜
**Goal:** Confidence to ship, no regressions.

- [ ] Unit tests for `parseInput()` — all shortcut combinations
- [ ] Unit tests for `TaskRepository` — CRUD operations (with fake IndexedDB)
- [ ] Unit tests for `formatDate()` utility
- [ ] Component smoke tests for `QuickAddOverlay` and `TaskCard`
- [ ] E2E test: add task → appears in Today view → mark complete → disappears
- [ ] Accessibility audit (keyboard navigation, screen reader labels, focus traps in overlays)
- [ ] Lighthouse audit (PWA score, Performance, Accessibility)
- [ ] Bundle size audit — keep JS < 400 KB gzipped
- [ ] Final `README.md` with setup instructions and feature overview
- [ ] Production deploy (Vercel or Netlify — static + PWA)

---

## Out of Scope (V2)
- Subtasks / task hierarchy
- Cloud sync (Supabase adapter ready to plug in)
- Collaboration / shared lists
- Drag-and-drop reorder
- Calendar integration (Google Calendar, Apple Calendar)
- Natural language date parsing ("next Friday", "in 3 days")
