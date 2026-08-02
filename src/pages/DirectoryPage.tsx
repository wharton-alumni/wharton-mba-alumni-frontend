import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { cohorts, industries } from '../data/options';
import { brandAssets, brandCopy } from '../data/brand';
import { olderBatches, topBatches } from '../data/batches';
import classMetrics from '../data/classMetrics.json';
import { demoDirectoryProfiles } from '../data/demoDirectoryProfiles';
import type { DirectoryFilters } from '../services/api';
import type { BioBookProfile } from '../types/domain';

type DirectoryTab = 'dashboard' | 'directory';
interface ClassMetric {
  label: string;
  value: string;
}

interface CohortMetric {
  label: string;
  count: number;
  share: number;
  color: string;
}

interface ClassMetrics {
  batch: string;
  source: string;
  sourceUrl: string;
  officialClassLabel: string;
  overview: string;
  stats: ClassMetric[];
  cohorts: CohortMetric[];
  workExperience: {
    averageYears: string;
    minimumYears: number;
    medianSalaryAndBonus: string;
  };
  testScores: ClassMetric[];
  industryMix: ClassMetric[];
  notes: string[];
}

const metricsByBatch = classMetrics as Record<string, ClassMetrics>;

export function DirectoryPage() {
  const [wemba52Profiles] = useState<BioBookProfile[]>(demoDirectoryProfiles);
  const [filters, setFilters] = useState<DirectoryFilters>({});
  const [selectedBatch, setSelectedBatch] = useState("WEMBA'52");
  const [activeTab, setActiveTab] = useState<DirectoryTab>('dashboard');

  const directoryProfiles = useMemo(() => {
    if (selectedBatch !== "WEMBA'52") return [];
    return wemba52Profiles.filter((profile) => matchesBioBookFilters(profile, filters));
  }, [filters, selectedBatch]);
  const bioBookIndustries = useMemo(() => {
    const fromBioBook = new Set(wemba52Profiles.map((profile) => profile.industry).filter(Boolean));
    return Array.from(new Set([...industries, ...fromBioBook])).sort();
  }, [wemba52Profiles]);

  return (
    <section className="content">
      <div className="product-hero">
        <div className="product-hero-copy">
          <img src={brandAssets.executiveMbaLogo} alt="Wharton Executive MBA" className="emba-lockup" />
          <p className="eyebrow">Alumni directory</p>
          <h1>{brandCopy.headline}</h1>
          <p>Connect with Wharton alumni by Executive MBA batch, then switch between the class dashboard and alumni directory.</p>
          <div className="batch-strip">
            {topBatches.map((batch) => (
              <button
                key={batch}
                className={selectedBatch === batch ? 'batch-chip active' : 'batch-chip'}
                onClick={() => {
                  setSelectedBatch(batch);
                  setActiveTab('dashboard');
                }}
              >
                {batch}
              </button>
            ))}
            <label className="batch-select-label">
              More batches
              <select
                value={olderBatches.includes(selectedBatch) ? selectedBatch : ''}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setSelectedBatch(event.target.value);
                  setActiveTab('dashboard');
                }}
              >
                <option value="">Select batch</option>
                {olderBatches.map((batch) => <option key={batch}>{batch}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="tabs" role="tablist">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={activeTab === 'directory' ? 'active' : ''} onClick={() => setActiveTab('directory')}>Directory List</button>
      </div>
      {activeTab === 'dashboard' ? (
        <BatchDashboard batch={selectedBatch} />
      ) : (
      <div className="directory-layout">
        <aside className="filters panel">
          <label className="search-field">
            <Search size={18} />
            <input placeholder="Name, company, title, keyword" value={filters.search ?? ''} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <label>Cohort<select value={filters.cohortCampus ?? ''} onChange={(event) => setFilters({ ...filters, cohortCampus: event.target.value })}><option value="">All</option>{cohorts.map((cohort) => <option key={cohort}>{cohort}</option>)}</select></label>
          <label>Industry<select value={filters.industry ?? ''} onChange={(event) => setFilters({ ...filters, industry: event.target.value })}><option value="">All</option>{bioBookIndustries.map((industry) => <option key={industry}>{industry}</option>)}</select></label>
          <label>Location<input placeholder="City or country" value={filters.location ?? ''} onChange={(event) => setFilters({ ...filters, location: event.target.value })} /></label>
          <div className="toggle-row stacked">
            <label><input type="checkbox" checked={filters.willingToMentor ?? false} onChange={(event) => setFilters({ ...filters, willingToMentor: event.target.checked })} /> Open to mentoring</label>
          </div>
        </aside>
        <div className="card-grid">
          {selectedBatch !== "WEMBA'52" ? (
            <section className="panel coming-soon">
              <p className="eyebrow">{selectedBatch} directory</p>
              <h2>Directory would be live soon</h2>
              <p className="muted">The BioBook-powered alumni list is currently available for WEMBA'52.</p>
            </section>
          ) : directoryProfiles.length === 0 ? (
            <section className="panel coming-soon">
              <p className="eyebrow">No matches</p>
              <h2>Try a broader search</h2>
              <p className="muted">Search by name, employer, title, city, industry, interests, or ways classmates can help.</p>
            </section>
          ) : directoryProfiles.map((profile) => (
            <BioBookProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      </div>
      )}
    </section>
  );
}

function BioBookProfileCard({ profile }: { profile: BioBookProfile }) {
  const initials = initialsFor(profile.fullLegalName);
  return (
    <article className="profile-card biobook-card">
      <div className="avatar">{initials}</div>
      <div>
        <div className="card-title-row">
          <h2>{profile.fullLegalName}</h2>
          <span className="badge">{profile.batch} · {profile.cohortCampus}</span>
        </div>
        <p className="role-line">{compactJoin([profile.currentTitleRole, profile.currentEmployer], ' at ')}</p>
        <p className="muted">{compactJoin([compactJoin([profile.city, profile.stateCountry], ', '), profile.industry, profile.functionalArea], ' · ')}</p>
        {profile.canHelpClassmatesWith && <p><strong>Can help with:</strong> {profile.canHelpClassmatesWith}</p>}
        {profile.postMbaCareerGoal && <p><strong>Post-MBA goal:</strong> {profile.postMbaCareerGoal}</p>}
        <div className="badge-row">
          {profile.willingToMentor && <span className="badge crimson">Mentor</span>}
          {profile.yearsOfProfessionalExperience && <span className="badge">{profile.yearsOfProfessionalExperience} years</span>}
          {profile.majors && <span className="badge green">{profile.majors}</span>}
        </div>
        <div className="profile-card-links">
          {profile.linkedinUrl && <a className="button ghost compact" href={normalizeUrl(profile.linkedinUrl)} target="_blank" rel="noreferrer"><ExternalLink size={16} /> LinkedIn</a>}
        </div>
      </div>
    </article>
  );
}

function BatchDashboard({ batch }: { batch: string }) {
  const metrics = metricsByBatch[batch];
  if (!metrics) {
    return (
      <section className="panel coming-soon">
        <p className="eyebrow">{batch} dashboard</p>
        <h2>Dashboard would be live soon</h2>
        <p className="muted">The class metrics dashboard is currently available for WEMBA'52, WEMBA'51, and WEMBA'50.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-stack">
      <div className="panel dashboard-intro">
        <div>
          <p className="eyebrow">{metrics.batch} · {metrics.officialClassLabel}</p>
          <h2>Class metrics dashboard</h2>
          <p>{metrics.overview}</p>
        </div>
        <a className="button ghost compact" href={metrics.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={16} /></a>
      </div>
      <div className="metric-grid">
        {metrics.stats.map((stat) => (
          <article className="metric-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </div>
      <div className="dashboard-layout">
        <section className="panel">
          <h2>Cohort Distribution</h2>
          <div className="cohort-metrics">
            {metrics.cohorts.map((cohort) => (
              <div className="cohort-meter" key={cohort.label}>
                <div className="meter-label">
                  <span>{cohort.label}</span>
                  <strong>{cohort.count} · {cohort.share}%</strong>
                </div>
                <div className="meter-track">
                  <span style={{ width: `${cohort.share}%`, background: cohort.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Work Experience</h2>
          <div className="mini-stat-row">
            <div><strong>{metrics.workExperience.averageYears}</strong><span>Avg. years of experience</span></div>
            <div><strong>{metrics.workExperience.minimumYears}+</strong><span>Years expected for applicants</span></div>
            {metrics.workExperience.medianSalaryAndBonus && <div><strong>{metrics.workExperience.medianSalaryAndBonus}</strong><span>Median salary and bonus</span></div>}
          </div>
        </section>
        {metrics.testScores.length > 0 && (
          <section className="panel">
            <h2>Education & Test Scores</h2>
            <div className="mini-stat-row">
              {metrics.testScores.map((score) => (
                <div key={score.label}><strong>{score.value}</strong><span>{score.label}</span></div>
              ))}
            </div>
          </section>
        )}
        {metrics.industryMix.length > 0 && (
          <section className="panel">
            <h2>Industry Mix</h2>
            <div className="mini-stat-row">
              {metrics.industryMix.map((industry) => (
                <div key={industry.label}><strong>{industry.value}</strong><span>{industry.label}</span></div>
              ))}
            </div>
          </section>
        )}
      </div>
      <p className="muted dashboard-note">Source: <a href={metrics.sourceUrl} target="_blank" rel="noreferrer">{metrics.source}</a>. {metrics.notes.join(' ')}</p>
    </section>
  );
}

function matchesBioBookFilters(profile: BioBookProfile, filters: DirectoryFilters) {
  const search = filters.search?.trim().toLowerCase();
  if (search && !bioBookSearchText(profile).includes(search)) return false;
  if (filters.cohortCampus && profile.cohortCampus !== filters.cohortCampus) return false;
  if (filters.industry && profile.industry !== filters.industry) return false;
  if (filters.location && !`${profile.city} ${profile.stateCountry} ${profile.currentCityOfResidence}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
  if (filters.classYearFrom && profile.classYear < Number(filters.classYearFrom)) return false;
  if (filters.classYearTo && profile.classYear > Number(filters.classYearTo)) return false;
  if (filters.willingToMentor && !profile.willingToMentor) return false;
  return true;
}

function bioBookSearchText(profile: BioBookProfile) {
  return [
    profile.fullLegalName,
    profile.preferredNameNickname,
    profile.currentEmployer,
    profile.currentTitleRole,
    profile.industry,
    profile.functionalArea,
    profile.city,
    profile.stateCountry,
    profile.careerTrajectoryIn3Bullets,
    profile.companiesYouPreviouslyWorkedAt,
    profile.postMbaCareerGoal,
    profile.canHelpClassmatesWith,
    profile.industriesWantToBreakIntoLearn,
    profile.clubsInterestedIn,
  ].join(' ').toLowerCase();
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
