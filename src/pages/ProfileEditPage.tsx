import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { bioBookRegistrationFields, classYearToWembaBatch, wembaBatchToClassYear } from '../data/biobookFields';
import { cohorts, industries } from '../data/options';
import { api } from '../services/api';
import type { AlumniProfile } from '../types/domain';

type EditableDetails = Record<string, string | boolean>;

const editableBioBookFields = bioBookRegistrationFields.filter((field) => field.key !== 'Password');

export function ProfileEditPage() {
  const { profile, updateCurrentProfile } = useAuth();
  const navigate = useNavigate();
  const initialDetails = useMemo(() => profile ? detailsFromProfile(profile) : {}, [profile]);
  const [form, setForm] = useState(profile);
  const [details, setDetails] = useState<EditableDetails>(initialDetails);
  const [error, setError] = useState('');
  if (!profile || !form) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile || !form) return;
    setError('');
    const synced = syncProfileFromDetails(form, details);
    try {
      const updated = await api.updateProfile(profile.id, {
        ...synced,
        bioBookProfileJson: JSON.stringify(details),
      });
      updateCurrentProfile(updated);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    }
  }

  function updateDetail(key: string, value: string | boolean) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  function updatePhoto(value: string) {
    setForm((current) => current ? { ...current, avatarUrl: value } : current);
    updateDetail('headshotProfessional', value);
  }

  async function handlePhotoUpload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for your profile photo.');
      return;
    }
    if (file.size > 2_000_000) {
      setError('Please choose an image smaller than 2 MB.');
      return;
    }
    try {
      setError('');
      const upload = await api.uploadProfilePhoto(file);
      updatePhoto(upload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload that image file.');
    }
  }

  return (
    <section className="content narrow">
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Profile management</p>
          <h1>Edit your BioBook and profile details</h1>
          <p className="muted">All BioBook-format fields are editable here. Core directory fields stay synced from these details.</p>
        </div>
        <div className="photo-editor">
          {form.avatarUrl ? (
            <img className="avatar large avatar-image" src={form.avatarUrl} alt={`${form.firstName} ${form.lastName}`} />
          ) : (
            <div className="avatar large">{form.firstName[0]}{form.lastName[0]}</div>
          )}
          <div className="photo-editor-fields">
            <label>Profile photo URL<input value={form.avatarUrl ?? ''} onChange={(event) => updatePhoto(event.target.value)} /></label>
            <label>Upload profile photo<input type="file" accept="image/*" onChange={(event) => handlePhotoUpload(event.target.files?.[0])} /></label>
            {form.avatarUrl && <button type="button" className="button ghost compact" onClick={() => updatePhoto('')}>Remove photo</button>}
          </div>
        </div>
        <div className="registration-fields">
          {editableBioBookFields.map((field) => (
            <BioBookEditInput
              key={field.key}
              field={field}
              value={details[fieldKey(field)] ?? ''}
              onChange={(value) => updateDetail(fieldKey(field), value)}
            />
          ))}
        </div>
        <div className="toggle-row">
          <label><input type="checkbox" checked={form.hiring} onChange={(event) => setForm({ ...form, hiring: event.target.checked })} /> Currently hiring</label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary">Save profile</button>
      </form>
    </section>
  );
}

function BioBookEditInput({
  field,
  value,
  onChange,
}: {
  field: (typeof editableBioBookFields)[number];
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
        <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  if (field.key === 'Cohort') {
    return (
      <label>
        {field.label}
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
          {cohorts.map((cohort) => <option key={cohort}>{cohort}</option>)}
        </select>
      </label>
    );
  }

  if (field.key === 'Industry') {
    return (
      <label>
        {field.label}
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
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

  return (
    <label className={field.key.length > 42 ? 'wide-field' : undefined}>
      {field.label}
      <input type={field.inputType ?? 'text'} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} required={field.required} />
    </label>
  );
}

function detailsFromProfile(profile: AlumniProfile): EditableDetails {
  const parsed = parseDetails(profile.bioBookProfileJson);
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const details: EditableDetails = {};
  for (const field of editableBioBookFields) {
    const key = fieldKey(field);
    details[key] = parsed[key] ?? parsed[field.key] ?? fallbackValue(key, profile, fullName);
  }
  return details;
}

function syncProfileFromDetails(profile: AlumniProfile, details: EditableDetails): AlumniProfile {
  const fullName = String(details.fullLegalName ?? '').trim();
  const [firstName = profile.firstName, ...lastNameParts] = fullName.split(/\s+/);
  const cityValue = String(details.currentCityOfResidence ?? profile.city ?? '');
  const [city, ...stateParts] = cityValue.split(',').map((part) => part.trim());
  return {
    ...profile,
    firstName: firstName || profile.firstName,
    lastName: lastNameParts.join(' ') || profile.lastName,
    phoneNumber: String(details.mobileNumber || profile.phoneNumber || 'Not provided'),
    cohortCampus: normalizeCohort(String(details.cohortCampus || profile.cohortCampus)),
    classYear: wembaBatchToClassYear(String(details['WEMBA class'] || classYearToWembaBatch(profile.classYear))),
    currentTitle: String(details.currentTitleRole || profile.currentTitle),
    currentCompany: String(details.currentEmployer || profile.currentCompany),
    industry: String(details.industry || profile.industry),
    city: city || profile.city,
    stateCountry: stateParts.join(', ') || profile.stateCountry,
    linkedinUrl: String(details.linkedinUrl || profile.linkedinUrl || ''),
    bio: String(details.careerTrajectoryIn3Bullets || details.canHelpClassmatesWith || profile.bio),
    willingToMentor: Boolean(details.willingToMentor),
    avatarUrl: String(details.headshotProfessional || profile.avatarUrl || ''),
  };
}

function fallbackValue(key: string, profile: AlumniProfile, fullName: string) {
  const values: Record<string, string | boolean> = {
    fullLegalName: fullName,
    'WEMBA class': classYearToWembaBatch(profile.classYear),
    cohortCampus: profile.cohortCampus,
    currentCityOfResidence: [profile.city, profile.stateCountry].filter(Boolean).join(', '),
    currentEmployer: profile.currentCompany,
    currentTitleRole: profile.currentTitle,
    industry: profile.industry,
    mobileNumber: profile.phoneNumber,
    linkedinUrl: profile.linkedinUrl ?? '',
    careerTrajectoryIn3Bullets: profile.bio,
    willingToMentor: profile.willingToMentor,
    headshotProfessional: profile.avatarUrl ?? '',
  };
  return values[key] ?? '';
}

function parseDetails(value?: string) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as EditableDetails : {};
  } catch {
    return {};
  }
}

function fieldKey(field: (typeof editableBioBookFields)[number]) {
  return field.profileKey ?? field.key;
}

function normalizeCohort(value: string): AlumniProfile['cohortCampus'] {
  if (value === 'San Francisco' || value === 'SF') return 'San Francisco';
  if (value === 'Global') return 'Global';
  return 'Philadelphia';
}
