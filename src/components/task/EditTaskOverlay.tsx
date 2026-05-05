import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, Flag, Calendar, Clock, RefreshCw, Bell, StopCircle } from 'lucide-react';
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
  const closeEditTask     = useUIStore((s) => s.closeEditTask);
  const updateTask        = useTaskStore((s) => s.updateTask);
  const updateTaskSeries  = useTaskStore((s) => s.updateTaskSeries);
  const stopRecurring     = useTaskStore((s) => s.stopRecurring);

  const [title, setTitle]               = useState(task.title);
  const [priority, setPriority]         = useState<Priority | ''>(task.priority === 'none' ? '' : task.priority);
  const [category, setCategory]         = useState<Category | ''>(task.category ?? '');
  const [dueDate, setDueDate]           = useState(task.dueDate ?? '');
  const [dueTime, setDueTime]           = useState(task.dueTime ?? '11:00');
  const [reminderOffset, setReminder]   = useState<ReminderOffset>(task.reminderOffset);
  const [recurring, setRecurring]       = useState<RecurringPattern>(task.recurring);
  const [isSaving, setIsSaving]         = useState(false);
  const [editScope, setEditScope]       = useState<'this' | 'series'>('this');

  // Task is part of a recurring series if it has a pattern or a parentId
  const isRecurring = task.recurring !== 'none' || Boolean(task.recurringParentId);

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
      const seriesFields = {
        title:          title.trim(),
        priority:       (priority || 'none') as Priority,
        category:       (category || undefined) as Category | undefined,
        dueTime:        dueDate ? dueTime : undefined,
        reminderOffset,
        recurring,
      };

      if (editScope === 'series' && isRecurring) {
        // Propagate metadata to all pending tasks in the series
        await updateTaskSeries(task.id, seriesFields);
        // Update this task's dueDate separately (each occurrence keeps its own)
        if (dueDate !== (task.dueDate ?? '')) {
          await updateTask(task.id, { dueDate: dueDate || undefined });
        }
      } else {
        await updateTask(task.id, { ...seriesFields, dueDate: dueDate || undefined });
      }

      toast.success(editScope === 'series' ? 'Series updated' : 'Task updated');
      closeEditTask();
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [title, priority, category, dueDate, dueTime, reminderOffset, recurring,
      editScope, isRecurring, task.id, task.dueDate,
      updateTask, updateTaskSeries, closeEditTask]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleStopRepeating = useCallback(async () => {
    try {
      await stopRecurring(task.id);
      toast.success('Task will no longer repeat');
      closeEditTask();
    } catch {
      toast.error('Failed to stop recurring');
    }
  }, [stopRecurring, task.id, closeEditTask]);

  // Detect unsaved changes
  const isDirty =
    title.trim() !== task.title ||
    (priority || 'none') !== task.priority ||
    (category || '') !== (task.category ?? '') ||
    dueDate !== (task.dueDate ?? '') ||
    dueTime !== (task.dueTime ?? '11:00') ||
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

          {/* Series scope — only shown for recurring tasks */}
          {isRecurring && (
            <div style={{
              display: 'flex', gap: 6, marginBottom: 16,
              background: 'var(--bg-elevated)',
              borderRadius: 8, padding: 4,
            }}>
              {(['this', 'series'] as const).map((scope) => (
                <button
                  key={scope}
                  onClick={() => setEditScope(scope)}
                  style={{
                    flex: 1, padding: '5px 0',
                    borderRadius: 6, border: 'none',
                    background: editScope === scope ? 'var(--bg-surface)' : 'transparent',
                    color: editScope === scope ? 'var(--text-primary)' : 'var(--text-sub)',
                    fontSize: 12, fontWeight: editScope === scope ? 600 : 400,
                    cursor: 'pointer',
                    boxShadow: editScope === scope ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {scope === 'this' ? 'This task only' : 'All future tasks'}
                </button>
              ))}
            </div>
          )}

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
              <div style={fieldLabel}>
                <Calendar size={11} />
                {isRecurring ? 'This occurrence' : 'Due date'}
              </div>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                style={{ ...fieldControl, colorScheme: 'dark' }} />
            </div>

            {/* Due time */}
            <div>
              <div style={fieldLabel}>
                <Clock size={11} />
                {isRecurring ? 'Remind at' : 'Due time'}
              </div>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!isRecurring && !dueDate}
                style={{
                  ...fieldControl,
                  colorScheme: 'dark',
                  opacity: (isRecurring || dueDate) ? 1 : 0.4,
                  cursor: (isRecurring || dueDate) ? 'pointer' : 'not-allowed',
                }}
              />
            </div>

            {/* Remind me */}
            <div>
              <div style={fieldLabel}><Bell size={11} /> Remind me</div>
              <select value={reminderOffset} onChange={(e) => setReminder(e.target.value as ReminderOffset)} style={fieldControl}>
                {REMINDERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Repeat */}
            <div>
              <div style={fieldLabel}><RefreshCw size={11} /> Repeat</div>
              <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringPattern)} style={fieldControl}>
                {RECURRING.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Recurring info callout */}
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
                {editScope === 'series'
                  ? 'Reminder time and repeat pattern will update for all future occurrences. Each occurrence keeps its own date.'
                  : 'Editing this occurrence only. Use "All future tasks" to change the reminder time or repeat pattern.'}
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
          {isRecurring ? (
            <button
              onClick={handleStopRepeating}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                border: '1px solid var(--priority-high)',
                background: 'transparent',
                color: 'var(--priority-high)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <StopCircle size={12} />
              Stop repeating
            </button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>
              Press{' '}
              <kbd style={{
                background: 'var(--bg-chip)', color: 'var(--text-sub)',
                padding: '1px 6px', borderRadius: 4, fontSize: 11,
              }}>⌘ Enter</kbd>
              {' '}to save
            </span>
          )}
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
