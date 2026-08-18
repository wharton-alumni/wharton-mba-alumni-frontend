import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, MapPin, UserRound, UsersRound } from 'lucide-react';
import { AppTopbar } from '../components/AppTopbar';
import { Avatar } from '../components/Avatar';
import { api } from '../services/api';
import type { AlumniEvent, EventParticipant, EventRsvp, EventRsvpStatus } from '../types/domain';

const EXTERNAL_POSTER_ID = '00000000-0000-0000-0000-000000000034';

export function EventDetailPage() {
  const { eventId } = useParams();
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, EventRsvp>>({});
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [saving, setSaving] = useState<EventRsvpStatus | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEvents('APPROVED')
      .then(setEvents)
      .catch(() => setEvents([]));
    api.getMyEventRsvps().then((items) => {
      const merged = Object.fromEntries(items.map((item) => [item.eventId, item]));
      setRsvps(merged);
      if (eventId) {
        const currentRsvp = merged[eventId];
        if (currentRsvp?.participants) setParticipants(currentRsvp.participants);
      }
    }).catch(() => setRsvps({}));
    if (eventId) api.getEventParticipants(eventId).then(setParticipants).catch(() => undefined);
  }, [eventId]);

  const event = useMemo(() => events.find((item) => item.id === eventId), [eventId, events]);
  const rsvp = eventId ? rsvps[eventId] : undefined;
  const joined = rsvp?.status === 'JOINED';
  const externalEvent = event?.postedById === EXTERNAL_POSTER_ID;

  async function handleRsvp(status: EventRsvpStatus) {
    if (!eventId) return;
    setSaving(status);
    setError('');
    try {
      const updated = await api.updateEventRsvp(eventId, status);
      setRsvps((current) => ({ ...current, [eventId]: updated }));
      if (updated.participants) {
        setParticipants(updated.participants);
      } else {
        const nextParticipants = await api.getEventParticipants(eventId).catch(() => []);
        setParticipants(nextParticipants);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your RSVP. Please try again.');
    } finally {
      setSaving(null);
    }
  }

  if (!event) {
    return (
      <section className="directory-page event-detail-page">
        <AppTopbar />
        <div className="empty-state-card">
          <span><CalendarDays size={28} /></span>
          <h2>Event not found</h2>
          <p>This event may no longer be available.</p>
          <Link className="button ghost compact" to="/events">Back to Events</Link>
        </div>
      </section>
    );
  }

  const date = event.eventDate ? new Date(event.eventDate) : null;

  return (
    <section className="directory-page event-detail-page">
      <AppTopbar />
      <div className="profile-breadcrumb">
        <Link to="/events">Events</Link>
        <span>/</span>
        <strong>Event Details</strong>
      </div>

      <div className="event-detail-layout">
        <main className="event-detail-main">
          <article className="event-detail-hero">
            <div className="event-media">
              {event.imageUrl ? <img src={event.imageUrl} alt="" /> : <div><CalendarDays size={36} /></div>}
              <span className="event-status-badge">{event.category}</span>
            </div>
            <div className="event-detail-body">
              <h1>{event.title}</h1>
              <p>{event.description}</p>
              <div className="event-metadata">
                <span><CalendarDays size={15} /> {date ? date.toLocaleDateString() : 'Date TBD'}</span>
                <span><Clock size={15} /> {date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Time TBD'}</span>
                <span><MapPin size={15} /> {event.location || 'Location TBD'}</span>
                <span><UserRound size={15} /> {event.postedByName} · {event.postedByCohort}</span>
              </div>
              <div className="event-footer-actions">
                {externalEvent && event.externalLink ? (
                  <a className="button primary compact" href={event.externalLink} target="_blank" rel="noreferrer">Register on Wharton</a>
                ) : (
                  <>
                    <button
                      className="button primary compact"
                      type="button"
                      disabled={saving === 'JOINED' || saving === 'CANCELLED'}
                      onClick={() => {
                        if (joined) {
                          setConfirmWithdraw(true);
                          return;
                        }
                        handleRsvp('JOINED');
                      }}
                    >
                      <CheckCircle2 size={16} /> {saving === 'JOINED' ? 'Joining...' : joined ? 'Joined' : 'Join Event'}
                    </button>
                  </>
                )}
              </div>
              {error && <div className="error-banner event-rsvp-error" role="alert">{error}</div>}
            </div>
          </article>
        </main>

        {!externalEvent && <aside className="event-participants-panel">
          <div className="panel-heading">
            <h2>Participants</h2>
            <span className="badge">{participants.length}</span>
          </div>
          {participants.length > 0 ? (
            <div className="participant-list">
              {participants.map((participant) => (
                <div className="participant-row" key={participant.profileId}>
                  <Avatar name={participant.fullName} src={participant.avatarUrl} />
                  <div>
                    <strong>{participant.fullName}</strong>
                    <span>{participant.currentTitle} at {participant.currentCompany}</span>
                    <small>WEMBA {participant.classYear}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-participants">
              <UsersRound size={24} />
              <p>No participants have joined yet.</p>
            </div>
          )}
        </aside>}
      </div>
      {confirmWithdraw && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="panel modal-panel">
            <p className="eyebrow">Withdraw RSVP</p>
            <h2>Do you want to withdraw from this event?</h2>
            <p>You are currently marked as joined. Withdrawing will remove you from the participant list for this event.</p>
            <div className="action-stack">
              <button className="button danger" type="button" disabled={saving === 'CANCELLED'} onClick={async () => { await handleRsvp('CANCELLED'); setConfirmWithdraw(false); }}>
                {saving === 'CANCELLED' ? 'Withdrawing...' : 'Withdraw'}
              </button>
              <button className="button ghost" type="button" onClick={() => setConfirmWithdraw(false)}>Keep Joined</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
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
