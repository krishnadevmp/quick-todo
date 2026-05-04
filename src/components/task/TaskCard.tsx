import { useState } from 'react';
import { RefreshCw, Pencil, Trash2, Calendar, Tag } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { formatDueDate, isOverdue } from '@/utils/formatDate';
import { nextOccurrenceLabel } from '@/utils/recurringUtils';
import { toast } from '@/components/ui/Toast';
import type { Task, Priority, TaskStatus } from '@/types';

const PRIORITY_COLOR: Record<Priority, string> = {
  high:   'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low:    'var(--priority-low)',
  none:   'transparent',
};

const CATEGORY_EMOJI: Record<string, string> = {
  work: '💼', personal: '👤', project: '🚀', routine: '🔁',
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo',
};

const STATUS_TOOLTIP: Record<TaskStatus, string> = {
  'todo': 'Mark in progress', 'in-progress': 'Mark done', 'done': 'Mark todo',
};

const STATUS_BG: Record<TaskStatus, string> = {
  'todo': 'transparent', 'in-progress': 'var(--priority-medium)', 'done': 'var(--accent)',
};

const STATUS_BORDER: Record<TaskStatus, string> = {
  'todo': 'var(--border-default)', 'in-progress': 'var(--priority-medium)', 'done': 'var(--accent)',
};

interface TaskCardProps { task: Task; }

export default function TaskCard({ task }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateTask   = useTaskStore((s) => s.updateTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const deleteTask   = useTaskStore((s) => s.deleteTask);
  const openEditTask = useUIStore((s) => s.openEditTask);

  const isDone = task.status === 'done';
  const overdue = !isDone && isOverdue(task.dueDate);
  const dueDateLabel = formatDueDate(task.dueDate);
  const todayStr = new Date().toISOString().slice(0, 10);

  const dueTimeLabel = (() => {
    if (!task.dueTime) return '';
    const [h, m] = task.dueTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour   = h % 12 || 12;
    return ` · ${hour}:${m.toString().padStart(2, '0')} ${period}`;
  })();

  const handleStatusClick = async () => {
    const next = NEXT_STATUS[task.status];
    if (next === 'done') {
      const nextRecurring = await completeTask(task.id);
      if (nextRecurring) {
        toast.info(`🔁 Next: ${nextOccurrenceLabel(nextRecurring.dueDate ?? '')}`);
      }
    } else {
      updateTask(task.id, { status: next, completedAt: undefined });
    }
  };

  const handleDelete = () => {
    // Optimistically hide the card
    setIsDeleting(true);

    // Schedule the actual delete after the undo window
    let deleted = false;
    const timeoutId = setTimeout(async () => {
      deleted = true;
      await deleteTask(task.id);
    }, 4000);

    // Show undo toast
    toast.undo(
      `"${task.title.slice(0, 40)}${task.title.length > 40 ? '…' : ''}" deleted`,
      () => {
        // Undo: cancel deletion and restore the card
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
        padding: '12px 14px 12px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        transition: 'box-shadow 0.15s ease, opacity 0.15s ease',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        opacity: isDeleting ? 0.4 : isDone ? 0.6 : 1,
      }}
    >
      {/* Priority bar */}
      {task.priority !== 'none' && (
        <div style={{
          position: 'absolute', left: 0, top: 8, bottom: 8,
          width: 3, borderRadius: '0 3px 3px 0',
          background: PRIORITY_COLOR[task.priority],
        }} />
      )}

      {/* Status circle */}
      <div style={{ position: 'relative', flexShrink: 0, marginTop: 1 }}>
        {tooltipVisible && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
            transform: 'translateX(-50%)', background: '#0f172a', color: '#f8fafc',
            fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
            padding: '3px 8px', borderRadius: 6, pointerEvents: 'none', zIndex: 10,
          }}>
            {STATUS_TOOLTIP[task.status]}
          </div>
        )}
        <button
          onClick={handleStatusClick}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          style={{
            width: 18, height: 18, borderRadius: '50%',
            border: `2px solid ${STATUS_BORDER[task.status]}`,
            background: STATUS_BG[task.status],
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease', flexShrink: 0,
          }}
        >
          {task.status === 'done' && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {task.status === 'in-progress' && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.4, marginBottom: 4, wordBreak: 'break-word',
          color: isDone ? 'var(--text-sub)' : 'var(--text-primary)',
          textDecoration: isDone ? 'line-through' : 'none',
        }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {task.category && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 20,
              background: 'var(--bg-chip)', color: 'var(--text-sub)',
            }}>
              {CATEGORY_EMOJI[task.category]} {task.category}
            </span>
          )}
          {dueDateLabel && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 20,
              background: overdue ? 'rgba(239,68,68,0.12)' : 'var(--bg-chip)',
              color: overdue ? 'var(--priority-high)' : task.dueDate === todayStr ? 'var(--accent)' : 'var(--text-sub)',
            }}>
              <Calendar size={10} /> {dueDateLabel}{dueTimeLabel}
            </span>
          )}
          {task.recurring !== 'none' && (
            <span title={`Repeats ${task.recurring}`} style={{ color: 'var(--text-placeholder)', display: 'flex' }}>
              <RefreshCw size={11} />
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, padding: '2px 7px', borderRadius: 20,
              background: 'var(--bg-chip)', color: 'var(--text-placeholder)',
            }}>
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Hover actions */}
      {isHovered && !isDeleting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => openEditTask(task)}
            title="Edit task"
            style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-sub)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            title="Delete task"
            style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-sub)', transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--priority-high)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
