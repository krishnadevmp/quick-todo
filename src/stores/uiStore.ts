import { create } from 'zustand';
import type { ViewId, Task } from '@/types';

interface UIState {
  activeView: ViewId;
  isQuickAddOpen: boolean;
  editingTask: Task | null;

  setView: (view: ViewId) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openEditTask: (task: Task) => void;
  closeEditTask: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'today',
  isQuickAddOpen: false,
  editingTask: null,

  setView: (view) => set({ activeView: view }),
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  openEditTask: (task) => set({ editingTask: task }),
  closeEditTask: () => set({ editingTask: null }),
}));
