import { create } from 'zustand';
import type { Task, FilterState } from '@/types';
import { TaskRepository } from '@/db/taskRepository';

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
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

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
    await TaskRepository.complete(id);
    const now = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: 'done', completedAt: now, updatedAt: now } : t
      ),
    }));
  },

  deleteTask: async (id) => {
    await TaskRepository.delete(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }));
  },

  setFilter: (partial) =>
    set((s) => ({ filter: { ...s.filter, ...partial } })),

  resetFilter: () => set({ filter: DEFAULT_FILTER }),
}));
