import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setActiveScope } from '@/db/schema';
import { hasGuestData, importGuestData, type GuestDataSummary } from '@/sync/guestImport';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/Toast';

/**
 * Shared post-signup/post-login flow: switch to the account's own local
 * database, check whether the guest database has anything worth offering
 * to import, then either show the confirm dialog or go straight to /app.
 * Used by both SignupPage and LoginPage.
 */
export function useGuestImportPrompt() {
  const navigate = useNavigate();
  const [pendingImport, setPendingImport] = useState<GuestDataSummary | null>(null);

  const afterAuth = async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    setActiveScope(user.id);

    const summary = await hasGuestData().catch(() => null);
    if (summary) {
      setPendingImport(summary);
    } else {
      navigate('/app');
    }
  };

  const confirmImport = async () => {
    try {
      const result = await importGuestData();
      toast.success(
        `Imported ${result.tasks} task${result.tasks !== 1 ? 's' : ''} and ${result.expenses} expense${result.expenses !== 1 ? 's' : ''}`
      );
    } catch {
      toast.error('Some data could not be imported — you can try again later from Account settings.');
    } finally {
      setPendingImport(null);
      navigate('/app');
    }
  };

  const skipImport = () => {
    setPendingImport(null);
    navigate('/app');
  };

  return { pendingImport, afterAuth, confirmImport, skipImport };
}
