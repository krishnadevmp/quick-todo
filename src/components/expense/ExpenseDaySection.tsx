import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ExpenseList from './ExpenseList';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Expense } from '@/types';

interface ExpenseDaySectionProps {
  label: string;
  sublabel?: string;
  expenses: Expense[];
  defaultOpen?: boolean;
}

export default function ExpenseDaySection({
  label,
  sublabel,
  expenses,
  defaultOpen = true,
}: ExpenseDaySectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const currency = useSettingsStore((s) => s.currency);
  const dayTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Section header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0 8px',
          textAlign: 'left',
        }}
      >
        <span style={{ color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center' }}>
          {open
            ? <ChevronDown size={14} strokeWidth={2.5} />
            : <ChevronRight size={14} strokeWidth={2.5} />}
        </span>

        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
          {label}
        </span>

        {sublabel && (
          <span style={{ fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 400 }}>
            {sublabel}
          </span>
        )}

        {/* Day total */}
        <span style={{
          marginLeft: 'auto',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-sub)',
          whiteSpace: 'nowrap',
        }}>
          {formatCurrency(dayTotal, currency)}
        </span>
      </button>

      {open && <ExpenseList expenses={expenses} />}
    </div>
  );
}
