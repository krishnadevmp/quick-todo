import { create } from 'zustand';
import type { ViewId, Task, Expense } from '@/types';

interface UIState {
  activeView: ViewId;
  isQuickAddOpen: boolean;
  editingTask: Task | null;
  isAddExpenseOpen: boolean;
  editingExpense: Expense | null;

  setView: (view: ViewId) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openEditTask: (task: Task) => void;
  closeEditTask: () => void;
  openAddExpense: () => void;
  closeAddExpense: () => void;
  openEditExpense: (expense: Expense) => void;
  closeEditExpense: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'today',
  isQuickAddOpen: false,
  editingTask: null,
  isAddExpenseOpen: false,
  editingExpense: null,

  setView: (view) => set({ activeView: view }),
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  openEditTask: (task) => set({ editingTask: task }),
  closeEditTask: () => set({ editingTask: null }),
  openAddExpense: () => set({ isAddExpenseOpen: true }),
  closeAddExpense: () => set({ isAddExpenseOpen: false }),
  openEditExpense: (expense) => set({ editingExpense: expense }),
  closeEditExpense: () => set({ editingExpense: null }),
}));
