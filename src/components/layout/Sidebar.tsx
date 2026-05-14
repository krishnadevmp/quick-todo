import { useEffect, useState } from 'react';
import { CalendarDays, Calendar, LayoutList, BarChart2, Settings, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
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

function NavItem({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px',
        marginBottom: 2,
        borderRadius: 8, border: 'none',
        background: pressed
          ? 'var(--bg-chip)'
          : active
          ? 'var(--accent-soft)'
          : hovered
          ? 'var(--bg-elevated)'
          : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-sub)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.12s, color 0.12s, opacity 0.1s',
        opacity: pressed ? 0.75 : 1,
      }}
    >
      {children}
    </button>
  );
}

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
        <Button variant="primary" onClick={openQuickAdd}
          style={{ width: '100%', borderRadius: 9, padding: '9px 12px' }}>
          <Plus size={15} strokeWidth={2.5} />
          Add Task
        </Button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;
          return (
            <NavItem key={id} active={active} onClick={() => setView(id)}>
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
            </NavItem>
          );
        })}
      </nav>
    </aside>
  );
}
