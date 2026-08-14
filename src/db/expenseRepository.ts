import { db } from './schema';
import type { Expense } from '@/types';
import { generateId } from '@/utils/generateId';

// ── ExpenseRepository ────────────────────────────────────────────────────
// All expense persistence goes through this module — mirrors TaskRepository.
// The UI layer never imports `db` directly.

/** date desc, then createdAt desc within the same date */
function byDateDesc(a: Expense, b: Expense): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

export const ExpenseRepository = {
  // ── Read ────────────────────────────────────────────────────────────────

  async getAll(): Promise<Expense[]> {
    const all = await db.expenses.toArray();
    return all.sort(byDateDesc);
  },

  async getById(id: string): Promise<Expense | undefined> {
    return db.expenses.get(id);
  },

  /** Count of expenses logged in the current calendar month */
  async getThisMonthCount(): Promise<number> {
    const prefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    return db.expenses.filter((e) => e.date.startsWith(prefix)).count();
  },

  // ── Write ───────────────────────────────────────────────────────────────

  async create(partial: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const now = new Date().toISOString();
    const expense: Expense = {
      ...partial,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.expenses.add(expense);
    return expense;
  },

  async update(id: string, changes: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
    await db.expenses.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.expenses.delete(id);
  },
};
