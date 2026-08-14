import { Bell, BriefcaseBusiness, CalendarDays, LayoutDashboard, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { brandAssets, brandCopy } from '../data/brand';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/directory', label: 'Directory', icon: Search },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/jobs', label: 'Job Listing', icon: BriefcaseBusiness },
  { to: '/announcement', label: 'Announcement', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const showSidebar = Boolean(profile);

  return (
    <div className={showSidebar ? 'app-shell sidebar-shell' : 'app-shell'}>
      {showSidebar && profile && <aside className="side-nav">
        <NavLink to="/dashboard" className="side-brand">
          <img src={brandAssets.whartonLogo} alt="Wharton" />
          <span>{brandCopy.productName}</span>
        </NavLink>
        <nav className="side-links">
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
        <div className="side-profile">
          {profile.avatarUrl ? (
            <img className="avatar avatar-image" src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
          ) : (
            <div className="avatar">{profile.firstName[0]}{profile.lastName[0]}</div>
          )}
          <strong>{profile.firstName} {profile.lastName}</strong>
          <span>WEMBA {profile.classYear}</span>
          <button
            className="button ghost compact"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>}
      <main className={showSidebar ? 'sidebar-main' : undefined}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <img src={brandAssets.pennLogoWhite} alt="University of Pennsylvania" />
        <span>This student and alumni-created website is not an official Wharton or University of Pennsylvania property. It is maintained by students and past alumni to help manage the WEMBA network.</span>
      </footer>
    </div>
  );
}
