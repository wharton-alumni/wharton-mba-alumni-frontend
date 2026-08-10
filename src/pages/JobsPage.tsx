import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, ExternalLink, MapPin, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { industries } from '../data/options';
import { api } from '../services/api';
import type { JobListing } from '../data/jobs';

const initialJobForm: Omit<JobListing, 'id' | 'postedBy'> = {
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
};

export function JobsPage() {
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState<JobListing[]>([]);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getJobs().then(setAllJobs);
  }, []);

  const jobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    return allJobs.filter((job) => {
      const matchesSearch = !normalizedSearch || job.title.toLowerCase().includes(normalizedSearch);
      const matchesIndustry = !industry || job.industry === industry;
      const matchesLocation = !normalizedLocation || `${job.city} ${job.state}`.toLowerCase().includes(normalizedLocation);
      return matchesSearch && matchesIndustry && matchesLocation;
    });
  }, [allJobs, industry, location, search]);

  async function handleCreateJob(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const created = await api.createJob(jobForm);
      setAllJobs((current) => [created, ...current]);
      setJobForm(initialJobForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please log in again before posting a job.');
    }
  }

  return (
    <section className="content">
      <div className="page-actions">
        <div className="section-heading">
          <p className="eyebrow">Job listings</p>
          <h1>Executive opportunities from the Wharton EMBA network</h1>
        </div>
        <button className="button primary" onClick={() => setShowForm((current) => !current)}><Plus size={18} /> Post a job</button>
      </div>
      {showForm && (
        <form className="panel form-grid job-form-panel" onSubmit={handleCreateJob}>
          <div className="field-row">
            <label>Job title<input value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} required /></label>
            <label>Company<input value={jobForm.company} onChange={(event) => setJobForm({ ...jobForm, company: event.target.value })} required /></label>
          </div>
          <div className="field-row">
            <label>Industry<select value={jobForm.industry} onChange={(event) => setJobForm({ ...jobForm, industry: event.target.value })}>{industries.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Seniority<input value={jobForm.seniority} onChange={(event) => setJobForm({ ...jobForm, seniority: event.target.value })} required /></label>
          </div>
          <div className="field-row">
            <label>City<input value={jobForm.city} onChange={(event) => setJobForm({ ...jobForm, city: event.target.value })} required /></label>
            <label>State/Country<input value={jobForm.state} onChange={(event) => setJobForm({ ...jobForm, state: event.target.value })} required /></label>
          </div>
          <label>Type<input value={jobForm.type} onChange={(event) => setJobForm({ ...jobForm, type: event.target.value })} required /></label>
          <label>Application link<input type="url" value={jobForm.applicationLink ?? ''} onChange={(event) => setJobForm({ ...jobForm, applicationLink: event.target.value })} placeholder="https://..." /></label>
          <label>Description<textarea value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} required /></label>
          {error && <p className="form-error">{error}</p>}
          <div className="action-stack">
            <button className="button primary">Create job</button>
            <button type="button" className="button ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="directory-layout">
        <aside className="filters panel">
          <label className="search-field">
            <Search size={18} />
            <input
              placeholder="Search by job title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Industry
            <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="">All</option>
              {industries.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            City & State
            <input
              placeholder="City or state"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>
        </aside>
        <div className="job-list">
          {jobs.map((job) => (
            <article
              className="job-card clickable-card"
              key={job.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/jobs/${job.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') navigate(`/jobs/${job.id}`);
              }}
            >
              <div className="job-icon"><BriefcaseBusiness size={22} /></div>
              <div>
                <div className="card-title-row">
                  <h2>{job.title}</h2>
                  <span className="badge">{job.type}</span>
                </div>
                <p className="role-line">{job.company} · {job.seniority}</p>
                <p className="muted"><MapPin size={15} /> {job.city}, {job.state} · {job.industry}</p>
                <p className="muted">Posted by {job.postedBy}</p>
                <div className="profile-card-links">
                  <span className="button ghost compact">View details</span>
                  {job.applicationLink && (
                    <span className="button ghost compact"><ExternalLink size={16} /> Application link</span>
                  )}
                </div>
              </div>
            </article>
          ))}
          {jobs.length === 0 && <p className="muted">No job listings match these filters.</p>}
        </div>
      </div>
    </section>
  );
}
