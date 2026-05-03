import { create } from 'zustand';
import type { ViewId } from '@/types';

interface UIState {
  activeView: ViewId;
  isQuickAddOpen: boolean;
  editingTaskId: string | null;

  setView: (view: ViewId) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openEditTask: (id: string) => void;
  closeEditTask: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'today',
  isQuickAddOpen: false,
  editingTaskId: null,

  setView: (view) => set({ activeView: view }),
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  openEditTask: (id) => set({ editingTaskId: id }),
  closeEditTask: () => set({ editingTaskId: null }),
}));
