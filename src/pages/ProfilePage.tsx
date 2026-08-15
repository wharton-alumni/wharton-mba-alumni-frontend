import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, Edit3, GraduationCap, Languages, Link as LinkIcon, Mail, MapPin, Phone, Search, Sparkles, UsersRound } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../components/AuthContext';
import type { AlumniProfile, BioBookProfile } from '../types/domain';

type ProfileDetails = Partial<Record<keyof BioBookProfile, string | boolean>> & Record<string, string | boolean | undefined>;

export function ProfilePage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'overview');

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(window.location.hash.replace('#', '') || 'overview');
    }
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!profile) return null;

  const bioBook = detailsFromProfile(profile);
  const fullName = stringValue(bioBook.fullLegalName) || `${profile.firstName} ${profile.lastName}`.trim();
  const preferred = stringValue(bioBook.preferredNameNickname) || profile.firstName || 'Alumni';
  const title = stringValue(bioBook.currentTitleRole) || profile.currentTitle;
  const company = stringValue(bioBook.currentEmployer) || profile.currentCompany;
  const city = stringValue(bioBook.city) || stringValue(bioBook.currentCityOfResidence) || profile.city;
  const stateCountry = stringValue(bioBook.stateCountry) || profile.stateCountry;
  const location = compactJoin([city, stateCountry], ', ');
  const email = stringValue(bioBook.personalEmailForClassDirectory) || profile.email;
  const phone = stringValue(bioBook.mobileNumber) || profile.phoneNumber;
  const avatarUrl = stringValue(bioBook.headshotProfessional) || profile.avatarUrl;
  const interests = splitList(`${stringValue(bioBook.clubsInterestedIn)}, ${stringValue(bioBook.hobbiesInterests)}, ${stringValue(bioBook.industriesWantToBreakIntoLearn)}`).slice(0, 8);
  const experiences = [
    { title, company, description: stringValue(bioBook.careerTrajectoryIn3Bullets) || profile.bio },
    ...splitList(stringValue(bioBook.companiesYouPreviouslyWorkedAt)).map((previousCompany) => ({ title: 'Previous role', company: previousCompany, description: '' })),
  ].filter((item) => item.company || item.title);

  const detailRows = [
    { label: 'Industry', value: stringValue(bioBook.industry) || profile.industry || 'Not provided', icon: BriefcaseBusiness },
    { label: 'Function', value: stringValue(bioBook.functionalArea) || 'Not provided', icon: Sparkles },
    { label: 'Company', value: company || 'Not provided', icon: BriefcaseBusiness },
    { label: 'Interests', value: firstAvailable(stringValue(bioBook.clubsInterestedIn), stringValue(bioBook.hobbiesInterests), 'Not provided'), icon: UsersRound },
    { label: 'Languages', value: stringValue(bioBook.languagesSpoken) || 'Not provided', icon: Languages },
    { label: 'Education', value: firstAvailable(stringValue(bioBook.undergraduateInstitutionMajor), stringValue(bioBook.graduateInstitutionMajor), 'Not provided'), icon: GraduationCap },
  ];

  return (
    <section className="alumni-profile-page">
      <header className="profile-topbar">
        <label className="directory-global-search">
          <Search size={18} />
          <input placeholder="Search Wharton 52..." readOnly />
        </label>
      </header>

      <div className="profile-breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span>/</span>
        <strong>My Profile</strong>
      </div>

      <div className="alumni-profile-grid">
        <main className="alumni-profile-main">
          <section className="alumni-hero-card">
            <div className="alumni-identity">
              <Avatar name={fullName} src={avatarUrl} size="xl" />
              <div>
                <h1>{fullName}</h1>
                <p className="role-line">{compactJoin([title, company], ' at ') || 'Role not provided'}</p>
                <div className="identity-lines">
                  {email && <span><Mail size={15} /> {email}</span>}
                  {phone && <span><Phone size={15} /> {phone}</span>}
                  {location && <span><MapPin size={15} /> {location}</span>}
                  {profile.linkedinUrl && <a href={normalizeUrl(profile.linkedinUrl)} target="_blank" rel="noreferrer"><LinkIcon size={15} /> LinkedIn</a>}
                </div>
              </div>
            </div>
            <div className="alumni-company-mark">
              <strong>{company || 'Company not provided'}</strong>
            </div>
            <div className="alumni-badges">
              <span>{stringValue(bioBook.batch) || 'WEMBA'} Alumni</span>
              {title && <span>{title}</span>}
              <span>Class of {profile.classYear}</span>
              {profile.willingToMentor && <span>Open to mentoring</span>}
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
            <ProfilePanel title={`About ${preferred}`}>
              <p>{firstAvailable(stringValue(bioBook.careerTrajectoryIn3Bullets), stringValue(bioBook.canHelpClassmatesWith), stringValue(bioBook.postMbaCareerGoal), profile.bio, 'Not provided')}</p>
              {bioBook.wouldLoveHelpWith && <p><strong>Would love help with:</strong> {stringValue(bioBook.wouldLoveHelpWith)}</p>}
            </ProfilePanel>
            <ProfilePanel title="Profile Details">
              <dl className="profile-detail-list">
                {detailRows.map(({ label, value, icon: Icon }) => (
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
                {bioBook.undergraduateInstitutionMajor && <p><strong>Undergraduate</strong><span>{stringValue(bioBook.undergraduateInstitutionMajor)}</span></p>}
                {bioBook.graduateInstitutionMajor && <p><strong>Graduate</strong><span>{stringValue(bioBook.graduateInstitutionMajor)}</span></p>}
                {bioBook.majors && <p><strong>MBA Major</strong><span>{stringValue(bioBook.majors)}</span></p>}
                {bioBook.concentration && <p><strong>Concentration</strong><span>{stringValue(bioBook.concentration)}</span></p>}
                {bioBook.certificates && <p><strong>Certificates</strong><span>{stringValue(bioBook.certificates)}</span></p>}
              </div>
            </ProfilePanel>
          </section>
        </main>

        <aside className="alumni-profile-side">
          <div className="profile-actions">
            <Link className="button primary compact" to="/profile/edit"><Edit3 size={16} /> Edit Profile</Link>
          </div>
          <ProfilePanel title={`About ${preferred}`}>
            <dl className="side-fact-list">
              <div><dt><CalendarDays size={16} /> Member Since</dt><dd>{stringValue(bioBook.batch) || 'Not provided'}</dd></div>
              <div><dt><Mail size={16} /> Email</dt><dd>{profile.email || 'Not provided'}</dd></div>
              <div><dt><UsersRound size={16} /> Cohort</dt><dd>{profile.cohortCampus || 'Not provided'}</dd></div>
              <div><dt><BriefcaseBusiness size={16} /> Experience</dt><dd>{stringValue(bioBook.yearsOfProfessionalExperience) || 'Not provided'}</dd></div>
            </dl>
          </ProfilePanel>
          <ProfilePanel title="Shared Interests">
            <div className="interest-chips">
              {interests.map((interest) => <span key={interest}>{interest}</span>)}
              {interests.length === 0 && <p className="muted">Not provided</p>}
            </div>
          </ProfilePanel>
          <ProfilePanel title="Mentorship">
            <p>{stringValue(bioBook.openToMentoring) || (profile.willingToMentor ? 'Yes' : 'Not provided')}</p>
            {bioBook.canHelpClassmatesWith && <p><strong>Can help with:</strong> {stringValue(bioBook.canHelpClassmatesWith)}</p>}
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

function detailsFromProfile(profile: AlumniProfile): ProfileDetails {
  const parsed = parseDetails(profile.bioBookProfileJson);
  return {
    ...parsed,
    fullLegalName: parsed.fullLegalName || `${profile.firstName} ${profile.lastName}`.trim(),
    currentEmployer: parsed.currentEmployer || profile.currentCompany,
    currentTitleRole: parsed.currentTitleRole || profile.currentTitle,
    industry: parsed.industry || profile.industry,
    city: parsed.city || profile.city,
    stateCountry: parsed.stateCountry || profile.stateCountry,
    linkedinUrl: parsed.linkedinUrl || profile.linkedinUrl,
    careerTrajectoryIn3Bullets: parsed.careerTrajectoryIn3Bullets || profile.bio,
    headshotProfessional: parsed.headshotProfessional || profile.avatarUrl,
    willingToMentor: parsed.willingToMentor ?? profile.willingToMentor,
  };
}

function parseDetails(value?: string): ProfileDetails {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as ProfileDetails : {};
  } catch {
    return {};
  }
}

function stringValue(value: string | boolean | undefined) {
  return typeof value === 'string' ? value.trim() : '';
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
