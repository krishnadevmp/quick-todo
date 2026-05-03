import { useEffect, useState } from 'react';
import { CalendarDays, Calendar, LayoutList, BarChart2, Settings, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { TaskRepository } from '@/db/taskRepository';
import type { ViewId } from '@/types';

const NAV_ITEMS: {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: 'today',     label: 'Today',     icon: CalendarDays },
  { id: 'upcoming',  label: 'Upcoming',  icon: Calendar     },
  { id: 'all',       label: 'All Tasks', icon: LayoutList   },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2    },
  { id: 'settings',  label: 'Settings',  icon: Settings     },
];

export default function Sidebar() {
  const activeView = useUIStore((s) => s.activeView);
  const setView    = useUIStore((s) => s.setView);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    TaskRepository.getToday().then((tasks) =>
      setTodayCount(tasks.filter((t) => t.status !== 'done').length)
    );
  }, [activeView]);

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid var(--border-default)',
      background: 'var(--bg-surface)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '20px 16px 16px',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          Q
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          Quick Todo
        </span>
      </div>

      {/* Add Task button */}
      <div style={{ padding: '0 12px 16px' }}>
        <button
          onClick={openQuickAdd}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px 12px',
            borderRadius: 9, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Task
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                marginBottom: 2,
                borderRadius: 8, border: 'none',
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-sub)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              <span style={{ flex: 1 }}>{label}</span>

              {/* Today count badge */}
              {id === 'today' && todayCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 20,
                  background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: active ? '#fff' : 'var(--text-sub)',
                  minWidth: 18, textAlign: 'center',
                }}>
                  {todayCount > 99 ? '99+' : todayCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
