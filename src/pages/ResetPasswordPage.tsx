import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PasswordField } from '../components/PasswordField';
import { brandAssets, brandCopy } from '../data/brand';
import { api } from '../services/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is missing a token. Please request a new password reset link.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel auth-panel" onSubmit={handleSubmit}>
        <div>
          <img src={brandAssets.executiveMbaLogo} alt="Wharton Executive MBA" className="auth-lockup" />
          <p className="eyebrow">Password reset</p>
          <h1>{complete ? 'Password updated' : `Reset your ${brandCopy.productName} password`}</h1>
        </div>

        {complete ? (
          <>
            <p className="muted">Your password has been updated. You can now log in with the new password.</p>
            <button type="button" className="button primary" onClick={() => navigate('/login')}>
              Go to login
            </button>
          </>
        ) : (
          <>
            <p className="muted">Create a new password for your alumni portal account.</p>
            <PasswordField label="New password" value={password} onChange={setPassword} minLength={8} required />
            <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} minLength={8} required />
            {error && <p className="form-error">{error}</p>}
            <button className="button primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
            <p className="muted"><Link to="/login">Back to login</Link></p>
          </>
        )}
      </form>
    </section>
  );
}
