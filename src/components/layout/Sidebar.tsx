import { useEffect, useState } from 'react';
import { CalendarDays, Calendar, LayoutList, BarChart2, Settings, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { TaskRepository } from '@/db/taskRepository';
import type { ViewId } from '@/types';

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'today',     label: 'Today',     icon: CalendarDays },
  { id: 'upcoming',  label: 'Upcoming',  icon: Calendar },
  { id: 'all',       label: 'All Tasks', icon: LayoutList },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  // Live today-count badge
  const [todayCount, setTodayCount] = useState(0);
  useEffect(() => {
    const refresh = async () => {
      const tasks = await TaskRepository.getToday();
      setTodayCount(tasks.filter((t) => t.status !== 'done').length);
    };
    refresh();
    // Re-check every time the view changes (task may have been added/completed)
  }, [activeView]);

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full border-r"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Q
        </div>
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Quick Todo
        </span>
      </div>

      {/* Quick Add button */}
      <div className="px-3 pb-4">
        <button
          onClick={openQuickAdd}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Task
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors cursor-pointer text-left"
              style={{
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-sub)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ flex: 1 }}>{label}</span>

              {/* Badge for Today count */}
              {id === 'today' && todayCount > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: '2px 5px',
                  borderRadius: 20,
                  background: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: isActive ? '#fff' : 'var(--text-sub)',
                  minWidth: 16,
                  textAlign: 'center',
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
