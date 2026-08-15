import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { Avatar } from '../components/Avatar';
import classMetrics from '../data/classMetrics.json';
import { intelligenceHubItems } from '../data/intelligenceHub';
import { api } from '../services/api';
import type { BioBookProfile, IntelligenceCategory, IntelligenceHubItem } from '../types/domain';

interface ClassMetric {
  label: string;
  value: string;
}

interface ClassMetrics {
  batch: string;
  source: string;
  sourceUrl: string;
  officialClassLabel: string;
  overview: string;
  stats: ClassMetric[];
  cohorts: Array<{ label: string; count: number; share: number; color: string }>;
  workExperience: {
    averageYears: string;
    minimumYears: number;
    medianSalaryAndBonus: string;
  };
  testScores: ClassMetric[];
  industryMix: ClassMetric[];
  notes: string[];
}

const metrics = (classMetrics as Record<string, ClassMetrics>)["WEMBA'52"];
const actionLinks = [
  { label: 'Open Directory', to: '/directory', icon: UsersRound },
  { label: 'Find Classmates', to: '/directory', icon: UsersRound },
  { label: 'Register for an Event', to: '/events', icon: CalendarDays },
  { label: 'Update Profile', to: '/profile/edit', icon: UserPlus },
  { label: 'Become a Mentor', to: '/profile/edit', icon: HeartHandshake },
];

export function DashboardPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<BioBookProfile[]>([]);

  useEffect(() => {
    api.getBioBookProfiles().then(setProfiles).catch(() => setProfiles([]));
  }, []);

  const normalized = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalized) return intelligenceHubItems;
    return intelligenceHubItems.filter((item) => [
      item.title,
      item.description,
      item.category,
      item.subCategory,
      item.city,
      item.state,
      item.club,
      item.industry,
      item.source,
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized));
  }, [normalized]);

  const upcomingEvents = filteredItems.filter((item) => item.eventDate).slice(0, 3);
  const updates = filteredItems.filter((item) => ['AI & Tech', 'Research & Data', 'Network'].includes(item.category)).slice(0, 3);
  const careerItems = filteredItems.filter((item) => item.category === 'Career').slice(0, 3);
  const recommendedProfiles = profiles.slice(0, 3);
  const mentorProfiles = profiles.filter((person) => person.willingToMentor).slice(0, 2);
  const impactStats = [
    { label: 'Total Class Size', value: findMetric('Total Class Size') },
    { label: 'Countries Represented', value: findMetric('Countries Represented') },
    { label: 'Women', value: findMetric('Women') },
    { label: 'Average Work Experience', value: `${metrics.workExperience.averageYears} yrs` },
    { label: 'Cohorts', value: String(metrics.cohorts.length) },
  ];

  return (
    <section className="dashboard-home">
      <header className="dashboard-topbar">
        <label className="dashboard-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Wharton 52..." />
        </label>
        <div className="dashboard-tools">
          {profile && <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.avatarUrl} />}
          <div className="dashboard-user">
            <strong>{profile?.firstName ?? 'Alumni'}</strong>
            <span>Wharton 52</span>
          </div>
        </div>
      </header>

      <div className="dashboard-layout-grid">
        <main className="dashboard-main-column">
          <section className="dashboard-welcome-card">
            <div className="welcome-copy">
              {profile && <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.avatarUrl} size="large" />}
              <div>
                <h1>Good morning, {profile?.firstName ?? 'Wharton 52'}!</h1>
                <p>Here is your Wharton 52 community update.</p>
                <div className="welcome-badges">
                  <span><ShieldCheck size={18} /> 52nd Batch Member</span>
                  <span><GraduationCap size={18} /> {metrics.officialClassLabel}</span>
                </div>
              </div>
            </div>
            <div className="welcome-image">
              <span>Wharton 52nd Batch</span>
            </div>
          </section>

          <section className="dashboard-card-row">
            <DashboardPanel title="Upcoming Events" action="View All" to="/events">
              {upcomingEvents.map((event) => <EventMini key={event.title} item={event} />)}
            </DashboardPanel>
            <DashboardPanel title="Recommended Connections" action="View All" to="/directory">
              {recommendedProfiles.map((person) => <ProfileMini key={person.id} profile={person} />)}
              {recommendedProfiles.length === 0 && <p className="muted">No BioBook profiles loaded yet.</p>}
            </DashboardPanel>
            <DashboardPanel title="Mentorship" action="View All" to="/directory">
              {mentorProfiles.map((person) => <ProfileMini key={person.id} profile={person} badge="Mentor" />)}
              {mentorProfiles.length === 0 && <p className="muted">No mentoring profiles loaded yet.</p>}
            </DashboardPanel>
          </section>

          <section className="dashboard-card-row">
            <DashboardPanel title="Community Feed">
              {updates.map((item) => <UpdateMini key={item.title} item={item} />)}
            </DashboardPanel>
            <DashboardPanel title="Updates from Wharton 52" action="Source" href={metrics.sourceUrl}>
              <UpdateMini item={{ title: metrics.source, description: metrics.overview, category: 'Alumni', sourceUrl: metrics.sourceUrl } as IntelligenceHubItem} />
              {metrics.notes.slice(0, 2).map((note) => <p className="small-note" key={note}>{note}</p>)}
            </DashboardPanel>
            <DashboardPanel title="Career Opportunities" action="View All" to="/jobs">
              {careerItems.map((item) => <UpdateMini key={item.title} item={item} />)}
              {careerItems.length === 0 && <p className="muted">No career resources match this search.</p>}
            </DashboardPanel>
          </section>

          <section className="dashboard-impact-card">
            <div className="panel-heading">
              <h2>Wharton 52 Impact</h2>
              <a href={metrics.sourceUrl} target="_blank" rel="noreferrer">View Source</a>
            </div>
            <div className="impact-stat-grid">
              {impactStats.map((stat) => (
                <div key={stat.label}>
                  <Sparkles size={23} />
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="dashboard-right-column">
          <DashboardPanel title="Quick Actions">
            <div className="quick-action-list">
              {actionLinks.map(({ label, to, icon: Icon }) => (
                <Link key={label} to={to}><Icon size={17} /> {label}</Link>
              ))}
            </div>
          </DashboardPanel>
          <DashboardPanel title="My Shortcuts">
            <div className="shortcut-list">
              {[
                ['My Profile', '/profile'],
                ['My Events', '/events'],
                ['My Directory', '/directory'],
                ['My Jobs', '/jobs'],
              ].map(([label, to]) => (
                <Link key={label} to={to}>{label}<ChevronRight size={15} /></Link>
              ))}
            </div>
          </DashboardPanel>
          <DashboardPanel title="Classmates in Directory" action="View All" to="/directory">
            <div className="avatar-stack">
              {profiles.slice(0, 6).map((person) => (
                <Avatar key={person.id} name={person.fullLegalName} src={person.headshotProfessional} />
              ))}
              {profiles.length > 6 && <span>+{profiles.length - 6}</span>}
            </div>
          </DashboardPanel>
        </aside>
      </div>
    </section>
  );
}

function DashboardPanel({ title, action, to, href, children }: { title: string; action?: string; to?: string; href?: string; children: ReactNode }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {to && action && <Link to={to}>{action}</Link>}
        {href && action && <a href={href} target="_blank" rel="noreferrer">{action}</a>}
      </div>
      {children}
    </section>
  );
}

