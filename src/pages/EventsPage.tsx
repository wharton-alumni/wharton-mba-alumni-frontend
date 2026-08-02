import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { api } from '../services/api';
import type { AlumniEvent } from '../types/domain';

type Tab = 'upcoming' | 'mine';

export function EventsPage() {
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const { profile } = useAuth();

  useEffect(() => {
    api.getEvents('APPROVED').then(setEvents);
  }, []);

  const visibleEvents = useMemo(() => {
    if (tab === 'mine') return events.filter((event) => event.postedById === profile?.id);
    return events.filter((event) => event.eventDate);
  }, [events, profile?.id, tab]);

  return (
    <section className="content">
      <div className="page-actions">
        <div className="section-heading">
          <p className="eyebrow">Events</p>
          <h1>Approved alumni events from the Wharton Executive MBA network</h1>
        </div>
        <Link className="button primary" to="/events/new"><CalendarPlus size={18} /> Submit</Link>
      </div>
      <div className="tabs" role="tablist">
        <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>Upcoming Events</button>
        <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>My Submissions</button>
      </div>
      <div className="event-grid">
        {visibleEvents.map((event) => <EventCard key={event.id} event={event} />)}
        {visibleEvents.length === 0 && <p className="muted">No approved events match this view yet.</p>}
      </div>
    </section>
  );
}

function EventCard({ event }: { event: AlumniEvent }) {
  return (
    <article className="event-card">
      {event.imageUrl && <img src={event.imageUrl} alt="" />}
      <span className="badge crimson">{event.category}</span>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p className="muted">{event.eventDate ? new Date(event.eventDate).toLocaleString() : 'Date TBD'} · {event.location}</p>
      <p className="muted">Posted by {event.postedByName} · {event.postedByCohort}</p>
      {event.externalLink && <a className="button ghost compact" href={event.externalLink} target="_blank" rel="noreferrer">RSVP / View</a>}
    </article>
  );
}
