import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { setActiveScope } from '@/db/schema';
import { pullFromServer, startAutoSync } from '@/sync/syncEngine';

function Splash() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'var(--accent)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700,
        animation: 'quick-todo-pulse 1.1s ease-in-out infinite',
      }}>
        Q
      </div>
      <style>{`@keyframes quick-todo-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

/**
 * Guards /app and /account. Resolves which local Dexie database is active
 * for the current auth mode (guest vs a specific account), runs the initial
 * server pull for signed-in sessions, and starts the background sync loop
 * — all before rendering children, so views never flash stale/empty data.
 */
export default function RequireSession() {
  const mode  = useAuthStore((s) => s.mode);
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    (async () => {
      if (mode === 'account' && token && userId) {
        setActiveScope(userId);
        await refreshMe(); // validates the token; logs out on a 401
        if (!cancelled && useAuthStore.getState().token) {
          await pullFromServer();
          startAutoSync();
        }
      } else if (mode === 'guest') {
        setActiveScope('guest');
      }
      if (!cancelled) setReady(true);
    })();

    return () => { cancelled = true; };
  }, [mode, token, userId, refreshMe]);

  // hasOnboarded tells apart "brand new visitor" (→ signup) from "just
  // signed out of an account they already had" (→ login) — both look like
  // mode===null otherwise. Using the same target here as the explicit
  // navigate() calls in AvatarMenu/AccountPage's sign-out handlers also
  // means the two can never visibly race each other to different URLs.
  if (mode === null) return <Navigate to={hasOnboarded ? '/login' : '/signup'} replace />;
  if (mode === 'account' && !token) return <Navigate to="/login" replace />;
  if (mode === 'guest' && location.pathname.startsWith('/account')) {
    return <Navigate to="/signup" replace />;
  }
  if (!ready) return <Splash />;

  return <Outlet />;
}
