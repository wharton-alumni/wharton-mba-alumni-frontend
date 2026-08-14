import { Bell, Newspaper, Sparkles } from 'lucide-react';
import { AppTopbar } from '../components/AppTopbar';

export function AnnouncementPage() {
  return (
    <section className="directory-page announcement-page">
      <AppTopbar readOnly />

      <div className="directory-header">
        <div>
          <h1>Announcements</h1>
          <p>Official updates and news from the Wharton Executive MBA network.</p>
        </div>
      </div>

      <div className="announcement-workspace">
        <article className="featured-announcement-card">
          <div className="announcement-badge-row">
            <span className="announcement-badge">Network Update</span>
            <time>Latest</time>
          </div>
          <div>
            <h2>Wharton Executive MBA network announcements are coming soon</h2>
            <p>Updates for the alumni portal will appear here once they are available to the class network.</p>
          </div>
        </article>

        <section className="announcement-grid" aria-label="Upcoming announcement sections">
          <AnnouncementPlaceholder icon={Newspaper} title="Program News" />
          <AnnouncementPlaceholder icon={Bell} title="Community Notices" />
          <AnnouncementPlaceholder icon={Sparkles} title="Network Highlights" />
        </section>
      </div>
    </section>
  );
}

function AnnouncementPlaceholder({ icon: Icon, title }: { icon: typeof Newspaper; title: string }) {
  return (
    <article className="announcement-placeholder-card">
      <span><Icon size={24} /></span>
      <h2>{title}</h2>
      <p>New updates will appear here when published.</p>
    </article>
  );
}
