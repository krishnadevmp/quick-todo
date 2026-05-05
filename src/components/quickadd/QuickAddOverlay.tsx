import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, Flag, Calendar, Clock, RefreshCw, Bell } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { parseInput } from '@/utils/parseInput';
import type { Priority, Category, ReminderOffset, RecurringPattern } from '@/types';

const PRIORITIES: { value: Priority | ''; label: string }[] = [
  { value: '',       label: 'No priority' },
  { value: 'high',   label: '🔴 High'    },
  { value: 'medium', label: '🟡 Medium'  },
  { value: 'low',    label: '⬜ Low'     },
];

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '',          label: 'No category' },
  { value: 'work',      label: '💼 Work'     },
  { value: 'personal',  label: '👤 Personal' },
  { value: 'project',   label: '🚀 Project'  },
  { value: 'routine',   label: '🔁 Routine'  },
];

const REMINDERS: { value: ReminderOffset; label: string }[] = [
  { value: 'none', label: "Don't remind"  },
  { value: 'at',   label: 'At due time'   },
  { value: '15',   label: '15 min before' },
  { value: '30',   label: '30 min before' },
  { value: '60',   label: '1 hour before' },
  { value: '1440', label: '1 day before'  },
];

const RECURRING: { value: RecurringPattern; label: string }[] = [
  { value: 'none',     label: "Doesn't repeat" },
  { value: 'daily',    label: 'Daily'          },
  { value: 'weekdays', label: 'Weekdays'       },
  { value: 'weekly',   label: 'Weekly'         },
  { value: 'monthly',  label: 'Monthly'        },
];

// ── Shared field styles ───────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-sub)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const fieldControl: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

// ── Component ─────────────────────────────────────────────────────────────

export default function QuickAddOverlay() {
  const closeQuickAdd = useUIStore((s) => s.closeQuickAdd);
  const addTask = useTaskStore((s) => s.addTask);
  const defaultPriority = useSettingsStore((s) => s.defaultPriority);
  const defaultReminder = useSettingsStore((s) => s.defaultReminderOffset);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority | ''>(defaultPriority === 'none' ? '' : defaultPriority);
  const [category, setCategory] = useState<Category | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('11:00');
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>(defaultReminder);
  const [recurring, setRecurring] = useState<RecurringPattern>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQuickAdd(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeQuickAdd]);

  const handleTitleChange = (raw: string) => {
    setTitle(raw);
    const parsed = parseInput(raw);
    if (parsed.priority)  setPriority(parsed.priority);
    if (parsed.category)  setCategory(parsed.category);
    if (parsed.dueDate)   setDueDate(parsed.dueDate);
    if (parsed.recurring) setRecurring(parsed.recurring);
  };

  const isRecurring = recurring !== 'none';

  const handleSubmit = useCallback(async () => {
    const parsed = parseInput(title);
    const cleanTitle = parsed.title || title.trim();
    if (!cleanTitle) return;
    setIsSubmitting(true);

    const effectiveRecurring = (recurring || parsed.recurring || 'none') as RecurringPattern;
    const isRec = effectiveRecurring !== 'none';
    const today = new Date().toISOString().slice(0, 10);

    try {
      await addTask({
        title: cleanTitle,
        priority: (priority || parsed.priority || 'none') as Priority,
        category: (category || parsed.category) as Category | undefined,
        status: 'todo',
        // Recurring tasks always start today; one-off tasks use whatever date was picked
        dueDate: isRec ? today : (dueDate || parsed.dueDate),
        // Recurring: remind at the chosen time regardless; one-off: only if a date was set
        dueTime: isRec ? dueTime : ((dueDate || parsed.dueDate) ? dueTime : undefined),
        // Recurring: always fire at the exact time; one-off: use the offset picker
        reminderOffset: isRec ? 'at' : reminderOffset,
        recurring: effectiveRecurring,
        tags: parsed.tags,
      });
      closeQuickAdd();
    } finally {
      setIsSubmitting(false);
    }
  }, [title, priority, category, dueDate, dueTime, reminderOffset, recurring, addTask, closeQuickAdd]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'var(--bg-overlay)',
      }}
      onClick={(e) => e.target === e.currentTarget && closeQuickAdd()}
    >
      {/* Panel */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 16,
        overflow: 'hidden',
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
            New Task
          </span>
          <button
            onClick={closeQuickAdd}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-sub)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 20px 16px' }}>

          {/* Title input */}
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Task title — try: Buy milk !high due:tomorrow #groceries"
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

          {/* Shortcut hint */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>Shortcuts:</span>
            {['#tag', '!high', 'due:tomorrow', '@work', 'every:week'].map((s) => (
              <code key={s} style={{
                background: 'var(--bg-chip)', color: 'var(--text-sub)',
                padding: '2px 6px', borderRadius: 4, fontSize: 11,
              }}>{s}</code>
            ))}
          </div>

          {/* Field grid — 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>

            {/* Priority */}
            <div>
              <div style={fieldLabel}><Flag size={11} /> Priority</div>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')} style={fieldControl}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <div style={fieldLabel}><Tag size={11} /> Category</div>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category | '')} style={fieldControl}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {isRecurring ? (
              /* ── Recurring mode: Repeat + Remind at time ── */
              <>
                <div>
                  <div style={fieldLabel}><RefreshCw size={11} /> Repeat</div>
                  <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringPattern)} style={fieldControl}>
                    {RECURRING.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <div style={fieldLabel}><Clock size={11} /> Remind at</div>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    style={{ ...fieldControl, colorScheme: 'dark' }}
                  />
                </div>
              </>
            ) : (
              /* ── One-off mode: Due date + time + reminder offset + repeat ── */
              <>
                <div>
                  <div style={fieldLabel}><Calendar size={11} /> Due date</div>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    style={{ ...fieldControl, colorScheme: 'dark' }} />
                </div>

                <div>
                  <div style={fieldLabel}><Clock size={11} /> Due time</div>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    disabled={!dueDate}
                    style={{
                      ...fieldControl,
                      colorScheme: 'dark',
                      opacity: dueDate ? 1 : 0.4,
                      cursor: dueDate ? 'pointer' : 'not-allowed',
                    }}
                  />
                </div>

                <div>
                  <div style={fieldLabel}><Bell size={11} /> Remind me</div>
                  <select value={reminderOffset} onChange={(e) => setReminderOffset(e.target.value as ReminderOffset)} style={fieldControl}>
                    {REMINDERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <div style={fieldLabel}><RefreshCw size={11} /> Repeat</div>
                  <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringPattern)} style={fieldControl}>
                    {RECURRING.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </>
            )}

          </div>

          {/* Info callout — only shown for recurring tasks */}
          {isRecurring && (
            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              <RefreshCw size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5 }}>
                Starts today. A new task is created each {
                  recurring === 'daily' ? 'day' :
                  recurring === 'weekdays' ? 'weekday' :
                  recurring === 'weekly' ? 'week' : 'month'
                } when you complete the current one.
                Past-due occurrences stay visible as overdue so you can track missed days.
              </span>
            </div>
          )}
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
            }}>Enter</kbd>
            {' '}to save
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={closeQuickAdd}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-default)',
                background: 'transparent', color: 'var(--text-sub)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: title.trim() ? 'var(--accent)' : 'var(--bg-chip)',
                color: title.trim() ? '#fff' : 'var(--text-placeholder)',
                fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              {isSubmitting ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
