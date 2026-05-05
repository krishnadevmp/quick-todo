import { Download, Share, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

// Detect iOS Safari (no beforeinstallprompt support)
function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  // Safari on iOS doesn't set "CriOS" or "FxiOS" (those are Chrome/Firefox on iOS)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua);
  return isIos && isSafari;
}

function isInStandaloneMode() {
  return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
}

export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();
  const ios = isIosSafari();
  const standalone = isInStandaloneMode();
  const dismissed = typeof localStorage !== 'undefined' && localStorage.getItem('pwa-install-dismissed') === '1';

  // Chrome/Android: use native prompt
  if (canInstall) {
    return (
      <div style={bannerStyle}>
        <IconBox><Download size={14} color="#fff" /></IconBox>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleStyle}>Install Quick Todo</div>
          <div style={subtitleStyle}>Add to home screen for instant access</div>
        </div>
        <button onClick={install} style={btnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}>
          Install
        </button>
        <DismissBtn onClick={dismiss} />
      </div>
    );
  }

  // iOS Safari: show manual instructions
  if (ios && !standalone && !dismissed) {
    return (
      <div style={bannerStyle}>
        <IconBox><Share size={14} color="#fff" /></IconBox>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleStyle}>Add to Home Screen</div>
          <div style={subtitleStyle}>
            Tap the <strong style={{ color: 'var(--accent)' }}>Share</strong> button{' '}
            <span style={{ fontSize: 13 }}>⎦</span> then{' '}
            <strong style={{ color: 'var(--accent)' }}>"Add to Home Screen"</strong>
          </div>
        </div>
        <DismissBtn onClick={() => {
          localStorage.setItem('pwa-install-dismissed', '1');
          // Force re-render by dispatching a storage event (component reads localStorage directly)
          window.dispatchEvent(new Event('storage'));
        }} />
      </div>
    );
  }

  return null;
}

// ── Shared sub-components ─────────────────────────────────────────────────

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function DismissBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Dismiss"
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent',
        color: 'var(--text-placeholder)', cursor: 'pointer',
        flexShrink: 0, borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <X size={14} />
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const bannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  background: 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.08) 100%)',
  borderBottom: '1px solid rgba(99,102,241,0.25)',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-sub)',
};

const btnStyle: React.CSSProperties = {
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
};
