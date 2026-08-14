import { create } from 'zustand';
import type { Expense } from '@/types';
import { ExpenseRepository } from '@/db/expenseRepository';

/** date desc, then createdAt desc within the same date — matches ExpenseRepository.getAll */
function byDateDesc(a: Expense, b: Expense): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;

  loadAll: () => Promise<void>;
  addExpense: (partial: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, changes: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  isLoading: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await ExpenseRepository.getAll();
      set({ expenses, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addExpense: async (partial) => {
    const expense = await ExpenseRepository.create(partial);
    set((s) => ({ expenses: [...s.expenses, expense].sort(byDateDesc) }));
    return expense;
  },

  updateExpense: async (id, changes) => {
    await ExpenseRepository.update(id, changes);
    const now = new Date().toISOString();
    set((s) => ({
      expenses: s.expenses
        .map((e) => (e.id === id ? { ...e, ...changes, updatedAt: now } : e))
        .sort(byDateDesc),
    }));
  },

  deleteExpense: async (id) => {
    await ExpenseRepository.delete(id);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },
}));
