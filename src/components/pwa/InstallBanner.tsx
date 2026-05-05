import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();
  if (!canInstall) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      background: 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.08) 100%)',
      borderBottom: '1px solid rgba(99,102,241,0.25)',
      flexShrink: 0,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Download size={14} color="#fff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Install Quick Todo
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
          Add to home screen for instant access
        </div>
      </div>

      <button
        onClick={install}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--accent)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
      >
        Install
      </button>

      <button
        onClick={dismiss}
        style={{
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', background: 'transparent',
          color: 'var(--text-placeholder)', cursor: 'pointer',
          flexShrink: 0,
          borderRadius: 6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
