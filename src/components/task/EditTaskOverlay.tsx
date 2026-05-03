import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, Flag, Calendar, RefreshCw, Bell } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from '@/components/ui/Toast';
import type { Task, Priority, Category, ReminderOffset, RecurringPattern } from '@/types';

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

interface EditTaskOverlayProps {
  task: Task;
}

export default function EditTaskOverlay({ task }: EditTaskOverlayProps) {
  const closeEditTask = useUIStore((s) => s.closeEditTask);
  const updateTask = useTaskStore((s) => s.updateTask);

  const [title, setTitle]               = useState(task.title);
  const [priority, setPriority]         = useState<Priority | ''>(task.priority === 'none' ? '' : task.priority);
  const [category, setCategory]         = useState<Category | ''>(task.category ?? '');
  const [dueDate, setDueDate]           = useState(task.dueDate ?? '');
  const [reminderOffset, setReminder]   = useState<ReminderOffset>(task.reminderOffset);
  const [recurring, setRecurring]       = useState<RecurringPattern>(task.recurring);
  const [isSaving, setIsSaving]         = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEditTask(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeEditTask]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        priority: (priority || 'none') as Priority,
        category: (category || undefined) as Category | undefined,
        dueDate: dueDate || undefined,
        reminderOffset,
        recurring,
      });
      toast.success('Task updated');
      closeEditTask();
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [title, priority, category, dueDate, reminderOffset, recurring, task.id, updateTask, closeEditTask]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Detect unsaved changes
  const isDirty =
    title.trim() !== task.title ||
    (priority || 'none') !== task.priority ||
    (category || '') !== (task.category ?? '') ||
    dueDate !== (task.dueDate ?? '') ||
    reminderOffset !== task.reminderOffset ||
    recurring !== task.recurring;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, background: 'var(--bg-overlay)',
      }}
      onClick={(e) => e.target === e.currentTarget && closeEditTask()}
    >
      <div style={{
        width: '100%', maxWidth: 520,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Edit Task
            </span>
            {isDirty && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                borderRadius: 20, background: 'rgba(99,102,241,0.15)',
                color: 'var(--accent)',
              }}>
                Unsaved
              </span>
            )}
          </div>
          <button
            onClick={closeEditTask}
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

          {/* Title */}
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSave()}
            placeholder="Task title"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, fontWeight: 500,
              color: 'var(--text-primary)', caretColor: 'var(--accent)',
              padding: '0 0 12px 0',
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 18,
            }}
          />

          {/* Field grid */}
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

            {/* Due date */}
            <div>
              <div style={fieldLabel}><Calendar size={11} /> Due date</div>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                style={{ ...fieldControl, colorScheme: 'dark' }} />
            </div>

            {/* Remind me */}
            <div>
              <div style={fieldLabel}><Bell size={11} /> Remind me</div>
              <select value={reminderOffset} onChange={(e) => setReminder(e.target.value as ReminderOffset)} style={fieldControl}>
                {REMINDERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <p style={{ fontSize: 11, color: 'var(--text-placeholder)', marginTop: 5 }}>
                Fires relative to due date
              </p>
            </div>

            {/* Repeat — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabel}><RefreshCw size={11} /> Repeat</div>
              <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringPattern)} style={fieldControl}>
                {RECURRING.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
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
            <button
              onClick={closeEditTask}
              style={{
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'transparent', color: 'var(--text-sub)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isSaving || !isDirty}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: isDirty && title.trim() ? 'var(--accent)' : 'var(--bg-chip)',
                color: isDirty && title.trim() ? '#fff' : 'var(--text-placeholder)',
                fontSize: 13, fontWeight: 600,
                cursor: isDirty && title.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
