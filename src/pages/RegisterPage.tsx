import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { PasswordField } from '../components/PasswordField';
import { cohorts, industries } from '../data/options';
import { bioBookProfileToRegistration, bioBookRegistrationFields } from '../data/biobookFields';
import { api } from '../services/api';

type RegistrationFormState = Record<string, string | boolean>;

function buildInitialForm(email = ''): RegistrationFormState {
  return Object.fromEntries(
    bioBookRegistrationFields.map((field) => {
      if (field.key === 'Work email') return [field.key, email];
      if (field.key === 'Cohort') return [field.key, 'Philadelphia'];
      if (field.key === 'WEMBA class') return [field.key, "WEMBA'52"];
      if (field.key === 'Industry') return [field.key, 'Technology'];
      if (field.inputType === 'checkbox') return [field.key, false];
      return [field.key, ''];
    }),
  );
}

export function RegisterPage() {
  const location = useLocation();
  const redirectedState = location.state as { email?: string; showConsent?: boolean } | null;
  const redirectedEmail = redirectedState?.email ?? '';
  const [form, setForm] = useState<RegistrationFormState>(() => buildInitialForm(redirectedEmail));
  const [consented, setConsented] = useState(!redirectedState?.showConsent);
  const [showConsent, setShowConsent] = useState(Boolean(redirectedState?.showConsent));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  function update(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!consented) {
      setShowConsent(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await api.register(bioBookProfileToRegistration(form));
      setSession(session.token, session.profile);
      navigate('/dashboard');
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
      {showConsent && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="panel modal-panel">
            <p className="eyebrow">Consent</p>
            <h2>Store profile data</h2>
            <p>The profile can be prefilled from previously fetched information. By continuing, you consent to storing this account and profile data for the alumni portal experience.</p>
            <div className="action-stack">
              <button
                className="button primary"
                onClick={async () => {
                  await api.recordConsent(String(form['Work email'] ?? ''), 'manual-registration');
                  setConsented(true);
                  setShowConsent(false);
                }}
              >
                I consent
              </button>
              <button className="button ghost" onClick={() => setShowConsent(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
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

  if (field.inputType === 'select' && field.options) {
    return (
      <label>
        {field.label}
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required}>
          {!value && <option value="">Select one</option>}
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  if (field.inputType === 'password') {
    return (
      <PasswordField
        label={field.label}
        value={String(value ?? '')}
        onChange={(nextValue) => onChange(nextValue)}
        minLength={6}
        required={field.required}
      />
    );
  }

  return (
    <label className={field.key.length > 42 ? 'wide-field' : undefined}>
      {field.label}
      <input
        type={field.inputType ?? 'text'}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
      />
    </label>
  );
}
