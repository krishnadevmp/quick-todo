// ── Shared style constants for stat-driven screens (Dashboard, Expenses) ───
// Split out from StatPrimitives.tsx so that file only exports components
// (react-refresh/only-export-components requires this for fast-refresh).

export const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--text-sub)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 14,
};
