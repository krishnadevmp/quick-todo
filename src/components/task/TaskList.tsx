import TaskCard from './TaskCard';
import type { Task } from '@/types';

// ── Loading skeleton ──────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px 12px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      {/* Circle */}
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'var(--bg-elevated)',
        flexShrink: 0, marginTop: 1,
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ flex: 1 }}>
        {/* Title line */}
        <div style={{
          height: 14, borderRadius: 4,
          background: 'var(--bg-elevated)',
          marginBottom: 8,
          width: `${60 + Math.random() * 30}%`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        {/* Meta line */}
        <div style={{
          height: 10, borderRadius: 4,
          background: 'var(--bg-elevated)',
          width: `${30 + Math.random() * 20}%`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function TaskList({ tasks, isLoading = false, skeletonCount = 3 }: TaskListProps) {
  if (isLoading) {
    return (
      <>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
