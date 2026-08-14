// ── Shared stat/insight presentational pieces ───────────────────────────────
// Extracted from DashboardView so other stat-driven screens (e.g. Expenses)
// can reuse the same visual language instead of inventing their own.

import { card, sectionTitle } from './statStyles';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

export function StatCard({ value, label, color, suffix = '' }: {
  value: number | string; label: string; color?: string; suffix?: string;
}) {
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{
        fontSize: 30, fontWeight: 700, lineHeight: 1,
        color: color ?? 'var(--text-primary)', marginBottom: 6,
      }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-sub)' }}>
        {label}
      </div>
    </div>
  );
}

export function BarRow({ label, count, total, color, valueLabel }: {
  label: string; count: number; total: number; color: string;
  /** Overrides the right-hand display text — count/total still drive the bar-fill % */
  valueLabel?: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 80, fontSize: 12, color: 'var(--text-sub)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: color, transition: 'width 0.45s ease',
          minWidth: pct > 0 ? 4 : 0,
        }} />
      </div>
      <span style={{ minWidth: 22, fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'right', flexShrink: 0 }}>
        {valueLabel ?? count}
      </span>
    </div>
  );
}

export function InsightCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <div style={{ ...card, padding: '20px 24px' }}>
      <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>{emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-sub)' }}>{label}</div>
    </div>
  );
}
