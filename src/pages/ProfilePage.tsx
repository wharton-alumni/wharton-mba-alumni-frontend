import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export function ProfilePage() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <section className="content narrow">
      <article className="panel profile-detail">
        <div className="profile-hero">
          {profile.avatarUrl ? (
            <img className="avatar large avatar-image" src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
          ) : (
            <div className="avatar large">{profile.firstName[0]}{profile.lastName[0]}</div>
          )}
          <div>
            <p className="eyebrow">{profile.cohortCampus} · Class of {profile.classYear}</p>
            <h1>{profile.firstName} {profile.lastName}</h1>
            <p className="role-line">{profile.currentTitle} at {profile.currentCompany}</p>
          </div>
          <Link className="button primary" to="/profile/edit">Edit profile</Link>
        </div>
        <div className="badge-row">
          <span className="badge">{profile.industry}</span>
          {profile.willingToMentor && <span className="badge crimson">Open to mentoring</span>}
          {profile.hiring && <span className="badge green">Currently hiring</span>}
          <span className="badge">{profile.role}</span>
        </div>
        <p>{profile.bio}</p>
        <dl className="profile-facts">
          <div><dt>Email</dt><dd>{profile.email}</dd></div>
          <div><dt>Phone</dt><dd>{profile.phoneNumber}</dd></div>
          <div><dt>Location</dt><dd>{profile.city}, {profile.stateCountry}</dd></div>
          <div><dt>LinkedIn</dt><dd>{profile.linkedinUrl ? <a href={profile.linkedinUrl}>{profile.linkedinUrl}</a> : 'Not provided'}</dd></div>
        </dl>
      </article>
    </section>
  );
}
