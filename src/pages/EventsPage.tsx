import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CalendarDays, CalendarPlus, CheckCircle2, Clock, Grid2X2, List, MapPin, Search, Star, UserRound, UsersRound, Video, XCircle } from 'lucide-react';
import { AppTopbar } from '../components/AppTopbar';
import { useAuth } from '../components/AuthContext';
import { api } from '../services/api';
import type { AlumniEvent, EventCategory, EventRsvp, EventRsvpStatus } from '../types/domain';

type Tab = 'upcoming' | 'attending' | 'past' | 'mine';
type ViewMode = 'grid' | 'list';

interface EventFilters {
  search: string;
  category: string;
  location: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: EventFilters = {
  search: '',
  category: '',
  location: '',
  dateFrom: '',
  dateTo: '',
};

const eventCategories: Array<EventCategory | 'Regional'> = ['Networking', 'Industry Insights', 'Regional', 'Reunion', 'Career Opportunity', 'Community Event'];

export function EventsPage() {
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, EventRsvp>>({});
  const [tab, setTab] = useState<Tab>('upcoming');
  const [filters, setFilters] = useState<EventFilters>(emptyFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { profile } = useAuth();

  useEffect(() => {
    api.getEvents('APPROVED').then(setEvents);
    api.getMyEventRsvps().then((items) => {
      setRsvps(Object.fromEntries(items.map((item) => [item.eventId, item])));
    });
  }, []);

  const visibleEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => matchesTab(event, tab, rsvps[event.id], profile?.id, now))
      .filter((event) => matchesFilters(event, filters));
  }, [events, filters, profile?.id, rsvps, tab]);

  const upcomingCount = events.filter((event) => event.eventDate && new Date(event.eventDate).getTime() >= Date.now()).length;
  const regionalCount = events.filter((event) => event.location && !/virtual|zoom|online/i.test(event.location)).length;
  const virtualCount = events.filter((event) => /virtual|zoom|online/i.test(event.location)).length;

  return (
    <section className="directory-page events-page">
      <AppTopbar value={filters.search} onSearch={(search) => setFilters({ ...filters, search })} />

      <div className="directory-header">
        <div>
          <h1>Events & Gatherings</h1>
          <p>Find timely Wharton Executive MBA gatherings, panels, and class-led moments.</p>
        </div>
        <div className="directory-stats">
          <Metric icon={CalendarDays} value={String(upcomingCount)} label="Upcoming Events" />
          <Metric icon={UsersRound} value={String(regionalCount)} label="Regional Summits" />
          <Metric icon={Video} value={String(virtualCount)} label="Virtual Panels" />
        </div>
        <div className="page-header-actions">
          <Link className="button primary compact" to="/events/new"><CalendarPlus size={16} /> Submit Event</Link>
          <button className={viewMode === 'grid' ? 'icon-button active' : 'icon-button'} aria-label="Grid view" onClick={() => setViewMode('grid')}><Grid2X2 size={18} /></button>
          <button className={viewMode === 'list' ? 'icon-button active' : 'icon-button'} aria-label="List view" onClick={() => setViewMode('list')}><List size={18} /></button>
        </div>
      </div>

      <div className="event-segmented-tabs">
        {[
          ['upcoming', 'Upcoming Events'],
          ['attending', 'Attending'],
          ['past', 'Past Events'],
          ['mine', 'My Submissions'],
        ].map(([value, label]) => (
          <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value as Tab)}>{label}</button>
        ))}
      </div>

      <div className="directory-workspace">
        <aside className="directory-filter-panel">
          <div className="panel-heading">
            <h2>Filter Events</h2>
            <button type="button" onClick={() => setFilters(emptyFilters)}>Reset</button>
          </div>
          <label className="search-field">
            <Search size={17} />
            <input placeholder="Search event" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <label>Category<select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All Categories</option>{eventCategories.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Location<input placeholder="City, venue, or virtual" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} /></label>
          <label>Date From<input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></label>
          <label>Date To<input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></label>
          <button className="button primary" type="button">Apply Filters</button>
        </aside>

        <section className="directory-results-panel event-results-panel">
          {visibleEvents.length > 0 ? (
            <div className={viewMode === 'grid' ? 'event-card-grid' : 'event-card-list'}>
              {visibleEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  rsvp={rsvps[event.id]}
                  onRsvp={async (status) => {
                    const updated = await api.updateEventRsvp(event.id, status);
                    setRsvps((current) => ({ ...current, [event.id]: updated }));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <span><CalendarDays size={28} /></span>
              <h2>No approved events match this view</h2>
              <p>Try changing tabs or widening the filters.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function EventCard({ event, rsvp, onRsvp }: { event: AlumniEvent; rsvp?: EventRsvp; onRsvp: (status: EventRsvpStatus) => Promise<void> }) {
  const [saving, setSaving] = useState<EventRsvpStatus | null>(null);
  async function handleRsvp(status: EventRsvpStatus) {
    setSaving(status);
    try {
      await onRsvp(status);
    } finally {
      setSaving(null);
    }
  }

  const date = event.eventDate ? new Date(event.eventDate) : null;

  return (
    <article className="event-card polished-event-card">
      <div className="event-media">
        {event.imageUrl ? <img src={event.imageUrl} alt="" /> : <div><CalendarDays size={36} /></div>}
        <span className="event-status-badge">{event.category}</span>
      </div>
      <div className="event-card-body">
        <h2>{event.title}</h2>
        <p className="event-description">{event.description}</p>
        <div className="event-metadata">
          <span><CalendarDays size={15} /> {date ? date.toLocaleDateString() : 'Date TBD'}</span>
          <span><Clock size={15} /> {date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Time TBD'}</span>
          <span><MapPin size={15} /> {event.location || 'Location TBD'}</span>
          <span><UserRound size={15} /> {event.postedByName} · {event.postedByCohort}</span>
        </div>
        <div className="rsvp-summary">
          <span>{rsvp?.joinedCount ?? 0} joined</span>
          <span>{rsvp?.interestedCount ?? 0} interested</span>
          {rsvp?.status && rsvp.status !== 'CANCELLED' && <strong>Your RSVP: {rsvp.status.toLowerCase()}</strong>}
        </div>
      </div>
      <div className="event-footer-actions">
        <button className="button primary compact" type="button" disabled={saving === 'JOINED'} onClick={() => handleRsvp('JOINED')}>
          <CheckCircle2 size={16} /> {saving === 'JOINED' ? 'Joining...' : 'Join Event'}
        </button>
        <button className="button ghost compact" type="button" disabled={saving === 'INTERESTED'} onClick={() => handleRsvp('INTERESTED')}>
          <Star size={16} /> Interested
        </button>
        <button className="button ghost compact" type="button" aria-label="Bookmark event"><Bookmark size={16} /> Bookmark</button>
        {rsvp?.status && rsvp.status !== 'CANCELLED' && (
          <button className="button ghost compact" type="button" disabled={saving === 'CANCELLED'} onClick={() => handleRsvp('CANCELLED')}>
            <XCircle size={16} /> Cancel
          </button>
        )}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof CalendarDays; value: string; label: string }) {
  return (
    <div>
      <Icon size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function matchesTab(event: AlumniEvent, tab: Tab, rsvp: EventRsvp | undefined, profileId: string | undefined, now: number) {
  const eventTime = event.eventDate ? new Date(event.eventDate).getTime() : Number.POSITIVE_INFINITY;
  if (tab === 'attending') return rsvp?.status === 'JOINED';
  if (tab === 'past') return eventTime < now;
  if (tab === 'mine') return event.postedById === profileId;
  return eventTime >= now;
}

function matchesFilters(event: AlumniEvent, filters: EventFilters) {
  const search = filters.search.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const eventTime = event.eventDate ? new Date(event.eventDate).getTime() : null;
  if (search && ![event.title, event.description, event.category, event.location, event.postedByName].join(' ').toLowerCase().includes(search)) return false;
  if (filters.category === 'Regional' && /virtual|zoom|online/i.test(event.location)) return false;
  if (filters.category && filters.category !== 'Regional' && event.category !== filters.category) return false;
  if (location && !event.location.toLowerCase().includes(location)) return false;
  if (filters.dateFrom && eventTime && eventTime < new Date(filters.dateFrom).getTime()) return false;
  if (filters.dateTo && eventTime && eventTime > new Date(filters.dateTo).getTime() + 86_399_999) return false;
  return true;
}
