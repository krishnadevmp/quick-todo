// ── Shared form style tokens for SignupPage / LoginPage / AccountPage ──────

export const fieldLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 11, fontWeight: 600, color: 'var(--text-sub)',
  textTransform: 'uppercase', letterSpacing: '0.04em',
  marginBottom: 6,
};

export const fieldControl: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
  border: '1px solid var(--border-default)', borderRadius: 8,
  padding: '9px 11px', fontSize: 14, outline: 'none',
  fontFamily: 'inherit',
};
