import { Search } from 'lucide-react';
import { useAuth } from './AuthContext';

export function AppTopbar({ value = '', onSearch }: { value?: string; onSearch?: (value: string) => void }) {
  const { profile } = useAuth();
  const initials = profile ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}` : 'W';

  return (
    <header className="app-topbar">
      <label className="directory-global-search">
        <Search size={18} />
        <input
          value={value}
          onChange={(event) => onSearch?.(event.target.value)}
          placeholder="Search Wharton..."
        />
      </label>
      <div className="app-topbar-actions">
        {profile && (
          <div className="topbar-profile-pill">
            {profile.avatarUrl ? (
              <img className="avatar avatar-image" src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
            ) : (
              <div className="avatar">{initials}</div>
            )}
            <span>
              <strong>{profile.firstName}</strong>
              <small>Wharton 52</small>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
