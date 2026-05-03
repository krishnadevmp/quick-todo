import TaskCard from './TaskCard';
import type { Task } from '@/types';

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px 12px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-elevated)', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, borderRadius: 4, background: 'var(--bg-elevated)', marginBottom: 8, width: '65%' }} />
        <div style={{ height: 10, borderRadius: 4, background: 'var(--bg-elevated)', width: '40%' }} />
      </div>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function TaskList({ tasks, isLoading = false, skeletonCount = 3 }: TaskListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
