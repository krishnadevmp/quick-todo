import { create } from 'zustand';
import type { Task, FilterState } from '@/types';
import { TaskRepository } from '@/db/taskRepository';

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
    return task;
  },

  updateTask: async (id, changes) => {
    await TaskRepository.update(id, changes);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
      ),
    }));
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
    return nextTask;
  },

  deleteTask: async (id) => {
    await TaskRepository.delete(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }));
  },

  stopRecurring: async (id) => {
    await TaskRepository.stopRecurring(id);
    const now = new Date().toISOString();
    set((s) => {
      // Find the root parentId for this task
      const task     = s.tasks.find((t) => t.id === id) ?? s.overdueTasks.find((t) => t.id === id);
      const parentId = task ? (task.recurringParentId ?? id) : id;
      const patch    = (t: Task) =>
        (t.id === id || t.recurringParentId === parentId) && t.status !== 'done'
          ? { ...t, recurring: 'none' as const, updatedAt: now }
          : t;
      return { tasks: s.tasks.map(patch), overdueTasks: s.overdueTasks.map(patch) };
    });
  },

  updateTaskSeries: async (id, changes) => {
    await TaskRepository.updateSeries(id, changes);
    const now = new Date().toISOString();
    set((s) => {
      const task     = s.tasks.find((t) => t.id === id) ?? s.overdueTasks.find((t) => t.id === id);
      const parentId = task ? (task.recurringParentId ?? id) : id;
      const patch    = (t: Task) =>
        (t.id === id || t.recurringParentId === parentId) && t.status !== 'done'
          ? { ...t, ...changes, updatedAt: now }
          : t;
      return { tasks: s.tasks.map(patch), overdueTasks: s.overdueTasks.map(patch) };
    });
  },

  setFilter: (partial) =>
    set((s) => ({ filter: { ...s.filter, ...partial } })),

  resetFilter: () => set({ filter: DEFAULT_FILTER }),
}));
