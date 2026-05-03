import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, Flag, Calendar, RefreshCw, Bell } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { parseInput } from '@/utils/parseInput';
import type { Priority, Category, ReminderOffset, RecurringPattern } from '@/types';

// ── Chip helpers ──────────────────────────────────────────────────────────

const PRIORITIES: { value: Priority | ''; label: string; color: string }[] = [
  { value: '',       label: 'Priority',    color: 'var(--text-sub)' },
  { value: 'high',   label: '🔴 High',     color: 'var(--priority-high)' },
  { value: 'medium', label: '🟡 Medium',   color: 'var(--priority-medium)' },
  { value: 'low',    label: '⬜ Low',      color: 'var(--priority-low)' },
];

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '',          label: 'Category'   },
  { value: 'work',      label: '💼 Work'    },
  { value: 'personal',  label: '👤 Personal'},
  { value: 'project',   label: '🚀 Project' },
  { value: 'routine',   label: '🔁 Routine' },
];

const REMINDERS: { value: ReminderOffset; label: string }[] = [
  { value: 'none', label: "Don't remind"   },
  { value: 'at',   label: 'At due time'    },
  { value: '15',   label: '15 min before'  },
  { value: '30',   label: '30 min before'  },
  { value: '60',   label: '1 hour before'  },
  { value: '1440', label: '1 day before'   },
];

const RECURRING: { value: RecurringPattern; label: string }[] = [
  { value: 'none',      label: "Doesn't repeat" },
  { value: 'daily',     label: 'Daily'           },
  { value: 'weekdays',  label: 'Weekdays'        },
  { value: 'weekly',    label: 'Weekly'          },
  { value: 'monthly',   label: 'Monthly'         },
];

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
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>(defaultReminder);
  const [recurring, setRecurring] = useState<RecurringPattern>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key closes overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickAdd();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeQuickAdd]);

  // Parse inline shortcuts as user types
  const handleTitleChange = (raw: string) => {
    setTitle(raw);
    const parsed = parseInput(raw);
    if (parsed.priority)  setPriority(parsed.priority);
    if (parsed.category)  setCategory(parsed.category);
    if (parsed.dueDate)   setDueDate(parsed.dueDate);
    if (parsed.recurring) setRecurring(parsed.recurring);
  };

  const handleSubmit = useCallback(async () => {
    const parsed = parseInput(title);
    const cleanTitle = parsed.title || title.trim();
    if (!cleanTitle) return;

    setIsSubmitting(true);
    try {
      await addTask({
        title: cleanTitle,
        priority: (priority || parsed.priority || 'none') as Priority,
        category: (category || parsed.category) as Category | undefined,
        status: 'todo',
        dueDate: dueDate || parsed.dueDate,
        reminderOffset,
        recurring: recurring || parsed.recurring || 'none',
        tags: parsed.tags,
      });
      closeQuickAdd();
    } finally {
      setIsSubmitting(false);
    }
  }, [title, priority, category, dueDate, reminderOffset, recurring, addTask, closeQuickAdd]);

  // Cmd/Ctrl+Enter submits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  const selectStyle = {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      onClick={(e) => e.target === e.currentTarget && closeQuickAdd()}
    >
      {/* Panel */}
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            New Task
          </h2>
          <button
            onClick={closeQuickAdd}
            className="w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ color: 'var(--text-sub)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title input */}
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Task title — try: Buy milk !high due:tomorrow #groceries"
            className="w-full text-sm outline-none bg-transparent"
            style={{
              color: 'var(--text-primary)',
              caretColor: 'var(--accent)',
              padding: '4px 0',
            }}
          />

          {/* Shortcut hint */}
          <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>
            Shortcuts: <code style={{ background: 'var(--bg-chip)', padding: '1px 4px', borderRadius: 3 }}>#tag</code>{' '}
            <code style={{ background: 'var(--bg-chip)', padding: '1px 4px', borderRadius: 3 }}>!high</code>{' '}
            <code style={{ background: 'var(--bg-chip)', padding: '1px 4px', borderRadius: 3 }}>due:tomorrow</code>{' '}
            <code style={{ background: 'var(--bg-chip)', padding: '1px 4px', borderRadius: 3 }}>@work</code>{' '}
            <code style={{ background: 'var(--bg-chip)', padding: '1px 4px', borderRadius: 3 }}>every:week</code>
          </p>

          {/* Divider */}
          <hr style={{ borderColor: 'var(--border-default)' }} />

          {/* Field grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
                <Flag size={12} /> Priority
              </label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')} style={selectStyle}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
                <Tag size={12} /> Category
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category | '')} style={selectStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
                <Calendar size={12} /> Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ ...selectStyle, colorScheme: 'dark' }}
              />
            </div>

            {/* Remind me */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
                <Bell size={12} /> Remind me
              </label>
              <select value={reminderOffset} onChange={(e) => setReminderOffset(e.target.value as ReminderOffset)} style={selectStyle}>
                {REMINDERS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>Fires relative to due date</p>
            </div>

            {/* Recurring */}
            <div className="space-y-1 col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
                <RefreshCw size={12} /> Repeat
              </label>
              <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringPattern)} style={selectStyle}>
                {RECURRING.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 border-t"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>
            Press <kbd style={{ background: 'var(--bg-chip)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>Enter</kbd> to add
          </p>
          <div className="flex gap-2">
            <button
              onClick={closeQuickAdd}
              className="px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer"
              style={{ color: 'var(--text-sub)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {isSubmitting ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
