import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import TaskList from '@/components/task/TaskList';
import type { Task } from '@/types';

interface DaySectionProps {
  label: string;
  sublabel?: string;
  tasks: Task[];
  accent?: string;        // optional colour for the label text
  defaultOpen?: boolean;
}

export default function DaySection({
  label,
  sublabel,
  tasks,
  accent,
  defaultOpen = true,
}: DaySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

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
        {/* Collapse chevron */}
        <span style={{ color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center' }}>
          {open
            ? <ChevronDown size={14} strokeWidth={2.5} />
            : <ChevronRight size={14} strokeWidth={2.5} />}
        </span>

        {/* Label */}
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: accent ?? 'var(--text-primary)',
          letterSpacing: '0.01em',
        }}>
          {label}
        </span>

        {/* Sub-label (e.g. full date) */}
        {sublabel && (
          <span style={{ fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 400 }}>
            {sublabel}
          </span>
        )}

        {/* Task count pill */}
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          fontWeight: 600,
          padding: '1px 7px',
          borderRadius: 20,
          background: 'var(--bg-elevated)',
          color: 'var(--text-sub)',
        }}>
          {tasks.length}
        </span>
      </button>

      {/* Tasks */}
      {open && <TaskList tasks={tasks} />}
    </div>
  );
}
