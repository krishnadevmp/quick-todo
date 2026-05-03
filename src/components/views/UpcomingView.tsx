import { useEffect, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import TaskList from '@/components/task/TaskList';
import DaySection from '@/components/ui/DaySection';
import EmptyState from '@/components/ui/EmptyState';
import type { Task } from '@/types';

// ── Date helpers ──────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Human-readable section label for a YYYY-MM-DD string */
function sectionLabel(dateStr: string): { label: string; sublabel: string } {
  const today = todayStr();
  const tomorrow = offsetDate(1);

  if (dateStr === today)    return { label: 'Today',    sublabel: fmtFull(dateStr) };
  if (dateStr === tomorrow) return { label: 'Tomorrow', sublabel: fmtFull(dateStr) };

  // Within the next 7 days — show weekday name
  const date = new Date(dateStr + 'T00:00:00');
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  return { label: weekday, sublabel: fmtFull(dateStr) };
}

function fmtFull(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// ── Group tasks by due date ───────────────────────────────────────────────

function groupByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.dueDate ?? '__none__';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  return map;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function UpcomingView() {
  const { tasks, overdueTasks, isLoading, loadUpcoming } = useTaskStore();

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  // Group upcoming tasks by date
  const grouped = useMemo(() => groupByDate(tasks), [tasks]);

  // Build sorted date keys (ascending)
  const sortedDates = useMemo(
    () => [...grouped.keys()].filter((k) => k !== '__none__').sort(),
    [grouped]
  );

  const noDateTasks = grouped.get('__none__') ?? [];
  const hasAnything = overdueTasks.length > 0 || tasks.length > 0;

  if (isLoading) {
    return (
      <div style={{ maxWidth: 640 }}>
        <TaskList tasks={[]} isLoading skeletonCount={4} />
      </div>
    );
  }

  if (!hasAnything) {
    return (
      <EmptyState
        icon="📅"
        title="You're all caught up!"
        subtitle="No tasks due in the next 7 days. Enjoy the breathing room."
      />
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>

      {/* ── Overdue section ───────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <DaySection
          label="Overdue"
          sublabel={`${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} past due`}
          tasks={overdueTasks}
          accent="var(--priority-high)"
          defaultOpen
        />
      )}

      {/* ── Upcoming grouped sections ────────────────────────────────── */}
      {sortedDates.map((dateStr) => {
        const { label, sublabel } = sectionLabel(dateStr);
        const dayTasks = grouped.get(dateStr)!;
        return (
          <DaySection
            key={dateStr}
            label={label}
            sublabel={sublabel}
            tasks={dayTasks}
            defaultOpen
          />
        );
      })}

      {/* ── Tasks with no due date ───────────────────────────────────── */}
      {noDateTasks.length > 0 && (
        <DaySection
          label="No due date"
          tasks={noDateTasks}
          accent="var(--text-sub)"
          defaultOpen={false}
        />
      )}
    </div>
  );
}
