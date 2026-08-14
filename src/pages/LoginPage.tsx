import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../services/api';
import { useAuth } from '../components/AuthContext';
import { brandAssets, brandCopy } from '../data/brand';
import type { OnboardingLookupResponse } from '../types/domain';

type LoginStage = 'lookup' | 'code' | 'password' | 'signin' | 'forgot';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<OnboardingLookupResponse | null>(null);
  const [matchedBioBookProfile, setMatchedBioBookProfile] = useState<string | null>(null);
  const [stage, setStage] = useState<LoginStage>('lookup');
  const [modal, setModal] = useState<{ title: string; body: string; action?: () => void } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const claimEmail = identifier.includes('@') ? identifier : `${identifier || 'username'}@wharton.upenn.edu`;

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMatchedBioBookProfile(null);
    try {
      const result = await api.lookupOnboarding(identifier);
      if (!result.exists) {
        setModal({
          title: 'Profile not found',
          body: 'This university email was not found in the WEMBA 52 BioBook data. You can continue by creating a new profile and consenting to store the submitted data.',
          action: () => navigate('/register', { state: { email: claimEmail, showConsent: true } }),
        });
        return;
      }
      setMatchedProfile(result);
      const bioBookResult = await api.lookupBioBook(identifier);
      setMatchedBioBookProfile(bioBookResult.profile ? JSON.stringify(bioBookResult.profile) : null);
      if (result.alreadyClaimed) {
        setPassword('');
        setConfirmPassword('');
        setError('This profile has already been claimed. Please enter your existing password.');
        setStage('signin');
        return;
      }
      setModal({
        title: 'Consent to store profile data',
        body: 'Your profile may be pre-populated with existing alumni details. By continuing, you agree to allow us to store and use your account and profile information to provide you with access to the alumni portal.',
        action: async () => {
          await api.recordConsent(identifier, 'biobook-code-claim');
          await api.sendOnboardingCode(identifier);
          setVerificationCode('');
          setStage('code');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify your BioBook record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.verifyOnboardingCode(identifier, verificationCode);
      setStage('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify that code.');
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
      const session = await api.claimWithCode(identifier, verificationCode, password);
      if (matchedBioBookProfile) {
        localStorage.setItem('wharton.biobookProfile', matchedBioBookProfile);
      }
      setSession(session.token, session.profile);
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
      const session = await api.login(identifier.includes('@') ? identifier : claimEmail, password);
      setSession(session.token, session.profile);
      navigate('/dashboard');
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
        onSubmit={stage === 'signin' ? handlePasswordSignIn : stage === 'password' ? handleClaim : stage === 'code' ? handleVerifyCode : stage === 'forgot' ? handleForgotPassword : handleLookup}
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
          {stage === 'lookup' && 'Enter the university email username to claim your profile.'}
          {stage === 'code' && 'Enter the email verification code sent for this BioBook profile.'}
          {stage === 'password' && 'Create a password to claim the verified prefilled profile.'}
          {stage === 'signin' && 'Sign in with an existing portal password.'}
          {stage === 'forgot' && 'Send a password reset link to the university email.'}
        </p>

        <label>
          University email username
          <div className="email-suffix-field">
            <input
              value={identifier}
              maxLength={identifier.includes('@') ? undefined : 40}
              onChange={(event) => setIdentifier(event.target.value.slice(0, event.target.value.includes('@') ? undefined : 40))}
              placeholder="first.last"
              required
            />
            {!identifier.includes('@') && <span>@wharton.upenn.edu</span>}
          </div>
        </label>

        {stage === 'code' && (
          <>
            <label>
              Verification code
              <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" minLength={6} maxLength={6} required />
            </label>
          </>
        )}

        {(stage === 'password' || stage === 'signin') && (
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={stage === 'password' ? 8 : 6} required />
          </label>
        )}

        {stage === 'password' && (
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <button className="button primary" disabled={loading}>
          {loading ? 'Working...' : stage === 'lookup' ? 'Continue' : stage === 'code' ? 'Verify code' : stage === 'password' ? 'Claim profile' : stage === 'forgot' ? 'Send reset link' : 'Log in'}
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
