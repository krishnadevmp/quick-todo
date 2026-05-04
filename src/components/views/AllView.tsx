import { useEffect, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import FilterBar from '@/components/ui/FilterBar';
import TaskList from '@/components/task/TaskList';
import EmptyState from '@/components/ui/EmptyState';

export default function AllView() {
  const { tasks, isLoading, filter, loadFiltered } = useTaskStore();

  // Reload whenever filter changes
  useEffect(() => {
    loadFiltered();
  }, [filter, loadFiltered]);

  // Collect all unique tags across tasks for the tag dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return [...set].sort();
  }, [tasks]);

  const hasActiveFilter =
    !!filter.priority || !!filter.category || filter.tags.length > 0 || !!filter.search;

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Filter bar */}
      <FilterBar allTags={allTags} />

      {/* Result count */}
      {!isLoading && (
        <div style={{
          fontSize: 12,
          color: 'var(--text-placeholder)',
          marginBottom: 12,
        }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {hasActiveFilter ? ' matching filters' : ' total'}
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <TaskList tasks={[]} isLoading skeletonCount={5} />
      ) : tasks.length === 0 ? (
        hasActiveFilter ? (
          <EmptyState
            icon="🔍"
            title="No tasks match your filters"
            subtitle="Try adjusting the filters or clearing them to see all tasks."
          />
        ) : (
          <EmptyState
            icon="📋"
            title="No tasks yet"
            subtitle="Add your first task using the Add Task button or press N."
          />
        )
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  );
}
