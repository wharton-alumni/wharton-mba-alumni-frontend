import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { industries } from '../data/options';
import { api } from '../services/api';

export function ProfileEditPage() {
  const { profile, updateCurrentProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(profile);
  const [error, setError] = useState('');
  if (!profile || !form) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile || !form) return;
    setError('');
    try {
      const updated = await api.updateProfile(profile.id, form);
      updateCurrentProfile(updated);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    }
  }

  return (
    <section className="content narrow">
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Profile management</p>
          <h1>Edit contact and professional details</h1>
        </div>
        <div className="field-row">
          <label>Current Company<input value={form.currentCompany} onChange={(event) => setForm({ ...form, currentCompany: event.target.value })} required /></label>
          <label>Title<input value={form.currentTitle} onChange={(event) => setForm({ ...form, currentTitle: event.target.value })} required /></label>
        </div>
        <label>Industry<select value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })}>{industries.map((industry) => <option key={industry}>{industry}</option>)}</select></label>
        <div className="field-row">
          <label>City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required /></label>
          <label>State/Country<input value={form.stateCountry} onChange={(event) => setForm({ ...form, stateCountry: event.target.value })} required /></label>
        </div>
        <label>LinkedIn URL<input value={form.linkedinUrl ?? ''} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} /></label>
        <label>Avatar URL<input value={form.avatarUrl ?? ''} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} /></label>
        <label>Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} required /></label>
        <div className="toggle-row">
          <label><input type="checkbox" checked={form.willingToMentor} onChange={(event) => setForm({ ...form, willingToMentor: event.target.checked })} /> Willing to mentor</label>
          <label><input type="checkbox" checked={form.hiring} onChange={(event) => setForm({ ...form, hiring: event.target.checked })} /> Currently hiring</label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary">Save profile</button>
      </form>
    </section>
  );
}
