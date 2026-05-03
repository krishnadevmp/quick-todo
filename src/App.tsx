import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import Layout from '@/components/layout/Layout';
import QuickAddOverlay from '@/components/quickadd/QuickAddOverlay';

export default function App() {
  const applyTheme = useSettingsStore((s) => s.applyTheme);
  const isQuickAddOpen = useUIStore((s) => s.isQuickAddOpen);

  // Apply persisted theme on first render
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <>
      <Layout />
      {isQuickAddOpen && <QuickAddOverlay />}
    </>
  );
}
