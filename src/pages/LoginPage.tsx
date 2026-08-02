import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../components/AuthContext';
import { brandAssets, brandCopy } from '../data/brand';
import type { BioBookProfile } from '../types/domain';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<BioBookProfile | null>(null);
  const [passwordSignIn, setPasswordSignIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.lookupBioBook(email);
      if (!result.exists || !result.profile) {
        navigate('/register', { state: { email } });
        return;
      }
      setMatchedProfile(result.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify your BioBook record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await api.claimBioBook(email, password);
      setSession(session.token, session.profile);
      localStorage.setItem('wharton.biobookProfile', JSON.stringify(session.biobookProfile));
      navigate('/claim-profile');
    } catch (err) {
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
      const session = await api.login(email, password);
      setSession(session.token, session.profile);
      navigate('/directory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel auth-panel" onSubmit={passwordSignIn ? handlePasswordSignIn : matchedProfile ? handleClaimSubmit : handleEmailSubmit}>
        <div>
          <img src={brandAssets.executiveMbaLogo} alt="Wharton Executive MBA" className="auth-lockup" />
          <p className="eyebrow">Alumni access</p>
          <h1>{brandCopy.productName} network</h1>
        </div>
        {passwordSignIn ? (
          <p className="muted">Sign in with the password you created when you claimed your profile.</p>
        ) : matchedProfile ? (
          <div className="claim-match">
            <span className="badge crimson">{matchedProfile.batch}</span>
            <h2>{matchedProfile.fullLegalName}</h2>
            <p className="muted">{matchedProfile.currentTitleRole} at {matchedProfile.currentEmployer}</p>
          </div>
        ) : (
          <p className="muted">BioBook claiming is disabled in frontend-only mode. Continue with your email to create a local demo profile.</p>
        )}
        <label>
          University email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        {(matchedProfile || passwordSignIn) && (
          <>
            <label>
              {passwordSignIn ? 'Password' : 'Create password'}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>
            {!passwordSignIn && (
              <label>
                Confirm password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </label>
            )}
          </>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" disabled={loading}>
          {loading ? 'Checking...' : passwordSignIn ? 'Log in' : matchedProfile ? 'Claim profile' : 'Continue'}
        </button>
        {matchedProfile && <button type="button" className="button ghost" onClick={() => setMatchedProfile(null)}>Use a different email</button>}
        <button
          type="button"
          className="button ghost"
          onClick={() => {
            setPasswordSignIn((current) => !current);
            setMatchedProfile(null);
            setError('');
          }}
        >
          {passwordSignIn ? 'Back to BioBook lookup' : 'Already claimed? Log in'}
        </button>
        <p className="muted">New here? <Link to="/register">Create a profile</Link></p>
      </form>
    </section>
  );
}