function EventMini({ item }: { item: IntelligenceHubItem }) {
  const date = item.eventDate ? new Date(`${item.eventDate}T12:00:00`) : null;
  return (
    <a className="event-mini" href={item.registrationUrl ?? item.sourceUrl} target="_blank" rel="noreferrer">
      <time>
        <span>{date?.toLocaleDateString(undefined, { month: 'short' }) ?? 'TBD'}</span>
        <strong>{date?.toLocaleDateString(undefined, { day: '2-digit' }) ?? '--'}</strong>
      </time>
      <div>
        <strong>{item.title}</strong>
        <span>{[formatEventDate(item), item.location].filter(Boolean).join(' · ')}</span>
      </div>
    </a>
  );
}

function ProfileMini({ profile, badge }: { profile: BioBookProfile; badge?: string }) {
  return (
    <Link className="profile-mini" to={`/directory/${profile.id}`}>
      <Avatar name={profile.fullLegalName} src={profile.headshotProfessional} />
      <div>
        <strong>{profile.fullLegalName}</strong>
        <span>{[profile.currentTitleRole, profile.currentEmployer].filter(Boolean).join(' at ')}</span>
        <small><MapPin size={12} /> {[profile.city, profile.stateCountry].filter(Boolean).join(', ')}</small>
      </div>
      {badge && <em>{badge}</em>}
    </Link>
  );
}

function UpdateMini({ item }: { item: Pick<IntelligenceHubItem, 'title' | 'description' | 'category' | 'sourceUrl'> }) {
  return (
    <a className="update-mini" href={item.sourceUrl} target="_blank" rel="noreferrer">
      <span>{iconFor(item.category as IntelligenceCategory)}</span>
      <div>
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
      </div>
    </a>
  );
}

function findMetric(label: string) {
  return metrics.stats.find((stat) => stat.label === label)?.value ?? 'Not listed';
}

function formatEventDate(item: IntelligenceHubItem) {
  if (!item.eventDate) return '';
  const date = new Date(`${item.eventDate}T12:00:00`);
  return [date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), item.startTime].filter(Boolean).join(' · ');
}

function initialsFor(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
}

function iconFor(category: IntelligenceCategory) {
  if (category === 'Career') return <BriefcaseBusiness size={18} />;
  if (category === 'Events') return <CalendarDays size={18} />;
  if (category === 'Network') return <UsersRound size={18} />;
  return <Sparkles size={18} />;
}
