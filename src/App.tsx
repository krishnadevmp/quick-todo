import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { TaskRepository } from '@/db/taskRepository';
import { schedulePendingNotifications } from '@/utils/notificationScheduler';
import Layout from '@/components/layout/Layout';
import QuickAddOverlay from '@/components/quickadd/QuickAddOverlay';
import EditTaskOverlay from '@/components/task/EditTaskOverlay';
import ExpenseFormOverlay from '@/components/expense/ExpenseFormOverlay';
import { ToastContainer } from '@/components/ui/Toast';

export default function App() {
  const applyTheme            = useSettingsStore((s) => s.applyTheme);
  const refreshPermissionState = useSettingsStore((s) => s.refreshPermissionState);
  const notificationPermission = useSettingsStore((s) => s.notificationPermission);
  const isQuickAddOpen        = useUIStore((s) => s.isQuickAddOpen);
  const editingTask           = useUIStore((s) => s.editingTask);
  const isAddExpenseOpen      = useUIStore((s) => s.isAddExpenseOpen);
  const editingExpense        = useUIStore((s) => s.editingExpense);

  // Apply persisted theme on first render
  useEffect(() => { applyTheme(); }, [applyTheme]);

  // Sync browser permission state on mount (handles the case where the user
  // changed it in browser settings between sessions)
  useEffect(() => { refreshPermissionState(); }, [refreshPermissionState]);

  // Whenever permission becomes 'granted', load all tasks from the DB and
  // schedule their notifications for this session
  useEffect(() => {
    if (notificationPermission === 'granted') {
      TaskRepository.getAll().then(schedulePendingNotifications);
    }
  }, [notificationPermission]);

  return (
    <>
      <Layout />
      {isQuickAddOpen   && <QuickAddOverlay />}
      {editingTask      && <EditTaskOverlay task={editingTask} />}
      {isAddExpenseOpen && <ExpenseFormOverlay />}
      {editingExpense   && <ExpenseFormOverlay expense={editingExpense} />}
      <ToastContainer />
    </>
  );
}
