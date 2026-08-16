import { UserCircle, LogOut, Settings as SettingsIcon, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Menu, { MenuItem } from '@/components/ui/Menu';
import { useAuthStore } from '@/stores/authStore';

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/** Avatar in the Topbar — clicking it opens a drawer of account-related nav,
 *  matching the existing Menu/MenuItem pattern used by AddMenu. Contents
 *  differ for a signed-in account vs. a local-only guest session. */
export default function AvatarMenu() {
  const navigate = useNavigate();
  const mode   = useAuthStore((s) => s.mode);
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isAccount = mode === 'account' && !!user;

  return (
    <Menu
      align="right"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          title={isAccount ? user!.name : 'Guest · this device only'}
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            border: isAccount ? 'none' : '1px solid var(--border-default)',
            background: isAccount ? 'var(--accent)' : 'var(--bg-elevated)',
            color: isAccount ? '#fff' : 'var(--text-sub)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {isAccount ? (initialsOf(user!.name) || '?') : <UserCircle size={18} />}
        </button>
      )}
    >
      <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-default)', marginBottom: 4, minWidth: 170 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {isAccount ? user!.name : 'Guest'}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-sub)' }}>
          {isAccount ? user!.email : 'This device only'}
        </div>
      </div>

      {isAccount ? (
        <>
          <MenuItem onClick={() => navigate('/account')}>
            <SettingsIcon size={14} /> Account settings
          </MenuItem>
          <MenuItem onClick={() => { navigate('/login', { replace: true }); logout(); }}>
            <LogOut size={14} /> Sign out
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={() => navigate('/signup')}>
            <UserPlus size={14} /> Create free account
          </MenuItem>
          <MenuItem onClick={() => navigate('/login')}>
            <LogIn size={14} /> Log in
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
