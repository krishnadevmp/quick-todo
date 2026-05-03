interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      gap: 12,
    }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>{icon}</div>
      <h3 style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: 0,
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 13,
        color: 'var(--text-sub)',
        margin: 0,
        maxWidth: 280,
        lineHeight: 1.5,
      }}>
        {subtitle}
      </p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
