import type { ExpenseCategory } from '@/types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'grocery',       label: 'Grocery',              emoji: '🛒' },
  { value: 'rent',          label: 'Rent',                 emoji: '🏠' },
  { value: 'electricity',   label: 'Electricity',          emoji: '⚡' },
  { value: 'water',         label: 'Water',                emoji: '💧' },
  { value: 'phone',         label: 'Phone',                emoji: '📱' },
  { value: 'entertainment', label: 'Entertainment',        emoji: '🎬' },
  { value: 'equipment',     label: 'Utensils / Equipment', emoji: '🔧' },
  { value: 'other',         label: 'Other',                emoji: '🏷️' },
];

/** O(1) lookup for a category's display label + emoji */
export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string }> =
  Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c.value, { label: c.label, emoji: c.emoji }])
  ) as Record<ExpenseCategory, { label: string; emoji: string }>;
