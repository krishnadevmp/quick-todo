import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Field } from '@/components/auth/formFields';
import { fieldControl } from '@/components/auth/formStyles';
import { useAuthStore } from '@/stores/authStore';
import { getLastPulledAt, pendingCount, syncNow } from '@/sync/syncEngine';
import { toast } from '@/components/ui/Toast';
import { ApiError } from '@/api/client';

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--text-sub)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 14,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 20px', borderBottom: '1px solid var(--border-default)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [changingPw, setChangingPw] = useState(false);

  const [pending, setPending] = useState(0);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refreshSyncStatus = async () => {
    setPending(await pendingCount());
    setLastSynced(getLastPulledAt());
  };

  useEffect(() => { refreshSyncStatus(); }, []);

  if (!user) return null; // RequireSession guarantees this only renders in account mode

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : 'Could not change password');
    } finally {
      setChangingPw(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncNow();
      toast.success('Synced');
    } catch {
      toast.error("Couldn't sync — check your connection");
    } finally {
      setSyncing(false);
      refreshSyncStatus();
    }
  };

  const handleSignOut = () => {
    // Navigate first: logout() flips authStore.mode to null, and
    // RequireSession (still guarding this route) redirects a null mode to
    // /signup — if that ran before this navigation took effect, it would
    // win the race and strand the user on /signup instead of /login.
    navigate('/login', { replace: true });
    logout();
  };

  const initials = user.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 24px', borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-surface)',
      }}>
        <Button variant="ghost" iconOnly size="md" onClick={() => navigate('/app')} title="Back">
          <ArrowLeft size={16} />
        </Button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Account settings
        </h1>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Profile */}
        <Section title="Profile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, flexShrink: 0,
            }}>
              {initials || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{user.email}</div>
            </div>
          </div>
          <div style={card}>
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Member since</span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-placeholder)', margin: '8px 4px 0' }}>
            Name and email can't be changed yet.
          </p>
        </Section>

        {/* Data & Sync */}
        <Section title="Data & Sync">
          <div style={card}>
            <Row label="Pending changes" value={pending === 0 ? 'All synced' : `${pending} waiting to sync`} />
            <div style={{
              padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                {lastSynced ? `Last synced ${new Date(lastSynced).toLocaleTimeString()}` : 'Not synced yet this session'}
              </span>
              <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={syncing}>
                <RefreshCw size={12} className={syncing ? 'spin' : undefined} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </Button>
            </div>
          </div>
        </Section>

        {/* Change password */}
        <Section title="Change password">
          <form onSubmit={handleChangePassword} style={{ ...card, padding: '18px 20px' }}>
            <Field label="Current password">
              <input
                style={fieldControl} type="password" autoComplete="current-password"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              />
            </Field>
            <Field label="New password">
              <input
                style={fieldControl} type="password" autoComplete="new-password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters" required
              />
            </Field>
            {pwError && (
              <p style={{ fontSize: 12.5, color: 'var(--priority-high)', margin: '0 0 12px' }}>{pwError}</p>
            )}
            <Button type="submit" variant="primary" disabled={changingPw}>
              {changingPw ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Section>

        {/* Sign out */}
        <Section title="Session">
          <div style={card}>
            <div style={{ padding: '14px 20px' }}>
              <Button variant="danger" onClick={handleSignOut} style={{ width: '100%' }}>
                Sign out
              </Button>
            </div>
          </div>
        </Section>

        <p style={{ textAlign: 'center', fontSize: 12.5 }}>
          <Link to="/app" style={{ color: 'var(--accent)', fontWeight: 600 }}>Back to app</Link>
        </p>
      </div>

      <style>{`
        @keyframes quick-todo-spin { to { transform: rotate(360deg); } }
        .spin { animation: quick-todo-spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
