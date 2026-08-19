import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../components/AuthContext';
import { PasswordField } from '../components/PasswordField';
import { brandAssets, brandCopy } from '../data/brand';
import type { BioBookProfile, OnboardingLookupResponse } from '../types/domain';

type LoginStage = 'lookup' | 'code' | 'record' | 'recordCode' | 'signin' | 'forgot';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [recordFullName, setRecordFullName] = useState('');
  const [recordVerificationCode, setRecordVerificationCode] = useState('');
  const [recordCodeDestination, setRecordCodeDestination] = useState('');
  const [activeOnboardingEmail, setActiveOnboardingEmail] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<OnboardingLookupResponse | null>(null);
  const [matchedBioBookProfile, setMatchedBioBookProfile] = useState<BioBookProfile | null>(null);
  const [stage, setStage] = useState<LoginStage>('lookup');
  const [modal, setModal] = useState<{ title: string; body: string; actionLabel?: string; action?: () => void } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const localEmailPart = normalizedIdentifier.split('@')[0];
  const claimEmail = `${localEmailPart}@wharton.upenn.edu`;
  const flowEmail = activeOnboardingEmail || claimEmail;

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    if (normalizedIdentifier.includes('@') && !normalizedIdentifier.endsWith('@wharton.upenn.edu')) {
      setError('Please enter your Wharton university email id.');
      return;
    }
    setLoading(true);
    setError('');
    setMatchedBioBookProfile(null);
    try {
      const result = await api.lookupOnboarding(claimEmail);
      setMatchedProfile(result);

      if (result.exists && result.alreadyClaimed) {
        setPassword('');
        setError('This profile has already been claimed. Please enter your existing password.');
        setStage('signin');
        return;
      }

      await handleSendVerificationCode(claimEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the login flow.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendVerificationCode(email = flowEmail) {
    setLoading(true);
    setError('');
    try {
      setActiveOnboardingEmail(email);
      await api.sendOnboardingCode(email);
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
      await api.verifyOnboardingCode(flowEmail, verificationCode.trim());
      setStage('record');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFindRecord(event: FormEvent) {
    event.preventDefault();
    if (!recordFullName.trim()) {
      setError('Enter your full name so we can check for a matching class record.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.findOnboardingRecord({
        fullName: recordFullName.trim(),
      });
      if (result.found && result.destination) {
        setRecordVerificationCode('');
        setRecordCodeDestination(result.destination);
        setStage('recordCode');
        return;
      }

      setModal({
        title: 'Create your profile',
        body: 'We could not find a matching BioBook record from those details. You can still create a profile for the alumni portal.',
        actionLabel: 'Create profile',
        action: async () => {
          await api.recordConsent(flowEmail, 'manual-registration');
          navigate('/register', {
            state: {
              email: flowEmail,
              showConsent: false,
              createProfile: true,
            },
          });
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to look up your class record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyRecordCode(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(recordVerificationCode.trim())) {
      setError('Enter the 6-digit verification code sent to your personal email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyOnboardingRecord(recordFullName.trim(), recordVerificationCode.trim());
      if (!result.exists || !result.profile) {
        throw new Error('We could not verify that BioBook record.');
      }
      setMatchedBioBookProfile(result.profile);
      setModal({
        title: 'Consent to store profile data',
        body: 'Your profile may be pre-populated with existing alumni details. By continuing, you agree to allow us to store and use your account and profile information to provide you with access to the alumni portal.',
        actionLabel: 'Continue',
        action: async () => {
          await api.recordConsent(flowEmail, 'biobook-claim');
          navigate('/register', {
            state: {
              email: flowEmail,
              showConsent: false,
              bioBookProfile: result.profile,
            },
          });
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the Verification Code.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSignIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = claimEmail;
      if (normalizedIdentifier.includes('@') && !normalizedIdentifier.endsWith('@wharton.upenn.edu')) {
        setError('Please enter your Wharton university email id.');
        setLoading(false);
        return;
      }
      const session = await api.login(email, password);
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
    if (normalizedIdentifier.includes('@') && !normalizedIdentifier.endsWith('@wharton.upenn.edu')) {
      setError('Please enter your Wharton university email id.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reset = await api.sendPasswordReset(claimEmail);
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
        onSubmit={stage === 'signin' ? handlePasswordSignIn : stage === 'code' ? handleVerifyCode : stage === 'record' ? handleFindRecord : stage === 'recordCode' ? handleVerifyRecordCode : stage === 'forgot' ? handleForgotPassword : handleLookup}
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
          {stage === 'record' && 'Enter your full name so we can look for a matching BioBook record.'}
          {stage === 'recordCode' && `We found your record. Please enter the verification code sent to ${recordCodeDestination} to claim your profile.`}
          {stage === 'signin' && 'Sign in with an existing portal password.'}
          {stage === 'forgot' && 'Send a password reset link to the university email.'}
        </p>

        <label>
          Enter your university email id
          <div className="email-suffix-field">
            <input
              value={identifier}
              maxLength={60}
              onChange={(event) => setIdentifier(event.target.value.split('@')[0].slice(0, 60))}
              placeholder="your email id"
              disabled={stage === 'code' || stage === 'record' || stage === 'recordCode'}
              required
            />
            <span>@wharton.upenn.edu</span>
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

        {stage === 'record' && (
          <label>
            Full name
            <input
              value={recordFullName}
              onChange={(event) => setRecordFullName(event.target.value)}
              placeholder="As it appears in the BioBook"
              required
            />
          </label>
        )}

        {stage === 'recordCode' && (
          <label>
            Verification Code
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={recordVerificationCode}
              onChange={(event) => setRecordVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
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
          {loading ? 'Working...' : stage === 'lookup' ? 'Login' : stage === 'code' ? 'Verify code' : stage === 'record' ? 'Find my record' : stage === 'recordCode' ? 'Claim profile' : stage === 'forgot' ? 'Send reset link' : 'Log in'}
        </button>

        {stage === 'code' && (
          <button type="button" className="button ghost" disabled={loading} onClick={() => handleSendVerificationCode(flowEmail)}>
            Send verification code again
          </button>
        )}

        {stage === 'signin' && (
          <button type="button" className="button ghost" disabled={loading} onClick={() => { setStage('forgot'); setError(''); }}>
            Forgot password
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
