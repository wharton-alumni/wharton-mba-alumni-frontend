import { useMemo, useState } from 'react';
import { BriefcaseBusiness, MapPin, Search } from 'lucide-react';
import { industries } from '../data/options';
import { jobListings } from '../data/jobs';

export function JobsPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');

  const jobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    return jobListings.filter((job) => {
      const matchesSearch = !normalizedSearch || job.title.toLowerCase().includes(normalizedSearch);
      const matchesIndustry = !industry || job.industry === industry;
      const matchesLocation = !normalizedLocation || `${job.city} ${job.state}`.toLowerCase().includes(normalizedLocation);
      return matchesSearch && matchesIndustry && matchesLocation;
    });
  }, [industry, location, search]);

  return (
    <section className="content">
      <div className="section-heading">
        <p className="eyebrow">Job listings</p>
        <h1>Executive opportunities from the Wharton EMBA network</h1>
      </div>
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
            <article className="job-card" key={job.id}>
              <div className="job-icon"><BriefcaseBusiness size={22} /></div>
              <div>
                <div className="card-title-row">
                  <h2>{job.title}</h2>
                  <span className="badge">{job.type}</span>
                </div>
                <p className="role-line">{job.company} · {job.seniority}</p>
                <p className="muted"><MapPin size={15} /> {job.city}, {job.state} · {job.industry}</p>
                <p>{job.description}</p>
                <p className="muted">Posted by {job.postedBy}</p>
              </div>
            </article>
          ))}
          {jobs.length === 0 && <p className="muted">No job listings match these filters.</p>}
        </div>
      </div>
    </section>
  );
}
