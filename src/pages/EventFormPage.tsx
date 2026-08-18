import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { eventCategories } from '../data/options';
import { api } from '../services/api';
import type { AlumniEvent, EventCategory } from '../types/domain';

function formatDateMMDDYYYY(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function parseDateMMDDYYYY(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function isPastDateMMDDYYYY(value: string) {
  const parsed = parseDateMMDDYYYY(value);
  if (!parsed) return false;
  const selected = new Date(`${parsed}T12:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today.getTime();
}

export function EventFormPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<AlumniEvent>>({
    title: '',
    category: 'Networking',
    description: '',
    eventDate: '',
    location: '',
    externalLink: '',
    imageUrl: '',
    onlyMyBatchCanJoin: false,
  });

  useEffect(() => {
    if (!editId) return;
    api.getEvents('APPROVED').then((events) => {
      const existing = events.find((e) => e.id === editId);
        if (existing) {
          setForm({
            title: existing.title,
            category: existing.category,
            description: existing.description,
            eventDate: existing.eventDate ? formatDateMMDDYYYY(existing.eventDate) : '',
          location: existing.location,
          externalLink: existing.externalLink ?? '',
          imageUrl: existing.imageUrl ?? '',
          onlyMyBatchCanJoin: existing.onlyMyBatchCanJoin ?? false,
        });
      }
    });
  }, [editId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (form.eventDate && isPastDateMMDDYYYY(String(form.eventDate))) {
        setError('Please choose today or a future date.');
        return;
      }
      const normalizedDate = form.eventDate ? parseDateMMDDYYYY(String(form.eventDate)) : '';
      const eventDate = normalizedDate ? new Date(`${normalizedDate}T12:00:00`).toISOString() : undefined;
      const payload = { ...form, eventDate, postedById: profile?.id };
      if (editId) {
        await api.updateEvent(editId, payload);
      } else {
        await api.submitEvent(payload);
      }
      navigate('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to post this event.');
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 1_000_000) {
      setError('Please choose an image smaller than 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, imageUrl: String(reader.result) }));
      setError('');
    };
    reader.onerror = () => setError('Unable to read that image file.');
    reader.readAsDataURL(file);
  }

  return (
    <section className="content narrow">
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Community submission</p>
          <h1>{editId ? 'Edit alumni event' : 'Submit an alumni event'}</h1>
        </div>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <label>
          <span className="field-label-inline">Title <span className="required-mark">*</span></span>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label>
          <span className="field-label-inline">Category <span className="required-mark">*</span></span>
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as EventCategory })}>{eventCategories.map((category) => <option key={category}>{category}</option>)}</select>
        </label>
        <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label>Date<input type="text" inputMode="numeric" placeholder="MM/DD/YYYY" value={form.eventDate ?? ''} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} /></label>
        <label>
          <span className="field-label-inline">Location <span className="required-mark">*</span></span>
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
        </label>
        <label>External link<input type="url" value={form.externalLink} onChange={(event) => setForm({ ...form, externalLink: event.target.value })} /></label>
        <label>Image URL<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
        <label>Upload image<input type="file" accept="image/*" onChange={(event) => handleImageUpload(event.target.files?.[0])} /></label>
        {form.imageUrl && (
          <div className="event-image-preview">
            <img src={form.imageUrl} alt="Event preview" />
          </div>
        )}
        <label className="toggle-inline">
          <input
            type="checkbox"
            checked={Boolean(form.onlyMyBatchCanJoin)}
            onChange={(event) => setForm({ ...form, onlyMyBatchCanJoin: event.target.checked })}
          />
          Only my batch can join
        </label>
        <button className="button primary" disabled={saving}>{saving ? 'Posting...' : editId ? 'Update event' : 'Post event'}</button>
      </form>
    </section>
  );
}
