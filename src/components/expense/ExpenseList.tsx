import ExpenseCard from './ExpenseCard';
import type { Expense } from '@/types';

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-elevated)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, borderRadius: 4, background: 'var(--bg-elevated)', marginBottom: 8, width: '55%' }} />
        <div style={{ height: 10, borderRadius: 4, background: 'var(--bg-elevated)', width: '30%' }} />
      </div>
    </div>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function ExpenseList({ expenses, isLoading = false, skeletonCount = 3 }: ExpenseListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {expenses.map((expense) => <ExpenseCard key={expense.id} expense={expense} />)}
    </div>
  );
}
