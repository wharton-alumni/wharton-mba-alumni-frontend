import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { PasswordField } from '../components/PasswordField';
import { cohorts, industries } from '../data/options';
import { bioBookProfileToFormValues, bioBookProfileToRegistration, bioBookRegistrationFields } from '../data/biobookFields';
import { api } from '../services/api';
import type { AlumniProfile, BioBookProfile } from '../types/domain';

type RegistrationFormState = Record<string, string | boolean>;
type FieldErrors = Record<string, string>;
const CONFIRM_PASSWORD_KEY = 'Confirm Password';

function buildInitialForm(email = '', bioBookProfile?: BioBookProfile | null): RegistrationFormState {
  if (bioBookProfile) {
    const initial = bioBookProfileToFormValues(bioBookProfile);
    initial['Work email'] = email || initial['Work email'] || '';
    return initial;
  }
  return Object.fromEntries(
    bioBookRegistrationFields.map((field) => {
      if (field.key === 'Work email') return [field.key, email];
      if (field.inputType === 'checkbox') return [field.key, false];
      return [field.key, ''];
    }),
  );
}

export function RegisterPage() {
  const location = useLocation();
  const redirectedState = location.state as { email?: string; showConsent?: boolean; bioBookProfile?: BioBookProfile | null; createProfile?: boolean } | null;
  const redirectedEmail = redirectedState?.email ?? '';
  const hasPrefilledBioBook = Boolean(redirectedState?.bioBookProfile);
  const [form, setForm] = useState<RegistrationFormState>(() => buildInitialForm(redirectedEmail, redirectedState?.bioBookProfile ?? null));
  const [consented, setConsented] = useState(!redirectedState?.showConsent);
  const [showConsent, setShowConsent] = useState(Boolean(redirectedState?.showConsent));
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);

  function update(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateFieldError(key: string, message: string) {
    setFieldErrors((current) => ({ ...current, [key]: message }));
  }

  function validateRequiredFields() {
    const nextErrors: FieldErrors = {};
    for (const field of bioBookRegistrationFields) {
      if (!field.required) continue;
      const value = form[field.key];
      if (typeof value === 'boolean') {
        if (!value) nextErrors[field.key] = `${field.label} is required.`;
      } else if (!String(value ?? '').trim()) {
        nextErrors[field.key] = `${field.label} is required.`;
      }
    }
    if (!String(form[CONFIRM_PASSWORD_KEY] ?? '').trim()) {
      nextErrors[CONFIRM_PASSWORD_KEY] = 'Confirm Password is required.';
    } else if (String(form.Password ?? '') !== String(form[CONFIRM_PASSWORD_KEY] ?? '')) {
      nextErrors[CONFIRM_PASSWORD_KEY] = 'Passwords do not match.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateRequiredFields()) {
      setError('Please complete the required fields highlighted.');
      return;
    }
    if (!consented) {
      setShowConsent(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await api.register(bioBookProfileToRegistration(form));
      if (headshotFile) {
        const upload = await api.uploadProfilePhoto(headshotFile);
        const updatedProfile = await api.updateProfile(session.profile.id, {
          avatarUrl: upload.url,
          bioBookProfileJson: JSON.stringify({
            ...form,
            'Headshot (professional)': upload.url,
          }),
        });
        setSession(session.token, updatedProfile);
      } else {
        setSession(session.token, session.profile);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content narrow">
      <form className="panel form-grid" onSubmit={handleSubmit} noValidate>
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
              error={fieldErrors[field.key]}
              onError={(message) => updateFieldError(field.key, message)}
              onHeadshotFileChange={setHeadshotFile}
            />
          ))}
          <div className="password-field-wrap">
            <PasswordField
              label={<span className="field-label-text">Confirm Password<span className="required-mark" aria-label="required"> *</span></span>}
              value={String(form[CONFIRM_PASSWORD_KEY] ?? '')}
              onChange={(value) => update(CONFIRM_PASSWORD_KEY, value)}
              minLength={6}
              required
            />
            {fieldErrors[CONFIRM_PASSWORD_KEY] && <FieldError message={fieldErrors[CONFIRM_PASSWORD_KEY]} />}
          </div>
        </div>
        {error && <div className="error-banner" role="alert">{error}</div>}
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
  error,
  onError,
  onHeadshotFileChange,
}: {
  field: (typeof bioBookRegistrationFields)[number];
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  error?: string;
  onError: (message: string) => void;
  onHeadshotFileChange: (file: File | null) => void;
}) {
  if (field.inputType === 'checkbox') {
    return (
      <label className="toggle-inline">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span><FieldLabel field={field} />{error && <FieldError message={error} />}</span>
      </label>
    );
  }

  if (field.inputType === 'textarea') {
    return (
      <label className="wide-field">
        <FieldLabel field={field} />
        <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required} />
        {error && <FieldError message={error} />}
      </label>
    );
  }

  if (field.key === 'Cohort') {
    return (
      <label>
        <FieldLabel field={field} />
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required}>
          {cohorts.map((cohort) => <option key={cohort}>{cohort}</option>)}
        </select>
        {error && <FieldError message={error} />}
      </label>
    );
  }

  if (field.key === 'Industry') {
    return (
      <label>
        <FieldLabel field={field} />
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required}>
          {industries.map((industry) => <option key={industry}>{industry}</option>)}
        </select>
        {error && <FieldError message={error} />}
      </label>
    );
  }

  if (field.inputType === 'select' && field.options) {
    return (
      <label>
        <FieldLabel field={field} />
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required}>
          {!value && <option value="">Select one</option>}
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
        {error && <FieldError message={error} />}
      </label>
    );
  }

  if (field.key === 'Headshot (professional)') {
    const preview = String(value ?? '');

    function handlePhotoUpload(file?: File) {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        onError('Please choose an image file for your professional headshot.');
        return;
      }
      if (file.size > 1_000_000) {
        onError('Please choose an image smaller than 1 MB.');
        return;
      }
      onHeadshotFileChange(file);
      onError('');
      onChange(URL.createObjectURL(file));
    }

    return (
      <div className="registration-headshot-field wide-field">
        <div className="registration-headshot-preview">
          {preview ? <img src={preview} alt="Professional headshot preview" /> : <span>Photo</span>}
        </div>
        <div className="registration-headshot-controls">
          <label>
            <FieldLabel field={field} />
            <input type="file" accept="image/*" onChange={(event) => handlePhotoUpload(event.target.files?.[0])} />
          </label>
          {preview && <button type="button" className="button ghost compact" onClick={() => { onHeadshotFileChange(null); onChange(''); }}>Remove photo</button>}
          {error && <FieldError message={error} />}
        </div>
      </div>
    );
  }

  if (field.inputType === 'password') {
    return (
      <div className="password-field-wrap">
        <PasswordField
          label={<FieldLabel field={field} />}
          value={String(value ?? '')}
          onChange={(nextValue) => onChange(nextValue)}
          minLength={6}
          required={field.required}
        />
        {error && <FieldError message={error} />}
      </div>
    );
  }

  return (
    <label className={field.key.length > 42 ? 'wide-field' : undefined}>
      <FieldLabel field={field} />
      <input
        type={field.inputType ?? 'text'}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
      />
      {error && <FieldError message={error} />}
    </label>
  );
}

function FieldLabel({ field }: { field: (typeof bioBookRegistrationFields)[number] }) {
  return (
    <span className="field-label-text">
      {field.label}
      {field.required && <span className="required-mark" aria-label="required"> *</span>}
    </span>
  );
}

function FieldError({ message }: { message: string }) {
  return <span className="field-error" role="alert">{message}</span>;
}
