import { useEffect, useMemo } from "react";
import Button from "@/components/ui/Button";
import { useTaskStore } from "@/stores/taskStore";
import { useSettingsStore } from "@/stores/settingsStore";
import FilterBar from "@/components/ui/FilterBar";
import TaskList from "@/components/task/TaskList";
import EmptyState from "@/components/ui/EmptyState";
import { EmptyIllustration } from "@/components/ui/EmptyIllustration";

export default function AllView() {
  const { tasks, isLoading, filter, loadFiltered, resetFilter } =
    useTaskStore();
  const showCompleted = useSettingsStore((s) => s.showCompleted);

  useEffect(() => {
    loadFiltered();
  }, [filter, loadFiltered]);

  const visibleTasks = useMemo(
    () => (showCompleted ? tasks : tasks.filter((t) => t.status !== "done")),
    [tasks, showCompleted],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return [...set].sort();
  }, [tasks]);

  const hasActiveFilter =
    !!filter.priority ||
    !!filter.category ||
    filter.tags.length > 0 ||
    !!filter.search;

  // No tasks exist at all — full-width centered empty state, no filter bar
  if (!isLoading && tasks.length === 0 && !hasActiveFilter) {
    return (
      <EmptyState
        icon={<EmptyIllustration variant="tasks" />}
        title="No tasks yet"
        subtitle="Add your first task using the Add Task button or press N."
      />
    );
  }

  // Tasks exist but all hidden by showCompleted setting — full-width hint
  if (
    !isLoading &&
    tasks.length > 0 &&
    visibleTasks.length === 0 &&
    !hasActiveFilter
  ) {
    return (
      <EmptyState
        icon={<EmptyIllustration variant="tasks" />}
        title="All tasks completed"
        subtitle="Enable 'Show completed tasks' in Settings to see them here."
      />
    );
  }

  return (
    // margin: auto centers the constrained block within the full content area
    <div>
      <FilterBar allTags={allTags} />

      {!isLoading && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-placeholder)",
            marginBottom: 12,
          }}
        >
          {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""}
          {hasActiveFilter ? " matching filters" : " total"}
        </div>
      )}

      {isLoading ? (
        <TaskList tasks={[]} isLoading skeletonCount={5} />
      ) : visibleTasks.length === 0 ? (
        <EmptyState
          icon={<EmptyIllustration variant="search" />}
          title="No tasks match your filters"
          subtitle="Try adjusting the filters or clearing them to see all tasks."
          action={
            <Button variant="primary" onClick={resetFilter}>Clear filters</Button>
          }
        />
      ) : (
        <TaskList tasks={visibleTasks} />
      )}
    </div>
  );
}
