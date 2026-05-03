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

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: next });
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {VIEW_TITLES[activeView]}
        </h1>
        {activeView === 'today' && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-sub)' }}>{today}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-sub)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Quick add (desktop shortcut) */}
        <button
          onClick={openQuickAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}
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
