import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, Globe2, Grid2X2, List, MapPin, MoreVertical, Search, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppTopbar } from '../components/AppTopbar';
import { Avatar as FallbackAvatar } from '../components/Avatar';
import { allBatches } from '../data/batches';
import { api } from '../services/api';
import type { BioBookProfile } from '../types/domain';

interface DirectoryFilterState {
  search: string;
  location: string;
  industry: string;
  functionArea: string;
  company: string;
  classYear: string;
  interest: string;
  openToMentoring: boolean;
}

const emptyFilters: DirectoryFilterState = {
  search: '',
  location: '',
  industry: '',
  functionArea: '',
  company: '',
  classYear: '',
  interest: '',
  openToMentoring: false,
};

export function DirectoryPage() {
  const [profiles, setProfiles] = useState<BioBookProfile[]>([]);
  const [filters, setFilters] = useState<DirectoryFilterState>(emptyFilters);
  const [sortBy, setSortBy] = useState('lastName');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedBatch, setSelectedBatch] = useState("WEMBA'52");

  useEffect(() => {
    api.getBioBookProfiles().then(setProfiles);
  }, []);

  const visibleProfiles = useMemo(() => (
    profiles.filter((profile) => profile.batch === selectedBatch && !hasDemoFirstName(profile))
  ), [profiles, selectedBatch]);

  const options = useMemo(() => ({
    locations: unique(visibleProfiles.map((profile) => compactJoin([profile.city, profile.stateCountry], ', '))),
    industries: unique(visibleProfiles.map((profile) => profile.industry)),
    functions: unique(visibleProfiles.map((profile) => profile.functionalArea)),
    companies: unique(visibleProfiles.map((profile) => profile.currentEmployer)),
    classYears: unique(visibleProfiles.map((profile) => String(profile.classYear))),
    interests: unique(visibleProfiles.flatMap((profile) => splitList(profile.clubsInterestedIn || profile.hobbiesInterests))),
  }), [visibleProfiles]);

  const filteredProfiles = useMemo(() => {
    const filtered = visibleProfiles.filter((profile) => matchesFilters(profile, filters));
    return filtered.sort((left, right) => {
      if (sortBy === 'firstName') return firstNameFor(left.fullLegalName).localeCompare(firstNameFor(right.fullLegalName));
      if (sortBy === 'company') return valueOr(left.currentEmployer).localeCompare(valueOr(right.currentEmployer));
      if (sortBy === 'industry') return valueOr(left.industry).localeCompare(valueOr(right.industry));
      if (sortBy === 'location') return valueOr(left.city).localeCompare(valueOr(right.city));
      return lastNameFor(left.fullLegalName).localeCompare(lastNameFor(right.fullLegalName));
    });
  }, [filters, visibleProfiles, sortBy]);

  const stats = [
    { label: 'Total Alumni', value: String(visibleProfiles.length), icon: UsersRound },
    { label: 'Locations', value: String(options.locations.length), icon: Globe2 },
    { label: 'Industries', value: String(options.industries.length), icon: BriefcaseBusiness },
    { label: 'Cohorts', value: String(unique(visibleProfiles.map((profile) => profile.cohortCampus)).length), icon: Building2 },
  ];

  return (
    <section className="directory-page">
      <AppTopbar value={filters.search} onSearch={(search) => setFilters({ ...filters, search })} />

      <div className="directory-header">
        <div>
          <h1>Directory</h1>
          <p>Connect with fellow {selectedBatch} alumni. Search, filter, and build meaningful connections.</p>
        </div>
        <div className="directory-stats">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <Icon size={22} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="directory-workspace">
        <aside className="directory-filter-panel">
          <div className="panel-heading">
            <h2>Filter Directory</h2>
            <button type="button" onClick={() => setFilters(emptyFilters)}>Reset</button>
          </div>
          <label>WEMBA Batch<select value={selectedBatch} onChange={(event) => { setSelectedBatch(event.target.value); setFilters(emptyFilters); }}>{
            allBatches.map((batch) => <option key={batch}>{batch}</option>)
          }</select></label>
          <label className="search-field">
            <Search size={17} />
            <input placeholder="Search by name, keyword..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <label>Location<select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}><option value="">All Locations</option>{options.locations.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Industry<select value={filters.industry} onChange={(event) => setFilters({ ...filters, industry: event.target.value })}><option value="">All Industries</option>{options.industries.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Function<select value={filters.functionArea} onChange={(event) => setFilters({ ...filters, functionArea: event.target.value })}><option value="">All Functions</option>{options.functions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Company<select value={filters.company} onChange={(event) => setFilters({ ...filters, company: event.target.value })}><option value="">All Companies</option>{options.companies.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Graduation Year<select value={filters.classYear} onChange={(event) => setFilters({ ...filters, classYear: event.target.value })}><option value="">Select Year</option>{options.classYears.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Interests<select value={filters.interest} onChange={(event) => setFilters({ ...filters, interest: event.target.value })}><option value="">Select Interests</option>{options.interests.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="directory-switch">
            <span>Open to mentoring</span>
            <input type="checkbox" checked={filters.openToMentoring} onChange={(event) => setFilters({ ...filters, openToMentoring: event.target.checked })} />
          </label>
        </aside>

        <section className="directory-results-panel">
          <div className="directory-results-toolbar">
            <span>Showing 1 - {filteredProfiles.length} of {visibleProfiles.length} alumni</span>
            <div>
              <label>
                Sort by:
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="lastName">Last Name (A-Z)</option>
                  <option value="firstName">First Name (A-Z)</option>
                  <option value="company">Company</option>
                  <option value="industry">Industry</option>
                  <option value="location">Location</option>
                </select>
              </label>
              <button className={viewMode === 'grid' ? 'icon-button active' : 'icon-button'} aria-label="Grid view" onClick={() => setViewMode('grid')}><Grid2X2 size={18} /></button>
              <button className={viewMode === 'table' ? 'icon-button active' : 'icon-button'} aria-label="Table view" onClick={() => setViewMode('table')}><List size={18} /></button>
            </div>
          </div>

          {filteredProfiles.length > 0 && viewMode === 'table' ? (
            <div className="directory-table-wrap">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Company</th>
                    <th>Industry</th>
                    <th>Function</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => <DirectoryRow key={profile.id} profile={profile} />)}
                </tbody>
              </table>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="directory-grid-results">
              {filteredProfiles.map((profile) => <DirectoryTile key={profile.id} profile={profile} />)}
            </div>
          ) : null}
          {filteredProfiles.length === 0 && visibleProfiles.length > 0 && (
            <div className="empty-results">
              <h2>No alumni match those filters</h2>
              <p className="muted">Try removing one or more filters.</p>
            </div>
          )}
          {filteredProfiles.length === 0 && visibleProfiles.length === 0 && (
            <div className="empty-results">
              <h2>{selectedBatch} directory is coming soon</h2>
              <p className="muted">We're working on collecting data and this directory will be live soon.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function DirectoryRow({ profile }: { profile: BioBookProfile }) {
  const navigate = useNavigate();
  const profilePath = `/directory/${profile.id}`;

  function openProfile() {
    navigate(profilePath);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProfile();
    }
  }

  return (
    <tr className="directory-click-row" role="link" tabIndex={0} onClick={openProfile} onKeyDown={handleKeyDown}>
      <td>
        <div className="directory-person-cell">
          <Avatar profile={profile} />
          <div>
            <Link to={profilePath} onClick={(event) => event.stopPropagation()}>{profile.fullLegalName}</Link>
            <span>{profile.currentTitleRole || 'Not provided'}</span>
            {profile.willingToMentor && <em>Mentor</em>}
          </div>
        </div>
      </td>
      <td>{compactJoin([profile.city, profile.stateCountry], ', ') || 'Not provided'}</td>
      <td>{profile.currentEmployer || 'Not provided'}</td>
      <td>{profile.industry || 'Not provided'}</td>
      <td>{profile.functionalArea || 'Not provided'}</td>
      <td>
        <div className="directory-row-actions">
          <Link className="button ghost compact" to={profilePath} onClick={(event) => event.stopPropagation()}>View</Link>
          <MoreVertical size={17} />
        </div>
      </td>
    </tr>
  );
}

