import { useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { useExpenseStore } from '@/stores/expenseStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import ExpenseDaySection from '@/components/expense/ExpenseDaySection';
import ExpenseList from '@/components/expense/ExpenseList';
import EmptyState from '@/components/ui/EmptyState';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { Section, StatCard, BarRow, InsightCard } from '@/components/ui/StatPrimitives';
import { card } from '@/components/ui/statStyles';
import { formatCurrency } from '@/utils/formatCurrency';
import { EXPENSE_CATEGORY_META } from '@/utils/expenseCategories';
import type { Expense } from '@/types';

// ── Date helpers ──────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function sectionLabel(dateStr: string): { label: string; sublabel: string } {
  const full = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  if (dateStr === todayStr())     return { label: 'Today',     sublabel: full };
  if (dateStr === yesterdayStr()) return { label: 'Yesterday', sublabel: full };

  const weekday = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  return { label: weekday, sublabel: full };
}

function groupByDate(expenses: Expense[]): Map<string, Expense[]> {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return map;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ExpensesView() {
  const { expenses, isLoading, loadAll } = useExpenseStore();
  const openAddExpense = useUIStore((s) => s.openAddExpense);
  const currency        = useSettingsStore((s) => s.currency);

  useEffect(() => { loadAll(); }, [loadAll]);

  const monthPrefix = todayStr().slice(0, 7); // YYYY-MM

  const thisMonthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(monthPrefix)),
    [expenses, monthPrefix]
  );

  const totalThisMonth = useMemo(
    () => thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [thisMonthExpenses]
  );

  const totalToday = useMemo(
    () => expenses.filter((e) => e.date === todayStr()).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { label: string; emoji: string; amount: number }>();
    for (const e of thisMonthExpenses) {
      const meta  = EXPENSE_CATEGORY_META[e.category];
      const label = e.category === 'other' ? (e.customCategory?.trim() || 'Other') : meta.label;
      const existing = map.get(label);
      if (existing) existing.amount += e.amount;
      else map.set(label, { label, emoji: meta.emoji, amount: e.amount });
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses]);

  const topCategory = categoryTotals[0];
  // Average spend per day elapsed so far this month (today counts as day N of the month)
  const avgPerDay = totalThisMonth / new Date().getDate();

  const grouped = useMemo(() => groupByDate(expenses), [expenses]);
  const sortedDates = useMemo(() => [...grouped.keys()].sort().reverse(), [grouped]);

  // No expenses at all — full-width centered empty state
  if (!isLoading && expenses.length === 0) {
    return (
      <EmptyState
        icon={<EmptyIllustration variant="wallet" />}
        title="No expenses yet"
        subtitle="Track your spending by adding your first expense."
        action={
          <Button variant="primary" onClick={openAddExpense}>+ Add Expense</Button>
        }
      />
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Overview */}
      <Section title="Overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard value={formatCurrency(totalThisMonth, currency)} label="Spent this month" />
          <StatCard value={formatCurrency(totalToday, currency)} label="Spent today" color="var(--accent)" />
          <StatCard value={thisMonthExpenses.length} label="Transactions this month" />
        </div>
      </Section>

      {/* By Category (this month) */}
      {categoryTotals.length > 0 && (
        <Section title="By Category">
          <div style={{ ...card, padding: '18px 20px' }}>
            {categoryTotals.map((c) => (
              <BarRow
                key={c.label}
                label={`${c.emoji} ${c.label}`}
                count={c.amount}
                total={totalThisMonth}
                color="var(--accent)"
                valueLabel={formatCurrency(c.amount, currency)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Insights */}
      <Section title="Insights">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InsightCard
            emoji={topCategory?.emoji ?? '🏆'}
            value={topCategory ? formatCurrency(topCategory.amount, currency) : '—'}
            label={topCategory ? `Top category: ${topCategory.label}` : 'No spending yet'}
          />
          <InsightCard
            emoji="📈"
            value={formatCurrency(avgPerDay, currency)}
            label="Avg. per day this month"
          />
        </div>
      </Section>

      {/* Expense list, grouped by date */}
      {isLoading ? (
        <ExpenseList expenses={[]} isLoading skeletonCount={5} />
      ) : (
        sortedDates.map((dateStr) => {
          const { label, sublabel } = sectionLabel(dateStr);
          return (
            <ExpenseDaySection
              key={dateStr}
              label={label}
              sublabel={sublabel}
              expenses={grouped.get(dateStr)!}
              defaultOpen
            />
          );
        })
      )}
    </div>
  );
}
