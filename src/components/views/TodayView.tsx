import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import TaskList from '@/components/task/TaskList';
import EmptyState from '@/components/ui/EmptyState';

export default function TodayView() {
  const { tasks, isLoading, loadToday } = useTaskStore();
  const openQuickAdd  = useUIStore((s) => s.openQuickAdd);
  const showCompleted = useSettingsStore((s) => s.showCompleted);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const doneCount   = tasks.filter((t) => t.status === 'done').length;
  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => t.status !== 'done');

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Progress bar */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              {doneCount} of {tasks.length} done
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
              {Math.round((doneCount / tasks.length) * 100)}%
            </span>
          </div>
          <div style={{
            height: 4,
            borderRadius: 2,
            background: 'var(--bg-elevated)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              borderRadius: 2,
              background: 'var(--accent)',
              width: `${(doneCount / tasks.length) * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <TaskList tasks={[]} isLoading />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Nothing due today"
          subtitle="No tasks are due today. Add one to get started."
          action={
            <button
              onClick={openQuickAdd}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Add a task
            </button>
          }
        />
      ) : (
        <TaskList tasks={visibleTasks} />
      )}
    </div>
  );
}
