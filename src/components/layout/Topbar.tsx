import { Plus, Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

const VIEW_TITLES: Record<string, string> = {
  today:     'Today',
  upcoming:  'Upcoming',
  all:       'All Tasks',
  dashboard: 'Dashboard',
  settings:  'Settings',
};

export default function Topbar() {
  const activeView = useUIStore((s) => s.activeView);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const { theme, updateSettings } = useSettingsStore();

  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--bg-surface)',
      flexShrink: 0,
    }}>
      {/* Left: title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          fontSize: 17, fontWeight: 700, color: 'var(--text-primary)',
          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {VIEW_TITLES[activeView]}
        </h1>
        {activeView === 'today' && (
          <p style={{ fontSize: 12, color: 'var(--text-sub)', margin: '2px 0 0', whiteSpace: 'nowrap' }}>{today}</p>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          style={{
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: '1px solid var(--border-default)',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--text-sub)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* New task button */}
        <button
          onClick={openQuickAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={14} strokeWidth={2.5} />
          New
        </button>
      </div>
    </header>
  );
}
