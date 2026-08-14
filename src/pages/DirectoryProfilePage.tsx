import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, GraduationCap, Languages, Link as LinkIcon, Mail, MapPin, Search, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { api } from '../services/api';
import type { BioBookProfile } from '../types/domain';

export function DirectoryProfilePage() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState<BioBookProfile | undefined>();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'overview');

  useEffect(() => {
    if (profileId) api.getBioBookProfileById(profileId).then(setProfile);
  }, [profileId]);

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(window.location.hash.replace('#', '') || 'overview');
    }
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const details = useMemo(() => profile ? buildProfileDetails(profile) : [], [profile]);

  if (!profile) {
    return (
      <section className="alumni-profile-page">
        <div className="profile-not-found">
          <p className="eyebrow">Directory profile</p>
          <h1>Profile not found</h1>
          <Link className="button ghost compact" to="/directory">Back to directory</Link>
        </div>
      </section>
    );
  }

  const initials = initialsFor(profile.fullLegalName);
  const email = firstAvailable(profile.personalEmailForClassDirectory ?? '', profile.universityEmailAlias ?? '', 'Not provided');
  const location = compactJoin([profile.city, profile.stateCountry], ', ');
  const interests = splitList(`${profile.clubsInterestedIn}, ${profile.hobbiesInterests}, ${profile.industriesWantToBreakIntoLearn}`).slice(0, 8);
  const experiences = [
    { title: profile.currentTitleRole, company: profile.currentEmployer, description: profile.careerTrajectoryIn3Bullets },
    ...splitList(profile.companiesYouPreviouslyWorkedAt).map((company) => ({ title: 'Previous role', company, description: '' })),
  ].filter((item) => item.company || item.title);

  return (
    <section className="alumni-profile-page">
      <header className="profile-topbar">
        <label className="directory-global-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Wharton 52..." />
        </label>
      </header>

      <div className="profile-breadcrumb">
        <Link to="/directory">Directory</Link>
        <span>/</span>
        <strong>Alumni Profile</strong>
      </div>

      <div className="alumni-profile-grid">
        <main className="alumni-profile-main">
          <section className="alumni-hero-card">
            <div className="alumni-identity">
              {profile.headshotProfessional ? (
                <img className="avatar xl avatar-image" src={profile.headshotProfessional} alt={profile.fullLegalName} />
              ) : (
                <div className="avatar xl">{initials}</div>
              )}
              <div>
                <h1>{profile.fullLegalName}</h1>
                <p className="role-line">{compactJoin([profile.currentTitleRole, profile.currentEmployer], ' at ') || 'Role not provided'}</p>
                <div className="identity-lines">
                  {profile.personalEmailForClassDirectory && <span><Mail size={15} /> {profile.personalEmailForClassDirectory}</span>}
                  {location && <span><MapPin size={15} /> {location}</span>}
                  {profile.linkedinUrl && <a href={normalizeUrl(profile.linkedinUrl)} target="_blank" rel="noreferrer"><LinkIcon size={15} /> LinkedIn</a>}
                </div>
              </div>
            </div>
            <div className="alumni-company-mark">
              <strong>{profile.currentEmployer || 'Company not provided'}</strong>
            </div>
            <div className="alumni-badges">
              <span>{profile.batch} Alumni</span>
              {profile.currentTitleRole && <span>{profile.currentTitleRole}</span>}
              <span>Class of {profile.classYear}</span>
            </div>
            <nav className="profile-tabs" aria-label="Profile sections">
              {['Overview', 'About', 'Experience', 'Education', 'Mentorship'].map((tab, index) => (
                <a
                  className={activeTab === tab.toLowerCase() || (!activeTab && index === 0) ? 'active' : ''}
                  href={`#${tab.toLowerCase()}`}
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                >
                  {tab}
                </a>
              ))}
            </nav>
          </section>

          <section className="profile-section-grid" id="overview">
            <ProfilePanel title={`About ${preferredName(profile)}`}>
              <p>{firstAvailable(profile.careerTrajectoryIn3Bullets, profile.canHelpClassmatesWith, profile.postMbaCareerGoal, 'Not provided')}</p>
              {profile.wouldLoveHelpWith && <p><strong>Would love help with:</strong> {profile.wouldLoveHelpWith}</p>}
            </ProfilePanel>
            <ProfilePanel title="Profile Details">
              <dl className="profile-detail-list">
                {details.map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <dt><Icon size={16} /> {label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </ProfilePanel>
          </section>

          <section className="profile-section-grid">
            <ProfilePanel title="Experience" id="experience">
              <div className="experience-list">
                {experiences.map((item, index) => (
                  <article key={`${item.company}-${index}`}>
                    <div className="experience-logo">{initialsFor(item.company || item.title)}</div>
                    <div>
                      <strong>{item.title || 'Role not provided'}</strong>
                      <span>{item.company}</span>
                      {item.description && <p>{item.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </ProfilePanel>
            <ProfilePanel title="Education & Certifications" id="education">
              <div className="education-list">
                {profile.undergraduateInstitutionMajor && <p><strong>Undergraduate</strong><span>{profile.undergraduateInstitutionMajor}</span></p>}
                {profile.graduateInstitutionMajor && <p><strong>Graduate</strong><span>{profile.graduateInstitutionMajor}</span></p>}
                {profile.majors && <p><strong>MBA Major</strong><span>{profile.majors}</span></p>}
                {profile.concentration && <p><strong>Concentration</strong><span>{profile.concentration}</span></p>}
                {profile.certificates && <p><strong>Certificates</strong><span>{profile.certificates}</span></p>}
              </div>
            </ProfilePanel>
          </section>
        </main>

        <aside className="alumni-profile-side">
          <ProfilePanel title={`About ${preferredName(profile)}`}>
            <dl className="side-fact-list">
              <div><dt><CalendarDays size={16} /> Member Since</dt><dd>{profile.batch || 'Not provided'}</dd></div>
              <div><dt><Mail size={16} /> Email</dt><dd>{email}</dd></div>
              <div><dt><UsersRound size={16} /> Cohort</dt><dd>{profile.cohortCampus || 'Not provided'}</dd></div>
              <div><dt><BriefcaseBusiness size={16} /> Experience</dt><dd>{profile.yearsOfProfessionalExperience || 'Not provided'}</dd></div>
            </dl>
          </ProfilePanel>
          <ProfilePanel title="Shared Interests">
            <div className="interest-chips">
              {interests.map((interest) => <span key={interest}>{interest}</span>)}
              {interests.length === 0 && <p className="muted">Not provided</p>}
            </div>
          </ProfilePanel>
          <ProfilePanel title="Mentorship">
            <p>{profile.openToMentoring || (profile.willingToMentor ? 'Yes' : 'Not provided')}</p>
            {profile.canHelpClassmatesWith && <p><strong>Can help with:</strong> {profile.canHelpClassmatesWith}</p>}
          </ProfilePanel>
        </aside>
      </div>
    </section>
  );
}

function ProfilePanel({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section className="profile-panel" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function buildProfileDetails(profile: BioBookProfile) {
  return [
    { label: 'Industry', value: profile.industry || 'Not provided', icon: BriefcaseBusiness },
    { label: 'Function', value: profile.functionalArea || 'Not provided', icon: Sparkles },
    { label: 'Company', value: profile.currentEmployer || 'Not provided', icon: BriefcaseBusiness },
    { label: 'Interests', value: firstAvailable(profile.clubsInterestedIn, profile.hobbiesInterests, 'Not provided'), icon: UsersRound },
    { label: 'Languages', value: profile.languagesSpoken || 'Not provided', icon: Languages },
    { label: 'Education', value: firstAvailable(profile.undergraduateInstitutionMajor, profile.graduateInstitutionMajor, 'Not provided'), icon: GraduationCap },
  ];
}

function preferredName(profile: BioBookProfile) {
  return profile.preferredNameNickname || profile.fullLegalName.split(/\s+/)[0] || 'Alumni';
}

function firstAvailable(...values: string[]) {
  return values.find((value) => value && value.trim()) ?? '';
}

function splitList(value: string) {
  return value.split(/[,;|]/).map((part) => part.trim()).filter(Boolean);
}

function compactJoin(values: Array<string | undefined>, separator: string) {
  return values.filter(Boolean).join(separator);
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function normalizeUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
