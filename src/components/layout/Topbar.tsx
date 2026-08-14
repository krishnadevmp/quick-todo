import { Plus, ChevronDown, Sun, Moon, Bell, BellOff, BellRing, WifiOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import AddMenu from './AddMenu';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/components/ui/Toast';

const VIEW_TITLES: Record<string, string> = {
  today:     'Today',
  upcoming:  'Upcoming',
  all:       'All Tasks',
  dashboard: 'Dashboard',
  expenses:  'Expenses',
  settings:  'Settings',
};

// ── Notification bell ─────────────────────────────────────────────────────

function NotificationBell() {
  const permission              = useSettingsStore((s) => s.notificationPermission);
  const notificationsEnabled    = useSettingsStore((s) => s.notificationsEnabled);
  const requestPermission       = useSettingsStore((s) => s.requestNotificationPermission);
  const disableNotifications    = useSettingsStore((s) => s.disableNotifications);

  if (permission === 'unsupported') return null;

  const handleClick = async () => {
    if (permission === 'default') {
      const result = await requestPermission();
      if (result === 'granted') {
        toast.success('Notifications enabled');
      } else if (result === 'denied') {
        toast.error('Notifications blocked — enable them in browser settings');
      }
    } else if (permission === 'granted' && notificationsEnabled) {
      disableNotifications();
      toast.info('Notifications disabled');
    } else if (permission === 'granted' && !notificationsEnabled) {
      // Re-enable via settings store
      useSettingsStore.getState().updateSettings({ notificationsEnabled: true });
      toast.success('Notifications re-enabled');
    } else if (permission === 'denied') {
      toast.error('Notifications are blocked — enable them in your browser settings');
    }
  };

  const icon = (() => {
    if (permission === 'denied')                              return <BellOff size={15} />;
    if (permission === 'granted' && notificationsEnabled)     return <BellRing size={15} />;
    return <Bell size={15} />;
  })();

  const color = (() => {
    if (permission === 'denied')                              return 'var(--text-placeholder)';
    if (permission === 'granted' && notificationsEnabled)     return 'var(--accent)';
    return 'var(--text-sub)';
  })();

  const title = (() => {
    if (permission === 'denied')   return 'Notifications blocked — click for info';
    if (permission === 'default')  return 'Enable reminders';
    if (notificationsEnabled)      return 'Notifications on — click to disable';
    return 'Notifications off — click to enable';
  })();

  return (
    <div style={{ position: 'relative' }}>
      <Button variant="ghost" iconOnly size="md"
        onClick={handleClick} title={title}
        style={{
          color,
          border: `1px solid ${permission === 'default' ? 'var(--accent)' : 'var(--border-default)'}`,
        }}>
        {icon}
      </Button>

      {/* Dot badge — shown only when permission hasn't been decided yet */}
      {permission === 'default' && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ── Main Topbar ───────────────────────────────────────────────────────────

export default function Topbar() {
  const activeView   = useUIStore((s) => s.activeView);
  const { theme, updateSettings } = useSettingsStore();
  const isMobile     = useIsMobile();
  const isOnline     = useOnlineStatus();

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

        {/* Offline badge */}
        {!isOnline && (
          <div
            title="You're offline — changes save locally"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 9px',
              borderRadius: 20,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              fontSize: 11, fontWeight: 600,
            }}
          >
            <WifiOff size={12} />
            Offline
          </div>
        )}

        {/* Notification bell */}
        <NotificationBell />

        {/* Theme toggle */}
        <Button variant="ghost" iconOnly size="md"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          style={{ border: '1px solid var(--border-default)' }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </Button>

        {/* New task/expense picker — hidden on mobile (FAB handles it) */}
        {!isMobile && (
          <AddMenu
            align="right" direction="down"
            trigger={({ toggle }) => (
              <Button variant="primary" onClick={toggle}>
                <Plus size={14} strokeWidth={2.5} />
                New
                <ChevronDown size={11} />
              </Button>
            )}
          />
        )}
      </div>
    </header>
  );
}
