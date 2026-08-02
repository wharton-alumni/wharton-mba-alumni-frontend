import { BriefcaseBusiness, CalendarDays, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { brandAssets, brandCopy } from '../data/brand';

const links = [
  { to: '/directory', label: 'Directory', icon: Search },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/jobs', label: 'Job Listing', icon: BriefcaseBusiness },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/directory" className="brand">
          <img src={brandAssets.whartonLogo} alt="Wharton" className="wharton-logo" />
          <span>{brandCopy.productName}</span>
        </NavLink>
        <nav className="nav-links">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          {profile?.role === 'ADMIN' && (
            <NavLink to="/admin/events">
              <ShieldCheck size={18} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
        <div className="session-actions">
          {profile ? (
            <>
              <span className="welcome">{profile.firstName} {profile.lastName}</span>
              <button
                className="icon-button"
                aria-label="Log out"
                title="Log out"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <NavLink className="button ghost" to="/login">Log in</NavLink>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <img src={brandAssets.pennLogoWhite} alt="University of Pennsylvania" />
        <span>The Wharton School · The University of Pennsylvania · Wharton Executive MBA</span>
      </footer>
    </div>
  );
}
