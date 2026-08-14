import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useExpenseStore } from '@/stores/expenseStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { EXPENSE_CATEGORY_META } from '@/utils/expenseCategories';
import type { Expense } from '@/types';

interface ExpenseCardProps { expense: Expense; }

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const [isHovered, setIsHovered]   = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteExpense   = useExpenseStore((s) => s.deleteExpense);
  const openEditExpense = useUIStore((s) => s.openEditExpense);
  const currency        = useSettingsStore((s) => s.currency);

  const meta = EXPENSE_CATEGORY_META[expense.category];
  const categoryLabel = expense.category === 'other'
    ? (expense.customCategory?.trim() || 'Other')
    : meta.label;

  const handleDelete = () => {
    // Optimistically hide the card
    setIsDeleting(true);

    // Schedule the actual delete after the undo window
    let deleted = false;
    const timeoutId = setTimeout(async () => {
      deleted = true;
      await deleteExpense(expense.id);
    }, 4000);

    toast.undo(
      `"${expense.title.slice(0, 40)}${expense.title.length > 40 ? '…' : ''}" deleted`,
      () => {
        if (!deleted) {
          clearTimeout(timeoutId);
          setIsDeleting(false);
        }
      },
      4000,
    );
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        transition: 'box-shadow 0.15s ease, opacity 0.15s ease',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        opacity: isDeleting ? 0.4 : 1,
      }}
    >
      {/* Category icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0, marginTop: 1,
        background: 'var(--bg-chip)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {meta.emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.4,
          margin: '0 0 3px', color: 'var(--text-primary)', wordBreak: 'break-word',
        }}>
          {expense.title}
        </p>
        {expense.description && (
          <p style={{
            fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.4,
            margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {expense.description}
          </p>
        )}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 20,
          background: 'var(--bg-chip)', color: 'var(--text-sub)',
        }}>
          {categoryLabel}
        </span>
      </div>

      {/* Amount + hover actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {formatCurrency(expense.amount, currency)}
        </span>
        {isHovered && !isDeleting && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Button variant="ghost" iconOnly size="sm"
              onClick={() => openEditExpense(expense)} title="Edit expense">
              <Pencil size={13} />
            </Button>
            <Button variant="danger-ghost" iconOnly size="sm"
              onClick={handleDelete} title="Delete expense">
              <Trash2 size={13} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
