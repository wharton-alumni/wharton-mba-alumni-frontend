import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import type { BioBookProfile } from '../types/domain';

export function DirectoryProfilePage() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState<BioBookProfile | undefined>();

  useEffect(() => {
    if (profileId) api.getBioBookProfileById(profileId).then(setProfile);
  }, [profileId]);

  if (!profile) {
    return (
      <section className="content narrow">
        <div className="panel profile-detail">
          <p className="eyebrow">Directory profile</p>
          <h1>Profile not found</h1>
          <Link className="button ghost compact" to="/directory">Back to directory</Link>
        </div>
      </section>
    );
  }

  const initials = profile.fullLegalName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  const facts = [
    ['Cohort', `${profile.batch} · ${profile.cohortCampus}`],
    ['Location', [profile.city, profile.stateCountry].filter(Boolean).join(', ')],
    ['Industry', profile.industry],
    ['Function', profile.functionalArea],
    ['Experience', profile.yearsOfProfessionalExperience],
    ['Employer', profile.currentEmployer],
    ['Education', profile.undergraduateInstitutionMajor],
    ['Graduate education', profile.graduateInstitutionMajor],
    ['Majors', profile.majors],
    ['Concentration', profile.concentration],
    ['Languages', profile.languagesSpoken],
    ['Open to mentoring', profile.openToMentoring],
  ].filter(([, value]) => value);

  return (
    <section className="content narrow">
      <article className="panel profile-detail">
        <div className="profile-hero">
          <div className="avatar large">{initials}</div>
          <div>
            <p className="eyebrow">{profile.batch} · {profile.cohortCampus}</p>
            <h1>{profile.fullLegalName}</h1>
            <p className="role-line">{profile.currentTitleRole} at {profile.currentEmployer}</p>
          </div>
          <Link className="button ghost" to="/directory">Back</Link>
        </div>
        <div className="badge-row">
          {profile.industry && <span className="badge">{profile.industry}</span>}
          {profile.willingToMentor && <span className="badge crimson">Open to mentoring</span>}
          {profile.majors && <span className="badge green">{profile.majors}</span>}
        </div>
        <section className="profile-story">
          {profile.canHelpClassmatesWith && <p><strong>Can help classmates with:</strong> {profile.canHelpClassmatesWith}</p>}
          {profile.wouldLoveHelpWith && <p><strong>Would love help with:</strong> {profile.wouldLoveHelpWith}</p>}
          {profile.postMbaCareerGoal && <p><strong>Post-MBA goal:</strong> {profile.postMbaCareerGoal}</p>}
          {profile.careerTrajectoryIn3Bullets && <p><strong>Career trajectory:</strong> {profile.careerTrajectoryIn3Bullets}</p>}
          {profile.hobbiesInterests && <p><strong>Interests:</strong> {profile.hobbiesInterests}</p>}
        </section>
        <dl className="profile-facts">
          {facts.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
          {profile.linkedinUrl && (
            <div>
              <dt>LinkedIn</dt>
              <dd><a href={normalizeUrl(profile.linkedinUrl)} target="_blank" rel="noreferrer">Open profile <ExternalLink size={14} /></a></dd>
            </div>
          )}
        </dl>
      </article>
    </section>
  );
}

function normalizeUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
