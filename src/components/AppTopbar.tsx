import { Search } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from './AuthContext';

export function AppTopbar({ value = '', onSearch }: { value?: string; onSearch?: (value: string) => void }) {
  const { profile } = useAuth();

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
            <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.avatarUrl} />
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
