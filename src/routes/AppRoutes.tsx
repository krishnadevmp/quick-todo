import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import RequireSession from './RequireSession';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import AccountPage from '@/pages/AccountPage';
import App from '@/App';

function RootRedirect() {
  const mode = useAuthStore((s) => s.mode);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  if (mode === null) return <Navigate to={hasOnboarded ? '/login' : '/signup'} replace />;
  return <Navigate to="/app" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireSession />}>
        <Route path="/app/*" element={<App />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
