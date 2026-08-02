import { FormEvent, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { eventCategories } from '../data/options';
import { api } from '../services/api';
import type { AlumniEvent, EventCategory } from '../types/domain';

export function EventFormPage() {
  const { profile } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Partial<AlumniEvent>>({
    title: '',
    category: 'Networking',
    description: '',
    eventDate: '',
    location: '',
    externalLink: '',
    imageUrl: '',
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const eventDate = form.eventDate ? new Date(form.eventDate).toISOString() : undefined;
    await api.submitEvent({ ...form, eventDate, postedById: profile?.id });
    setSubmitted(true);
  }

  return (
    <section className="content narrow">
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Community submission</p>
          <h1>Submit an alumni event</h1>
        </div>
        {submitted && <div className="success-banner">Your event has been submitted and is pending administrator approval.</div>}
        <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
        <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as EventCategory })}>{eventCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label>
        <label>Date/time<input type="datetime-local" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} /></label>
        <label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></label>
        <label>External link<input type="url" value={form.externalLink} onChange={(event) => setForm({ ...form, externalLink: event.target.value })} /></label>
        <label>Image URL<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
        <button className="button primary">Submit for approval</button>
      </form>
    </section>
  );
}
