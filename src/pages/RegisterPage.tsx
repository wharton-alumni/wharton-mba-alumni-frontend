import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { cohorts, industries } from '../data/options';
import { bioBookProfileToRegistration, bioBookRegistrationFields } from '../data/biobookFields';
import { api } from '../services/api';

type RegistrationFormState = Record<string, string | boolean>;

function buildInitialForm(email = ''): RegistrationFormState {
  return Object.fromEntries(
    bioBookRegistrationFields.map((field) => {
      if (field.key === 'Work email') return [field.key, email];
      if (field.key === 'Cohort') return [field.key, 'Philadelphia'];
      if (field.key === 'Industry') return [field.key, 'Technology'];
      if (field.inputType === 'checkbox') return [field.key, false];
      return [field.key, ''];
    }),
  );
}

export function RegisterPage() {
  const location = useLocation();
  const redirectedEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [form, setForm] = useState<RegistrationFormState>(() => buildInitialForm(redirectedEmail));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  function update(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await api.register(bioBookProfileToRegistration(form));
      setSession(session.token, session.profile);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content narrow">
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Profile setup</p>
          <h1>Create your alumni profile</h1>
          <p className="muted">These fields follow the Wharton EMBA BioBook format. Public directory pages will use only professional and networking-safe details.</p>
        </div>
        <div className="registration-fields">
          {bioBookRegistrationFields.map((field) => (
            <BioBookInput
              key={field.key}
              field={field}
              value={form[field.key]}
              onChange={(value) => update(field.key, value)}
            />
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" disabled={loading}>{loading ? 'Creating...' : 'Create profile'}</button>
      </form>
    </section>
  );
}

function BioBookInput({
  field,
  value,
  onChange,
}: {
  field: (typeof bioBookRegistrationFields)[number];
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (field.inputType === 'checkbox') {
    return (
      <label className="toggle-inline">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.inputType === 'textarea') {
    return (
      <label className="wide-field">
        {field.label}
        <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required} />
      </label>
    );
  }

  if (field.key === 'Cohort') {
    return (
      <label>
        {field.label}
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required}>
          {cohorts.map((cohort) => <option key={cohort}>{cohort}</option>)}
        </select>
      </label>
    );
  }

  if (field.key === 'Industry') {
    return (
      <label>
        {field.label}
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required}>
          {industries.map((industry) => <option key={industry}>{industry}</option>)}
        </select>
      </label>
    );
  }

  return (
    <label className={field.key.length > 42 ? 'wide-field' : undefined}>
      {field.label}
      <input
        type={field.inputType ?? 'text'}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        minLength={field.inputType === 'password' ? 6 : undefined}
        required={field.required}
      />
    </label>
  );
}
