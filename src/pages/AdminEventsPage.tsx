import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../services/api';
import type { AlumniEvent } from '../types/domain';

export function AdminEventsPage() {
  const [events, setEvents] = useState<AlumniEvent[]>([]);

  function refresh() {
    api.getEvents('PENDING').then(setEvents);
  }

  useEffect(refresh, []);

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.moderateEvent(id, status);
    refresh();
  }

  return (
    <section className="content">
      <div className="section-heading">
        <p className="eyebrow">Admin review</p>
        <h1>Pending event submissions</h1>
      </div>
      <div className="admin-list">
        {events.map((event) => (
          <article className="panel admin-item" key={event.id}>
            <div>
              <span className="badge crimson">{event.category}</span>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <p className="muted">{event.location} · Posted by {event.postedByName}</p>
            </div>
            <div className="action-stack">
              <button className="button primary" onClick={() => updateStatus(event.id, 'APPROVED')}><Check size={18} /> Approve</button>
              <button className="button danger" onClick={() => updateStatus(event.id, 'REJECTED')}><X size={18} /> Reject</button>
            </div>
          </article>
        ))}
        {events.length === 0 && <p className="muted">No pending submissions.</p>}
      </div>
    </section>
  );
}
