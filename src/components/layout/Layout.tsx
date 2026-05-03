import { useUIStore } from '@/stores/uiStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import TodayView from '@/components/views/TodayView';
import UpcomingView from '@/components/views/UpcomingView';
import AllView from '@/components/views/AllView';
import DashboardView from '@/components/views/DashboardView';
import SettingsView from '@/components/views/SettingsView';

export default function Layout() {
  const activeView = useUIStore((s) => s.activeView);

  const views = {
    today: <TodayView />,
    upcoming: <UpcomingView />,
    all: <AllView />,
    dashboard: <DashboardView />,
    settings: <SettingsView />,
  };

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {views[activeView]}
        </main>
      </div>
    </div>
  );
}
