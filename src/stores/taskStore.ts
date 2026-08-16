import { create } from 'zustand';
import type { Task, FilterState } from '@/types';
import { TaskRepository } from '@/db/taskRepository';
import {
  scheduleNotification,
  cancelNotification,
  rescheduleNotification,
} from '@/utils/notificationScheduler';
import { useAuthStore } from './authStore';
import * as outbox from '@/sync/outbox';
import { flushOutbox } from '@/sync/syncEngine';

/** Best-effort: queue + push these task ids when signed in. Never blocks
 *  or throws — offline/guest just leaves the write local, as intended. */
function syncTasks(ids: string[], op: 'upsert' | 'delete') {
  if (useAuthStore.getState().mode !== 'account' || ids.length === 0) return;
  Promise.all(ids.map((id) => outbox.enqueue('task', id, op)))
    .then(() => flushOutbox())
    .catch(() => {});
}

type SeriesChanges = Partial<Omit<Task, 'id' | 'createdAt' | 'dueDate' | 'status' | 'completedAt' | 'recurringParentId'>>;

interface TaskState {
  // ── Data ──────────────────────────────────────────────────────────────
  tasks: Task[];
  overdueTasks: Task[];
  isLoading: boolean;
  error: string | null;

  // ── Filter (used by All view) ─────────────────────────────────────────
  filter: FilterState;

  // ── Actions ───────────────────────────────────────────────────────────
  loadAll: () => Promise<void>;
  loadToday: () => Promise<void>;
  loadUpcoming: () => Promise<void>;
  loadFiltered: () => Promise<void>;

  addTask: (partial: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<Task | undefined>;
  deleteTask: (id: string) => Promise<void>;
  stopRecurring: (id: string) => Promise<void>;
  updateTaskSeries: (id: string, changes: SeriesChanges) => Promise<void>;

  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
}

const DEFAULT_FILTER: FilterState = { tags: [], search: '', sortBy: 'createdAt', sortDir: 'desc' };

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  overdueTasks: [],
  isLoading: false,
  error: null,
  filter: DEFAULT_FILTER,

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await TaskRepository.getAll();
      set({ tasks, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await TaskRepository.getToday();
      set({ tasks, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadUpcoming: async () => {
    set({ isLoading: true, error: null });
    try {
      const [tasks, overdueTasks] = await Promise.all([
        TaskRepository.getUpcoming(),
        TaskRepository.getOverdue(),
      ]);
      set({ tasks, overdueTasks, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadFiltered: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await TaskRepository.getFiltered(get().filter);
      set({ tasks, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addTask: async (partial) => {
    const task = await TaskRepository.create(partial);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    scheduleNotification(task);
    syncTasks([task.id], 'upsert');
    return task;
  },

  updateTask: async (id, changes) => {
    await TaskRepository.update(id, changes);
    const now = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...changes, updatedAt: now } : t
      ),
    }));
    const updated = get().tasks.find((t) => t.id === id);
    if (updated) rescheduleNotification(updated);
    syncTasks([id], 'upsert');
  },

  completeTask: async (id) => {
    const now = new Date().toISOString();
    const { nextTask } = await TaskRepository.complete(id);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: 'done' as const, completedAt: now, updatedAt: now } : t
      ),
      overdueTasks: s.overdueTasks.map((t) =>
        t.id === id ? { ...t, status: 'done' as const, completedAt: now, updatedAt: now } : t
      ),
    }));
    cancelNotification(id);
    if (nextTask) scheduleNotification(nextTask);
    // Pushed via the same idempotent upsert path (POST /tasks/import) rather
    // than ever calling the server's own /complete — that endpoint spawns
    // its own next occurrence independently, which would double-spawn since
    // TaskRepository.complete() above already spawned one locally.
    syncTasks(nextTask ? [id, nextTask.id] : [id], 'upsert');
    return nextTask;
  },

  deleteTask: async (id) => {
    await TaskRepository.delete(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }));
    cancelNotification(id);
    syncTasks([id], 'delete');
  },

  stopRecurring: async (id) => {
    await TaskRepository.stopRecurring(id);
    const now = new Date().toISOString();
    const affected = new Set<string>();
    set((s) => {
      // Find the root parentId for this task
      const task     = s.tasks.find((t) => t.id === id) ?? s.overdueTasks.find((t) => t.id === id);
      const parentId = task ? (task.recurringParentId ?? id) : id;
      const patch    = (t: Task) => {
        if ((t.id !== id && t.recurringParentId !== parentId) || t.status === 'done') return t;
        affected.add(t.id);
        return { ...t, recurring: 'none' as const, updatedAt: now };
      };
      return { tasks: s.tasks.map(patch), overdueTasks: s.overdueTasks.map(patch) };
    });
    syncTasks([...affected], 'upsert');
  },

  updateTaskSeries: async (id, changes) => {
    await TaskRepository.updateSeries(id, changes);
    const now = new Date().toISOString();
    const affected = new Set<string>();
    set((s) => {
      const task     = s.tasks.find((t) => t.id === id) ?? s.overdueTasks.find((t) => t.id === id);
      const parentId = task ? (task.recurringParentId ?? id) : id;
      const patch    = (t: Task) => {
        if ((t.id !== id && t.recurringParentId !== parentId) || t.status === 'done') return t;
        affected.add(t.id);
        return { ...t, ...changes, updatedAt: now };
      };
      return { tasks: s.tasks.map(patch), overdueTasks: s.overdueTasks.map(patch) };
    });
    // Reschedule notifications for all affected in-memory tasks
    const { tasks } = get();
    const root = tasks.find((t) => t.id === id);
    if (root) {
      const parentId = root.recurringParentId ?? id;
      tasks
        .filter((t) => t.id === id || t.recurringParentId === parentId)
        .forEach(rescheduleNotification);
    }
    syncTasks([...affected], 'upsert');
  },

  setFilter: (partial) =>
    set((s) => ({ filter: { ...s.filter, ...partial } })),

  resetFilter: () => set({ filter: DEFAULT_FILTER }),
}));
