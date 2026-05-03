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
    today:     <TodayView />,
    upcoming:  <UpcomingView />,
    all:       <AllView />,
    dashboard: <DashboardView />,
    settings:  <SettingsView />,
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {views[activeView]}
        </main>
      </div>
    </div>
  );
}
