import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, ExternalLink, MapPin, Plus, RotateCcw, Search, Trash2, Pencil, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppTopbar } from '../components/AppTopbar';
import { useAuth } from '../components/AuthContext';
import { industries } from '../data/options';
import { api } from '../services/api';
import type { JobListing } from '../data/jobs';

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

interface JobFilters {
  search: string;
  industry: string;
  role: string;
  location: string;
  type: string;
}

const emptyFilters: JobFilters = {
  search: '',
  industry: '',
  role: '',
  location: '',
  type: '',
};

const emptyJobForm: Omit<JobListing, 'id' | 'postedBy' | 'postedById'> = {
  title: '',
  company: '',
  industry: 'Technology',
  city: '',
  state: '',
  type: 'Full-time',
  seniority: 'Executive',
  externalLink: '',
  applicationLink: '',
  description: '',
      startDate: '',
      endDate: '',
};

const jobTypes = ['Full-time', 'Fractional', 'Advisory'];

export function JobsPage() {
  const [allJobs, setAllJobs] = useState<JobListing[]>([]);
  const [filters, setFilters] = useState<JobFilters>(emptyFilters);
  const [showForm, setShowForm] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    api.getJobs().then(setAllJobs);
  }, []);

  const roleOptions = useMemo(() => unique(allJobs.map((job) => job.seniority)), [allJobs]);
  const jobs = useMemo(() => allJobs.filter((job) => matchesJob(job, filters)), [allJobs, filters]);
  const companies = unique(allJobs.map((job) => job.company)).length;
  const remoteRoles = allJobs.filter((job) => `${job.city} ${job.state}`.toLowerCase().includes('remote')).length;

  function openEditForm(job: JobListing) {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      company: job.company,
      industry: job.industry,
      city: job.city,
      state: job.state,
      type: job.type,
      seniority: job.seniority,
      externalLink: job.externalLink ?? '',
      applicationLink: job.applicationLink ?? '',
      description: job.description,
      startDate: job.startDate ? formatDateMMDDYYYY(job.startDate) : '',
      endDate: job.endDate ? formatDateMMDDYYYY(job.endDate) : '',
    });
    setShowForm(true);
  }

  function openCreateForm() {
    setEditingJobId(null);
    setJobForm(emptyJobForm);
    setShowForm(true);
  }

  async function handleSubmitJob(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if ((jobForm.startDate && isPastDateMMDDYYYY(String(jobForm.startDate))) || (jobForm.endDate && isPastDateMMDDYYYY(String(jobForm.endDate)))) {
        setError('Please choose today or a future date.');
        return;
      }
      const payload = {
        ...jobForm,
        startDate: parseDateMMDDYYYY(String(jobForm.startDate ?? '')) ? new Date(`${parseDateMMDDYYYY(String(jobForm.startDate ?? ''))}T12:00:00`).toISOString() : undefined,
        endDate: parseDateMMDDYYYY(String(jobForm.endDate ?? '')) ? new Date(`${parseDateMMDDYYYY(String(jobForm.endDate ?? ''))}T12:00:00`).toISOString() : undefined,
      };
      if (editingJobId) {
        const updated = await api.updateJob(editingJobId, payload);
        setAllJobs((current) => current.map((j) => (j.id === editingJobId ? updated : j)));
      } else {
        const created = await api.createJob(payload);
        setAllJobs((current) => [created, ...current]);
      }
      setJobForm(emptyJobForm);
      setEditingJobId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please log in again before posting a job.');
    }
  }

  async function handleDeleteJob(id: string) {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.deleteJob(id);
      setAllJobs((current) => current.filter((j) => j.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to delete this job.');
    }
  }

  return (
    <section className="directory-page jobs-page">
      <AppTopbar value={filters.search} onSearch={(search) => setFilters({ ...filters, search })} />

      <div className="directory-header">
        <div>
          <h1>Job Opportunities</h1>
          <p>Connect with career moves across the WEMBA network.</p>
        </div>
        <div className="directory-stats">
          <Metric icon={BriefcaseBusiness} value={String(allJobs.length)} label="Active Jobs" />
          <Metric icon={Building2} value={String(companies)} label="Hiring Companies" />
          <Metric icon={Wifi} value={String(remoteRoles)} label="Remote Roles" />
        </div>
        <button className="button primary compact" type="button" onClick={openCreateForm}>
          <Plus size={16} /> Post a Job
        </button>
      </div>

      {showForm && (
        <form className="panel form-grid job-form-panel page-inline-form" onSubmit={handleSubmitJob}>
          <div className="field-row">
            <label>Job title<input value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} required /></label>
            <label>Company<input value={jobForm.company} onChange={(event) => setJobForm({ ...jobForm, company: event.target.value })} required /></label>
          </div>
          <div className="field-row">
            <label>Industry<select value={jobForm.industry} onChange={(event) => setJobForm({ ...jobForm, industry: event.target.value })}>{industries.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Function / Role<input value={jobForm.seniority} onChange={(event) => setJobForm({ ...jobForm, seniority: event.target.value })} required /></label>
          </div>
          <div className="field-row">
            <label>City<input value={jobForm.city} onChange={(event) => setJobForm({ ...jobForm, city: event.target.value })} required /></label>
            <label>State/Country<input value={jobForm.state} onChange={(event) => setJobForm({ ...jobForm, state: event.target.value })} required /></label>
          </div>
          <div className="field-row">
            <label>Start date<input type="text" inputMode="numeric" placeholder="MM/DD/YYYY" value={jobForm.startDate ?? ''} onChange={(event) => setJobForm({ ...jobForm, startDate: event.target.value })} /></label>
            <label>End date<input type="text" inputMode="numeric" placeholder="MM/DD/YYYY" value={jobForm.endDate ?? ''} onChange={(event) => setJobForm({ ...jobForm, endDate: event.target.value })} /></label>
          </div>
          <label>Type<select value={jobForm.type} onChange={(event) => setJobForm({ ...jobForm, type: event.target.value })}>{jobTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Application link<input type="url" value={jobForm.applicationLink ?? ''} onChange={(event) => setJobForm({ ...jobForm, applicationLink: event.target.value })} placeholder="https://..." /></label>
          <label>Description<textarea value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} required /></label>
          {error && <p className="form-error">{error}</p>}
          <div className="action-stack">
            <button className="button primary">{editingJobId ? 'Update job' : 'Create job'}</button>
            <button type="button" className="button ghost" onClick={() => { setShowForm(false); setEditingJobId(null); }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="directory-workspace">
        <aside className="directory-filter-panel">
          <div className="panel-heading">
            <h2>Filter Jobs</h2>
            <button type="button" onClick={() => setFilters(emptyFilters)}>Reset</button>
          </div>
          <label className="search-field">
            <Search size={17} />
            <input placeholder="Keyword search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <label>Industry<select value={filters.industry} onChange={(event) => setFilters({ ...filters, industry: event.target.value })}><option value="">All Industries</option>{industries.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Function / Role<select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}><option value="">All Roles</option>{roleOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Location<input placeholder="City, state, or remote" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} /></label>
          <label>Job Type<select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">All Types</option>{jobTypes.map((option) => <option key={option}>{option}</option>)}</select></label>
        </aside>

        <section className="directory-results-panel jobs-results-panel">
          {jobs.length > 0 ? (
            <div className="job-row-list">
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isOwner={profile?.id === job.postedById || profile?.role === 'ADMIN'}
                  onEdit={() => openEditForm(job)}
                  onDelete={() => handleDeleteJob(job.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No job listings match these filters" message="Try widening your keyword, location, industry, or role filters." icon={RotateCcw} />
          )}
        </section>
      </div>
    </section>
  );
}

function JobRow({ job, isOwner, onEdit, onDelete }: { job: JobListing; isOwner: boolean; onEdit: () => void; onDelete: () => void }) {
  const location = [job.city, job.state].filter(Boolean).join(', ') || 'Location not provided';
  const logo = initialsFor(job.company);
  return (
    <article className="job-row-card">
      <div className="company-logo">{logo}</div>
      <div className="job-row-main">
        <div>
          <h2>{job.title}</h2>
          <p>{job.company} · {job.seniority}</p>
        </div>
        <div className="job-row-meta">
          <span><MapPin size={15} /> {location}</span>
          <span>{job.industry}</span>
          <span>{job.type}</span>
        </div>
      </div>
      <div className="job-row-actions">
        {job.applicationLink && <a className="button primary compact" href={job.applicationLink} target="_blank" rel="noreferrer">Apply <ExternalLink size={15} /></a>}
        <Link className="button ghost compact" to={`/jobs/${job.id}`}>View Details</Link>
        {isOwner && (
          <>
            <button className="button ghost compact" type="button" onClick={onEdit}><Pencil size={15} /> Edit</button>
            <button className="button ghost compact" type="button" onClick={onDelete} style={{ color: '#990000' }}><Trash2 size={15} /> Delete</button>
          </>
        )}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof BriefcaseBusiness; value: string; label: string }) {
  return (
    <div>
      <Icon size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ title, message, icon: Icon }: { title: string; message: string; icon: typeof RotateCcw }) {
  return (
    <div className="empty-state-card">
      <span><Icon size={28} /></span>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

function matchesJob(job: JobListing, filters: JobFilters) {
  const search = filters.search.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  if (search && ![job.title, job.company, job.description, job.seniority].join(' ').toLowerCase().includes(search)) return false;
  if (filters.industry && job.industry !== filters.industry) return false;
  if (filters.role && job.seniority !== filters.role) return false;
  if (location && !`${job.city} ${job.state}`.toLowerCase().includes(location)) return false;
  if (filters.type && job.type !== filters.type) return false;
  return true;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
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
