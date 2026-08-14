import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import FAB from './FAB';
import Topbar from './Topbar';
import InstallBanner from '@/components/pwa/InstallBanner';
import TodayView from '@/components/views/TodayView';
import UpcomingView from '@/components/views/UpcomingView';
import AllView from '@/components/views/AllView';
import DashboardView from '@/components/views/DashboardView';
import ExpensesView from '@/components/views/ExpensesView';
import SettingsView from '@/components/views/SettingsView';

export default function Layout() {
  const activeView = useUIStore((s) => s.activeView);
  const isMobile   = useIsMobile();

  const views = {
    today:     <TodayView />,
    upcoming:  <UpcomingView />,
    all:       <AllView />,
    dashboard: <DashboardView />,
    expenses:  <ExpensesView />,
    settings:  <SettingsView />,
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar — desktop only */}
      {!isMobile && <Sidebar />}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Topbar />
        <InstallBanner />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px 16px 80px' : '24px',
        }}>
          {views[activeView]}
        </main>
      </div>

      {/* Mobile navigation */}
      {isMobile && <BottomNav />}
      {isMobile && <FAB />}
    </div>
  );
}
