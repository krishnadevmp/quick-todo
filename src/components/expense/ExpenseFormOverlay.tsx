import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, Calendar, DollarSign, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/components/ui/Toast';
import { EXPENSE_CATEGORIES } from '@/utils/expenseCategories';
import { todayISO } from '@/utils/formatDate';
import type { Expense, ExpenseCategory } from '@/types';

// ── Shared field styles ───────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 11, fontWeight: 600, color: 'var(--text-sub)',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
};

const fieldControl: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
  border: '1px solid var(--border-default)', borderRadius: 8,
  padding: '8px 10px', fontSize: 13, outline: 'none', cursor: 'pointer',
};

// ── Component ─────────────────────────────────────────────────────────────
// Used for both "add" and "edit" — pass `expense` to edit an existing record.

interface ExpenseFormOverlayProps {
  expense?: Expense;
}

export default function ExpenseFormOverlay({ expense }: ExpenseFormOverlayProps) {
  const isEditMode = Boolean(expense);

  const closeAddExpense  = useUIStore((s) => s.closeAddExpense);
  const closeEditExpense = useUIStore((s) => s.closeEditExpense);
  const addExpense       = useExpenseStore((s) => s.addExpense);
  const updateExpense    = useExpenseStore((s) => s.updateExpense);
  const currency         = useSettingsStore((s) => s.currency);

  const close = isEditMode ? closeEditExpense : closeAddExpense;

  const [title, setTitle]                   = useState(expense?.title ?? '');
  const [description, setDescription]       = useState(expense?.description ?? '');
  const [amount, setAmount]                 = useState(expense ? String(expense.amount) : '');
  const [category, setCategory]             = useState<ExpenseCategory>(expense?.category ?? 'grocery');
  const [customCategory, setCustomCategory] = useState(expense?.customCategory ?? '');
  const [date, setDate]                     = useState(expense?.date ?? todayISO());
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  const amountValue = parseFloat(amount);
  const isValid =
    title.trim().length > 0 &&
    !Number.isNaN(amountValue) && amountValue > 0 &&
    (category !== 'other' || customCategory.trim().length > 0);

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: amountValue,
        category,
        customCategory: category === 'other' ? customCategory.trim() : undefined,
        date,
      };

      if (isEditMode && expense) {
        await updateExpense(expense.id, payload);
        toast.success('Expense updated');
      } else {
        await addExpense(payload);
        toast.success('Expense added');
      }
      close();
    } catch {
      toast.error('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, title, description, amountValue, category, customCategory, date,
      isEditMode, expense, addExpense, updateExpense, close]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, background: 'var(--bg-overlay)',
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEditMode ? 'Edit Expense' : 'New Expense'}
          </span>
          <Button variant="ghost" iconOnly size="sm" onClick={close} title="Close">
            <X size={15} />
          </Button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 20px 16px' }}>

          {/* Title */}
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Expense title — e.g. Weekly grocery run"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, fontWeight: 500,
              color: 'var(--text-primary)', caretColor: 'var(--accent)',
              padding: '0 0 12px 0',
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 14,
            }}
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border-default)', borderRadius: 8,
              padding: '8px 10px', fontSize: 13, outline: 'none',
              fontFamily: 'inherit', marginBottom: 18,
            }}
          />

          {/* Field grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>

            {/* Amount */}
            <div>
              <div style={fieldLabel}><DollarSign size={11} /> Amount ({currency})</div>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ ...fieldControl, cursor: 'text' }}
              />
            </div>

            {/* Date */}
            <div>
              <div style={fieldLabel}><Calendar size={11} /> Date</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={{ ...fieldControl, colorScheme: 'dark' }} />
            </div>

            {/* Category */}
            <div style={{ gridColumn: category === 'other' ? 'span 1' : 'span 2' }}>
              <div style={fieldLabel}><Tag size={11} /> Category</div>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} style={fieldControl}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Custom category name — only when "Other" is selected */}
            {category === 'other' && (
              <div>
                <div style={fieldLabel}><FileText size={11} /> Custom name</div>
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Subscriptions"
                  style={{ ...fieldControl, cursor: 'text' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>
            Press{' '}
            <kbd style={{
              background: 'var(--bg-chip)', color: 'var(--text-sub)',
              padding: '1px 6px', borderRadius: 4, fontSize: 11,
            }}>⌘ Enter</kbd>
            {' '}to save
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button variant="primary"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
