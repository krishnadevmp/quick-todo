import { apiFetch } from './client';
import type { Expense } from '@/types';

// ── Expenses API ──────────────────────────────────────────────────────────
// No bulk/import endpoint exists server-side, unlike tasks — creates always
// get a fresh server-assigned id (see src/sync/syncEngine.ts's rekey step).

export function list(): Promise<Expense[]> {
  return apiFetch('/expenses');
}

export function stats(): Promise<Record<string, unknown>> {
  return apiFetch('/expenses/stats');
}

export function thisMonthCount(): Promise<{ count: number }> {
  return apiFetch('/expenses/this-month-count');
}

export function getById(id: string): Promise<Expense> {
  return apiFetch(`/expenses/${id}`);
}

type ExpenseCreateBody = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export function create(body: ExpenseCreateBody): Promise<Expense> {
  return apiFetch('/expenses', { method: 'POST', body });
}

export function update(id: string, changes: Partial<Expense>): Promise<Expense> {
  return apiFetch(`/expenses/${id}`, { method: 'PATCH', body: changes });
}

export function remove(id: string): Promise<void> {
  return apiFetch(`/expenses/${id}`, { method: 'DELETE' });
}
