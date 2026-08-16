import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { GuestDataSummary } from '@/sync/guestImport';

interface ImportGuestDataDialogProps {
  summary: GuestDataSummary;
  onImport: () => Promise<void>;
  onSkip: () => void;
}

/** Shown right after a successful signup/login when local guest data exists. */
export default function ImportGuestDataDialog({ summary, onImport, onSkip }: ImportGuestDataDialogProps) {
  const [importing, setImporting] = useState(false);

  const parts = [
    summary.tasks > 0 && `${summary.tasks} task${summary.tasks !== 1 ? 's' : ''}`,
    summary.expenses > 0 && `${summary.expenses} expense${summary.expenses !== 1 ? 's' : ''}`,
  ].filter(Boolean) as string[];

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-overlay)', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '24px 22px',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Import local data?
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.5, margin: '0 0 20px' }}>
          We found {parts.join(' and ')} stored on this device from before you signed in.
          Import them into your account so they sync across devices too?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onSkip} disabled={importing}>
            Skip
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
