# Quick Todo

A fast, offline-first PWA task manager built with React 19 and TypeScript. Features smart inline text parsing, recurring tasks, productivity stats, and a native install experience on both Android and iOS.

**Live:** [wonderful-tree-0fdeaa900.azurestaticapps.net](https://wonderful-tree-0fdeaa900.azurestaticapps.net)

---

## Features

### Smart Quick-Add
Type a task and inline shortcuts are parsed automatically — no forms, no clicks:

```
Buy groceries due:tomorrow !high #errands @personal every:week
```

| Shortcut | Values | Effect |
|---|---|---|
| `!high` / `!h` | `high`, `medium` / `m`, `low` / `l` | Priority |
| `#tag` | any word | Adds a tag (repeatable) |
| `@category` | `work`, `personal`, `project`, `routine` | Category |
| `due:` | `today`, `tomorrow`, `mon`–`sun`, `YYYY-MM-DD` | Due date |
| `every:` | `day`, `weekdays`, `week`, `month` | Recurring pattern |

### Recurring Tasks
Tasks marked with `every:` auto-generate the next occurrence when completed. Completion is wrapped in an IndexedDB transaction with an idempotency guard so double-taps never create duplicates.

### Productivity Dashboard
- 7-day completion chart
- Streak counter and most productive day
- Priority and category breakdowns
- Completion rate and overdue count

### Views
- **Today** — tasks due today with a progress bar
- **Upcoming** — future tasks in a timeline
- **All** — full task list with filter bar (priority, category, tags, search)
- **Dashboard** — productivity stats
- **Settings** — theme, defaults, notifications, data export/import

### PWA
- Installable on Android (Chrome install prompt) and iOS (Web Share API → "Add to Home Screen")
- Fully offline — all data lives in IndexedDB via Dexie.js
- Background sync via Workbox service worker
- Push notification reminders

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| State | Zustand 5 |
| Database | Dexie.js 4 (IndexedDB) |
| PWA | vite-plugin-pwa 1.3.0 + Workbox |
| Icons | lucide-react |
| Virtual list | @tanstack/react-virtual |
| Deployment | Azure Static Web Apps |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Requires Node.js 20+.

---

## Project Structure

```
src/
├── components/
│   ├── layout/       # Topbar, Sidebar, BottomNav, FAB
│   ├── pwa/          # InstallBanner (Android + iOS)
│   ├── quickadd/     # QuickAddOverlay + inline parser UI
│   ├── task/         # TaskCard, TaskList, EditTaskOverlay
│   ├── ui/           # Button, FilterBar, Toast, EmptyState, …
│   └── views/        # TodayView, AllView, DashboardView, SettingsView, …
├── db/
│   └── taskRepository.ts   # Dexie operations (CRUD, recurring, stats)
├── hooks/
│   ├── useInstallPrompt.ts  # beforeinstallprompt + iOS detection
│   └── useLocalStorage.ts   # SSR-safe generic localStorage hook
├── stores/           # Zustand slices (task, ui, settings)
├── types/            # Shared TypeScript types
└── utils/
    ├── parseInput.ts        # Smart inline shortcut parser
    ├── recurringUtils.ts    # Next-occurrence calculation
    └── notificationScheduler.ts
```

---

## Data Model

Tasks are stored in IndexedDB with the following shape:

```ts
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'none' | 'low' | 'medium' | 'high';
  category?: 'work' | 'personal' | 'project' | 'routine';
  tags: string[];
  dueDate?: string;           // ISO date YYYY-MM-DD
  recurring?: 'daily' | 'weekdays' | 'weekly' | 'monthly';
  recurringParentId?: string; // links occurrences back to root
  reminderOffset?: string;
  createdAt: string;
  completedAt?: string;
}
```

Export / import is available in Settings as a JSON file — useful for backups or migrating between devices.

---

## Deployment

The app is deployed to **Azure Static Web Apps** via GitHub Actions. Every push to `master` triggers a build and deploy.

Configuration: [`.github/workflows/azure-static-web-apps-wonderful-tree-0fdeaa900.yml`](.github/workflows/azure-static-web-apps-wonderful-tree-0fdeaa900.yml)
