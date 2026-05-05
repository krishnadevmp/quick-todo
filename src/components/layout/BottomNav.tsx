import { useEffect, useState } from 'react';
import { CalendarDays, Calendar, LayoutList, BarChart2, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { TaskRepository } from '@/db/taskRepository';
import type { ViewId } from '@/types';

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'today',     label: 'Today',    icon: CalendarDays },
  { id: 'upcoming',  label: 'Upcoming', icon: Calendar     },
  { id: 'all',       label: 'All',      icon: LayoutList   },
  { id: 'dashboard', label: 'Stats',    icon: BarChart2    },
  { id: 'settings',  label: 'Settings', icon: Settings     },
];

export default function BottomNav() {
  const activeView   = useUIStore((s) => s.activeView);
  const setView      = useUIStore((s) => s.setView);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    TaskRepository.getToday().then((tasks) =>
      setTodayCount(tasks.filter((t) => t.status !== 'done').length)
    );
  }, [activeView]);

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 60,
      display: 'flex',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-default)',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3,
              border: 'none', background: 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-placeholder)',
              cursor: 'pointer',
              position: 'relative',
              padding: '4px 0',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>

            {id === 'today' && todayCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                left: '50%',
                transform: 'translateX(4px)',
                fontSize: 9, fontWeight: 700,
                padding: '1px 4px', borderRadius: 10,
                background: 'var(--accent)', color: '#fff',
                minWidth: 14, textAlign: 'center',
              }}>
                {todayCount > 99 ? '99+' : todayCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