function DirectoryTile({ profile }: { profile: BioBookProfile }) {
  return (
    <Link className="profile-card biobook-card directory-click-card" to={`/directory/${profile.id}`}>
      <Avatar profile={profile} />
      <div>
        <h2>{profile.fullLegalName}</h2>
        <p className="role-line">{compactJoin([profile.currentTitleRole, profile.currentEmployer], ' at ')}</p>
        <p className="muted"><MapPin size={14} /> {compactJoin([profile.city, profile.stateCountry], ', ') || 'Not provided'}</p>
        <div className="badge-row">
          {profile.industry && <span className="badge">{profile.industry}</span>}
          {profile.functionalArea && <span className="badge">{profile.functionalArea}</span>}
          {profile.willingToMentor && <span className="badge crimson">Mentor</span>}
        </div>
        <span className="button ghost compact">View profile</span>
      </div>
    </Link>
  );
}

function Avatar({ profile }: { profile: BioBookProfile }) {
  return <FallbackAvatar name={profile.fullLegalName} src={profile.headshotProfessional} />;
}

function matchesFilters(profile: BioBookProfile, filters: DirectoryFilterState) {
  const search = filters.search.trim().toLowerCase();
  if (search && !searchText(profile).includes(search)) return false;
  if (filters.location && compactJoin([profile.city, profile.stateCountry], ', ') !== filters.location) return false;
  if (filters.industry && profile.industry !== filters.industry) return false;
  if (filters.functionArea && profile.functionalArea !== filters.functionArea) return false;
  if (filters.company && profile.currentEmployer !== filters.company) return false;
  if (filters.classYear && String(profile.classYear) !== filters.classYear) return false;
  if (filters.interest && !splitList(`${profile.clubsInterestedIn}, ${profile.hobbiesInterests}`).includes(filters.interest)) return false;
  if (filters.openToMentoring && !profile.willingToMentor) return false;
  return true;
}

function searchText(profile: BioBookProfile) {
  return [
    profile.fullLegalName,
    profile.currentTitleRole,
    profile.currentEmployer,
    profile.industry,
    profile.functionalArea,
    profile.city,
    profile.stateCountry,
    profile.canHelpClassmatesWith,
    profile.postMbaCareerGoal,
    profile.clubsInterestedIn,
    profile.hobbiesInterests,
  ].join(' ').toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
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

function valueOr(value?: string) {
  return value ?? '';
}

function firstNameFor(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function lastNameFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.at(-1) ?? name;
}

function hasDemoFirstName(profile: BioBookProfile) {
  return firstNameFor(profile.fullLegalName).toLowerCase() === 'demo';
}
