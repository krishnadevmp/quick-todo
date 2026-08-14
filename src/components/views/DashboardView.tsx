import { useEffect, useState } from 'react';
import { TaskRepository } from '@/db/taskRepository';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { Section, StatCard, BarRow, InsightCard } from '@/components/ui/StatPrimitives';
import { card, sectionTitle } from '@/components/ui/statStyles';

// ── Types ─────────────────────────────────────────────────────────────────

type Stats = Awaited<ReturnType<typeof TaskRepository.getStats>>;

// ── Sub-components ────────────────────────────────────────────────────────

function WeeklyChart({ data }: { data: Stats['weeklyCompletions'] }) {
  const max      = Math.max(...data.map((d) => d.count), 1);
  const BAR_H    = 80;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ ...card, padding: '20px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {data.map(({ date, count }) => {
          const filled  = Math.round((count / max) * BAR_H);
          const isToday = date === todayStr;
          const dayLabel = isToday
            ? 'Today'
            : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

          return (
            <div key={date} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, height: 16, lineHeight: '16px',
                color: count > 0 ? 'var(--accent)' : 'transparent',
              }}>
                {count > 0 ? count : '0'}
              </span>

              <div style={{ width: '100%', height: BAR_H, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  width: '100%',
                  height: filled || 3,
                  borderRadius: 4,
                  background: isToday
                    ? 'var(--accent)'
                    : count > 0 ? 'rgba(99,102,241,0.35)' : 'var(--bg-elevated)',
                  border: count === 0 ? '1px solid var(--border-default)' : 'none',
                  transition: 'height 0.3s ease',
                }} />
              </div>

              <span style={{
                fontSize: 11, whiteSpace: 'nowrap',
                fontWeight: isToday ? 600 : 400,
                color: isToday ? 'var(--accent)' : 'var(--text-placeholder)',
              }}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function DashboardView() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    TaskRepository.getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 200, color: 'var(--text-placeholder)', fontSize: 14,
      }}>
        Loading stats…
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 20px', gap: 16 }}>
        <div className="empty-float"><EmptyIllustration variant="stats" /></div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          No data yet
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0 }}>
          Add and complete tasks to see your productivity stats.
        </p>
      </div>
    );
  }

  const { priorityBreakdown: pb, categoryBreakdown: cb } = stats;

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Overview */}
      <Section title="Overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard value={stats.total}          label="Total tasks" />
          <StatCard value={stats.completedToday} label="Done today"      color="var(--accent)" />
          <StatCard
            value={stats.overdue}
            label="Overdue"
            color={stats.overdue > 0 ? 'var(--priority-high)' : undefined}
          />
          <StatCard value={stats.completionRate} label="Completion rate" color="var(--accent)" suffix="%" />
        </div>
      </Section>

      {/* Last 7 days */}
      <Section title="Last 7 days">
        <WeeklyChart data={stats.weeklyCompletions} />
      </Section>

      {/* Priority + Category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div>
          <h2 style={sectionTitle}>By Priority</h2>
          <div style={{ ...card, padding: '18px 20px' }}>
            <BarRow label="🔴 High"   count={pb.high}   total={stats.total} color="var(--priority-high)"   />
            <BarRow label="🟡 Medium" count={pb.medium} total={stats.total} color="var(--priority-medium)" />
            <BarRow label="🟢 Low"    count={pb.low}    total={stats.total} color="var(--priority-low)"    />
            <BarRow label="— None"    count={pb.none}   total={stats.total} color="var(--border-default)"  />
          </div>
        </div>

        <div>
          <h2 style={sectionTitle}>By Category</h2>
          <div style={{ ...card, padding: '18px 20px' }}>
            <BarRow label="💼 Work"     count={cb.work}         total={stats.total} color="var(--accent)"          />
            <BarRow label="👤 Personal" count={cb.personal}     total={stats.total} color="var(--priority-low)"    />
            <BarRow label="🚀 Project"  count={cb.project}      total={stats.total} color="var(--priority-medium)" />
            <BarRow label="🔁 Routine"  count={cb.routine}      total={stats.total} color="var(--priority-high)"   />
            {cb.uncategorized > 0 && (
              <BarRow label="· Other"   count={cb.uncategorized} total={stats.total} color="var(--border-default)" />
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <Section title="Insights">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InsightCard
            emoji={stats.streak > 0 ? '🔥' : '💤'}
            value={`${stats.streak} day${stats.streak !== 1 ? 's' : ''}`}
            label="Current streak"
          />
          <InsightCard
            emoji="📅"
            value={stats.mostProductiveDay ?? '—'}
            label="Most productive day"
          />
        </div>
      </Section>
    </div>
  );
}
