import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../components/AuthContext';
import { PasswordField } from '../components/PasswordField';
import { brandAssets, brandCopy } from '../data/brand';
import type { BioBookProfile, OnboardingLookupResponse } from '../types/domain';

type LoginStage = 'lookup' | 'code' | 'signin' | 'forgot' | 'create';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<OnboardingLookupResponse | null>(null);
  const [matchedBioBookProfile, setMatchedBioBookProfile] = useState<BioBookProfile | null>(null);
  const [stage, setStage] = useState<LoginStage>('lookup');
  const [modal, setModal] = useState<{ title: string; body: string; actionLabel?: string; action?: () => void } | null>(null);
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
      const [result, bioBookResult] = await Promise.all([
        api.lookupOnboarding(identifier),
        api.lookupBioBook(identifier),
      ]);
      setMatchedProfile(result);

      if (result.exists && result.alreadyClaimed) {
        setPassword('');
        setError('This profile has already been claimed. Please enter your existing password.');
        setStage('signin');
        return;
      }

      if (bioBookResult.exists && bioBookResult.profile) {
        setMatchedBioBookProfile(bioBookResult.profile);
        setModal({
          title: 'Consent to store profile data',
          body: 'Your profile may be pre-populated with existing alumni details. By continuing, you agree to allow us to store and use your account and profile information to provide you with access to the alumni portal.',
          actionLabel: 'Continue',
          action: async () => {
            await api.recordConsent(identifier, 'biobook-claim');
            await handleSendVerificationCode();
          },
        });
        return;
      }

      setStage('create');
      setError('This email does not exist in the BioBook yet. Please create a profile below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify your BioBook record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendVerificationCode() {
    setLoading(true);
    setError('');
    try {
      await api.sendOnboardingCode(identifier);
      setVerificationCode('');
      setStage('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.verifyOnboardingCode(identifier, verificationCode.trim());
      navigate('/register', {
        state: {
          email: claimEmail,
          showConsent: false,
          bioBookProfile: matchedBioBookProfile,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the code. Please try again.');
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
        body: `If an account exists, password reset instructions have been sent to ${reset.destination}. Please follow the password reset link in that email. After you reset your password, return here and log in with the new password.`,
        actionLabel: 'Got it',
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
        onSubmit={stage === 'signin' ? handlePasswordSignIn : stage === 'code' ? handleVerifyCode : stage === 'forgot' ? handleForgotPassword : handleLookup}
      >
        <div>
          <img src={brandAssets.executiveMbaLogo} alt="Wharton Executive MBA" className="auth-lockup" />
          <p className="eyebrow">Alumni access</p>
          <h1>{brandCopy.productName} network</h1>
        </div>

        {matchedProfile && stage === 'signin' && (
          <div className="claim-match">
            <span className="badge crimson">{matchedProfile.batch}</span>
            <h2>{matchedProfile.fullLegalName}</h2>
            <p className="muted">{matchedProfile.currentTitleRole} at {matchedProfile.currentEmployer}</p>
          </div>
        )}

        <p className="muted">
          {stage === 'lookup' && 'Enter your university email to check if your prefilled WEMBA alumni record is available.'}
          {stage === 'code' && 'Enter the 6-digit verification code sent to your university email.'}
          {stage === 'signin' && 'Sign in with an existing portal password.'}
          {stage === 'forgot' && 'Send a password reset link to the university email.'}
          {stage === 'create' && 'This email does not exist in the BioBook yet. Please create a profile below.'}
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
          <label>
            Verification code
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
            />
          </label>
        )}

        {stage === 'signin' && (
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            minLength={6}
            required
          />
        )}

        {error && <p className="form-error">{error}</p>}

        <button
          className="button primary"
          disabled={loading}
        >
          {loading ? 'Working...' : stage === 'lookup' || stage === 'create' ? 'Login' : stage === 'code' ? 'Verify code' : stage === 'forgot' ? 'Send reset link' : 'Log in'}
        </button>

        {stage === 'code' && (
          <button type="button" className="button ghost" disabled={loading} onClick={handleSendVerificationCode}>
            Send verification code again
          </button>
        )}

        {stage === 'signin' && (
          <button type="button" className="button ghost" disabled={loading} onClick={() => { setStage('forgot'); setError(''); }}>
            Forgot password
          </button>
        )}

        {stage === 'create' && (
          <button
            type="button"
            className="button ghost"
            disabled={loading}
            onClick={() => {
              setModal({
                title: 'Consent to create your profile',
                body: 'The profile can be prefilled from previously fetched information. By continuing, you consent to storing this account and profile data for the alumni portal experience.',
                actionLabel: 'Continue to profile creation',
                action: () => navigate('/register', { state: { email: claimEmail, showConsent: false } }),
              });
            }}
          >
            Create profile
          </button>
        )}

        <button
          type="button"
          className="button text"
          disabled={loading}
          onClick={() => {
            setError('');
            setStage('signin');
          }}
        >
          Already registered? Sign in
        </button>

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
                {modal.actionLabel ?? 'Continue'}
              </button>
              <button className="button ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
