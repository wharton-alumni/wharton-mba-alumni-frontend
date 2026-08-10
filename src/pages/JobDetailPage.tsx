import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BriefcaseBusiness, ExternalLink, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { JobListing } from '../data/jobs';

export function JobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    api.getJobById(jobId)
      .then((result) => {
        if (!result) {
          setError('Job listing not found.');
          return;
        }
        setJob(result);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load this job listing.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <section className="content narrow">
        <div className="panel">
          <p className="muted">Loading job listing...</p>
        </div>
      </section>
    );
  }

  if (error || !job) {
    return (
      <section className="content narrow">
        <div className="panel">
          <p className="eyebrow">Job listing</p>
          <h1>{error || 'Job listing not found.'}</h1>
          <Link className="button primary" to="/jobs">Back to job listings</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="content narrow">
      <article className="panel job-detail-panel">
        <div className="job-detail-header">
          <div className="job-icon"><BriefcaseBusiness size={24} /></div>
          <div>
            <p className="eyebrow">Job listing</p>
            <h1>{job.title}</h1>
            <p className="role-line">{job.company} · {job.seniority}</p>
          </div>
        </div>

        <div className="badge-row">
          <span className="badge">{job.type}</span>
          <span className="badge green">{job.industry}</span>
          <span className="badge crimson"><MapPin size={14} /> {job.city}, {job.state}</span>
        </div>

        <div className="profile-story">
          <h2>Description</h2>
          <p>{job.description}</p>
        </div>

        <div className="claim-field-grid">
          <div className="claim-field">
            <span>Posted by</span>
            <strong>{job.postedBy}</strong>
          </div>
          <div className="claim-field">
            <span>Company</span>
            <strong>{job.company}</strong>
          </div>
          <div className="claim-field">
            <span>Seniority</span>
            <strong>{job.seniority}</strong>
          </div>
          <div className="claim-field">
            <span>Employment type</span>
            <strong>{job.type}</strong>
          </div>
        </div>

        <div className="action-stack">
          {job.applicationLink && (
            <a className="button primary" href={normalizeUrl(job.applicationLink)} target="_blank" rel="noreferrer">
              <ExternalLink size={18} /> Apply
            </a>
          )}
          <Link className="button ghost" to="/jobs">Back to job listings</Link>
        </div>
      </article>
    </section>
  );
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
