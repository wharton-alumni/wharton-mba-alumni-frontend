import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../services/api';
import { useAuth } from '../components/AuthContext';
import { brandAssets, brandCopy } from '../data/brand';
import type { BioBookProfile } from '../types/domain';

type LoginStage = 'lookup' | 'password' | 'signin' | 'forgot';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<BioBookProfile | null>(null);
  const [stage, setStage] = useState<LoginStage>('lookup');
  const [modal, setModal] = useState<{ title: string; body: string; action?: () => void } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const universityEmail = `${identifier || 'username'}@wharton.upenn.edu`;

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.lookupBioBook(identifier);
      if (!result.exists || !result.profile) {
        setModal({
          title: 'Profile not found',
          body: 'This university email was not found in the WEMBA 52 BioBook data. You can continue by creating a new profile and consenting to store the submitted data.',
          action: () => navigate('/register', { state: { email: universityEmail, showConsent: true } }),
        });
        return;
      }
      setMatchedProfile(result.profile);
      setModal({
        title: 'Consent to store profile data',
        body: 'The profile can be prefilled from WEMBA 52 BioBook data. By continuing, you consent to storing this account and profile data for the alumni portal experience.',
        action: () => {
          api.recordConsent(identifier, 'biobook-claim');
          setStage('password');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify your BioBook record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await api.claimBioBook(identifier, password);
      setSession(session.token, session.profile);
      localStorage.setItem('wharton.biobookProfile', JSON.stringify(session.biobookProfile));
      navigate('/claim-profile');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 403)) {
        setError('This profile has already been claimed. Please log in with your existing password.');
        setPassword('');
        setConfirmPassword('');
        setStage('signin');
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to claim your BioBook profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSignIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await api.login(identifier.includes('@') ? identifier : universityEmail, password);
      setSession(session.token, session.profile);
      navigate('/directory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const reset = await api.sendPasswordReset(identifier);
      setModal({
        title: 'Reset link sent',
        body: `If an account exists, password reset instructions have been sent to ${reset.destination}.`,
        action: () => setStage('signin'),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form
        className="panel auth-panel"
        onSubmit={stage === 'signin' ? handlePasswordSignIn : stage === 'password' ? handleClaim : stage === 'forgot' ? handleForgotPassword : handleLookup}
      >
        <div>
          <img src={brandAssets.executiveMbaLogo} alt="Wharton Executive MBA" className="auth-lockup" />
          <p className="eyebrow">Alumni access</p>
          <h1>{brandCopy.productName} network</h1>
        </div>

        {matchedProfile && stage !== 'signin' && stage !== 'forgot' && (
          <div className="claim-match">
            <span className="badge crimson">{matchedProfile.batch}</span>
            <h2>{matchedProfile.fullLegalName}</h2>
            <p className="muted">{matchedProfile.currentTitleRole} at {matchedProfile.currentEmployer}</p>
          </div>
        )}

        <p className="muted">
          {stage === 'lookup' && 'Enter the university email username to check WEMBA 52 BioBook access.'}
          {stage === 'password' && 'Create a password to claim the prefilled profile.'}
          {stage === 'signin' && 'Sign in with an existing portal password.'}
          {stage === 'forgot' && 'Send a password reset link to the university email.'}
        </p>

        <label>
          University email username
          <div className="email-suffix-field">
            <input
              value={identifier}
              maxLength={stage === 'signin' && identifier.includes('@') ? undefined : 20}
              onChange={(event) => setIdentifier(event.target.value.slice(0, stage === 'signin' && event.target.value.includes('@') ? undefined : 20))}
              placeholder="first.last"
              required
            />
            {!identifier.includes('@') && <span>@wharton.upenn.edu</span>}
          </div>
        </label>

        {(stage === 'password' || stage === 'signin') && (
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          </label>
        )}

        {stage === 'password' && (
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <button className="button primary" disabled={loading}>
          {loading ? 'Working...' : stage === 'lookup' ? 'Continue' : stage === 'password' ? 'Claim profile' : stage === 'forgot' ? 'Send reset link' : 'Log in'}
        </button>

        <div className="auth-alt-actions">
          <button type="button" className="button ghost" onClick={() => { setStage(stage === 'signin' ? 'lookup' : 'signin'); setError(''); }}>
            {stage === 'signin' ? 'Back to BioBook lookup' : 'Already claimed? Log in'}
          </button>
          <button type="button" className="button ghost" onClick={() => { setStage('forgot'); setError(''); }}>
            Forgot password
          </button>
        </div>
        <p className="muted">New here? <Link to="/register" state={{ showConsent: true }}>Create a profile</Link></p>
      </form>

      {modal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="panel modal-panel">
            <p className="eyebrow">Action required</p>
            <h2>{modal.title}</h2>
            <p>{modal.body}</p>
            <div className="action-stack">
              <button
                className="button primary"
                onClick={() => {
                  const action = modal.action;
                  setModal(null);
                  action?.();
                }}
              >
                Continue
              </button>
              <button className="button ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
