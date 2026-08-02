import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { publicBioBookFields } from '../data/biobookFields';
import type { BioBookProfile } from '../types/domain';

export function ClaimProfilePage() {
  const navigate = useNavigate();
  const profile = useMemo(() => {
    const stored = localStorage.getItem('wharton.biobookProfile');
    return stored ? JSON.parse(stored) as BioBookProfile : null;
  }, []);

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

  return (
    <section className="content narrow">
      <div className="panel claim-panel">
        <div className="section-heading">
          <p className="eyebrow">Verify profile</p>
          <h1>Claim your BioBook profile</h1>
          <p className="muted">Review the public-safe profile details imported from the class BioBook before using the directory.</p>
        </div>
        <div className="claim-profile-header">
          <div className="avatar">{profile.fullLegalName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</div>
          <div>
            <h2>{profile.fullLegalName}</h2>
            <p className="muted">{profile.currentTitleRole} at {profile.currentEmployer}</p>
            <span className="badge crimson">{profile.batch} · {profile.cohortCampus}</span>
          </div>
        </div>
        <div className="claim-field-grid">
          {publicBioBookFields.map((field) => {
            const value = field.profileKey ? profile[field.profileKey] : '';
            if (value === '' || value === false) return null;
            return (
              <div className="claim-field" key={field.key}>
                <span>{field.label}</span>
                <strong>{String(value)}</strong>
              </div>
            );
          })}
        </div>
        <button className="button primary" onClick={() => navigate('/directory')}>
          <CheckCircle2 size={18} /> Verify and open directory
        </button>
      </div>
    </section>
  );
}
