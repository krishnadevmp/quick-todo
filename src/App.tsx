import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import Layout from '@/components/layout/Layout';
import QuickAddOverlay from '@/components/quickadd/QuickAddOverlay';
import EditTaskOverlay from '@/components/task/EditTaskOverlay';
import { ToastContainer } from '@/components/ui/Toast';

export default function App() {
  const applyTheme     = useSettingsStore((s) => s.applyTheme);
  const isQuickAddOpen = useUIStore((s) => s.isQuickAddOpen);
  const editingTask    = useUIStore((s) => s.editingTask);

  // Apply persisted theme on first render
  useEffect(() => { applyTheme(); }, [applyTheme]);

  return (
    <>
      <Layout />
      {isQuickAddOpen && <QuickAddOverlay />}
      {editingTask    && <EditTaskOverlay task={editingTask} />}
      <ToastContainer />
    </>
  );
}
