import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import { Field } from '@/components/auth/formFields';
import { fieldControl } from '@/components/auth/formStyles';
import ImportGuestDataDialog from '@/components/auth/ImportGuestDataDialog';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useGuestImportPrompt } from '@/hooks/useGuestImportPrompt';
import { ApiError } from '@/api/client';

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const { pendingImport, afterAuth, confirmImport, skipImport } = useGuestImportPrompt();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      await afterAuth();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Sign up failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sync your tasks and expenses across every device."
      footer={
        <>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field label="Name">
          <input
            style={fieldControl}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Email">
          <input
            style={fieldControl}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <input
            style={fieldControl}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirm password">
          <input
            style={fieldControl}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            required
          />
        </Field>

        {formError && (
          <p style={{ fontSize: 12.5, color: 'var(--priority-high)', margin: '2px 0 14px' }}>{formError}</p>
        )}

        <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', marginTop: 4 }}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div style={{
        marginTop: 20, paddingTop: 18,
        borderTop: '1px solid var(--border-default)',
        textAlign: 'center',
      }}>
        <Button
          variant="outline"
          style={{ width: '100%' }}
          onClick={() => { continueAsGuest(); navigate('/app'); }}
        >
          Continue without an account
        </Button>
        <p style={{ fontSize: 11.5, color: 'var(--text-placeholder)', margin: '10px 0 0', lineHeight: 1.5 }}>
          Your data will be stored only on this device and won't sync anywhere else.
        </p>
      </div>

      {pendingImport && (
        <ImportGuestDataDialog summary={pendingImport} onImport={confirmImport} onSkip={skipImport} />
      )}
    </AuthLayout>
  );
}
