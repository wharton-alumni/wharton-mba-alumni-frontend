import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cohorts, industries } from '../data/options';
import { publicBioBookFields } from '../data/biobookFields';
import { api } from '../services/api';
import type { BioBookProfile } from '../types/domain';

export function ClaimProfilePage() {
  const navigate = useNavigate();
  const { profile: currentProfile, updateCurrentProfile } = useAuth();
  const storedProfile = useMemo(() => {
    const stored = localStorage.getItem('wharton.biobookProfile');
    return stored ? JSON.parse(stored) as BioBookProfile : null;
  }, []);
  const [profile, setProfile] = useState<BioBookProfile | null>(storedProfile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!profile) {
    return (
      <section className="content narrow">
        <div className="panel claim-panel">
          <p className="eyebrow">Profile claim</p>
          <h1>No BioBook profile found</h1>
          <p className="muted">Start from alumni access to verify your university email and claim your profile.</p>
          <button className="button primary" onClick={() => navigate('/login')}>Go to alumni access</button>
        </div>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    localStorage.setItem('wharton.biobookProfile', JSON.stringify(profile));

    try {
      if (!currentProfile) {
        throw new Error('Your login session is missing. Please claim or log in again.');
      }

      const nameParts = profile.fullLegalName.trim().split(/\s+/);
      const firstName = nameParts[0] || currentProfile.firstName;
      const lastName = nameParts.slice(1).join(' ') || currentProfile.lastName;
      const updated = await api.updateProfile(currentProfile.id, {
          firstName,
          lastName,
          cohortCampus: profile.cohortCampus,
          classYear: profile.classYear,
          currentTitle: profile.currentTitleRole,
          currentCompany: profile.currentEmployer,
          industry: profile.industry,
          city: profile.city || profile.currentCityOfResidence,
          stateCountry: profile.stateCountry,
          linkedinUrl: profile.linkedinUrl,
          bio: profile.careerTrajectoryIn3Bullets || profile.canHelpClassmatesWith || currentProfile.bio,
          willingToMentor: profile.willingToMentor,
        });
        updateCurrentProfile(updated);

      setSaved(true);
      window.setTimeout(() => navigate('/directory'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  }

  function updateProfile<K extends keyof BioBookProfile>(key: K, value: BioBookProfile[K]) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <section className="content narrow">
      <form className="panel claim-panel" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Verify profile</p>
          <h1>Claim your BioBook profile</h1>
          <p className="muted">Review and edit the public-safe profile details imported from the class BioBook before using the directory.</p>
        </div>
        <div className="claim-profile-header">
          <div className="avatar">{profile.fullLegalName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</div>
          <div>
            <h2>{profile.fullLegalName}</h2>
            <p className="muted">{profile.currentTitleRole} at {profile.currentEmployer}</p>
            <span className="badge crimson">{profile.batch} · {profile.cohortCampus}</span>
          </div>
        </div>
        <div className="claim-field-grid editable-claim-grid">
          {publicBioBookFields.map((field) => {
            if (!field.profileKey) return null;
            const value = profile[field.profileKey];
            if (field.inputType === 'checkbox') {
              return (
                <label className="toggle-inline claim-edit-field" key={field.key}>
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => updateProfile(field.profileKey as 'willingToMentor', event.target.checked)}
                  />
                  {field.label}
                </label>
              );
            }
            if (field.key === 'Cohort') {
              return (
                <label className="claim-edit-field" key={field.key}>
                  {field.label}
                  <select value={String(value ?? '')} onChange={(event) => updateProfile('cohortCampus', event.target.value as BioBookProfile['cohortCampus'])}>
                    {cohorts.map((cohort) => <option key={cohort}>{cohort}</option>)}
                  </select>
                </label>
              );
            }
            if (field.key === 'Industry') {
              return (
                <label className="claim-edit-field" key={field.key}>
                  {field.label}
                  <select value={String(value ?? '')} onChange={(event) => updateProfile('industry', event.target.value)}>
                    {industries.map((industry) => <option key={industry}>{industry}</option>)}
                  </select>
                </label>
              );
            }
            if (field.inputType === 'textarea') {
              return (
                <label className="claim-edit-field wide-field" key={field.key}>
                  {field.label}
                  <textarea value={String(value ?? '')} onChange={(event) => updateProfile(field.profileKey!, event.target.value as never)} />
                </label>
              );
            }
            return (
              <label className={field.key.length > 42 ? 'claim-edit-field wide-field' : 'claim-edit-field'} key={field.key}>
                {field.label}
                <input value={String(value ?? '')} onChange={(event) => updateProfile(field.profileKey!, event.target.value as never)} />
              </label>
            );
          })}
        </div>
        {error && <div className="error-banner">{error}</div>}
        {saved && <div className="success-banner">Profile saved.</div>}
        <button className="button primary" disabled={saving}>
          <CheckCircle2 size={18} /> {saving ? 'Saving...' : 'Save and open directory'}
        </button>
      </form>
    </section>
  );
}
