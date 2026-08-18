import { useEffect, useState } from 'react';
import { Bell, BriefcaseBusiness, CalendarDays, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  }

  return (
    <div className={showSidebar ? `app-shell sidebar-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}` : 'app-shell'}>
      {showSidebar && profile && (
        <header className="mobile-app-header">
          <NavLink to="/dashboard" className="mobile-brand" onClick={() => setMobileMenuOpen(false)}>
            <img src={brandAssets.whartonLogo} alt="Wharton" />
            <span>Wharton 52</span>
          </NavLink>
          <div className="mobile-header-actions">
            <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.avatarUrl} />
            <button
              className="mobile-menu-button"
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <span className={mobileMenuOpen ? 'menu-icon open' : 'menu-icon'}>
                <Menu className="menu-open-icon" size={22} />
                <X className="menu-close-icon" size={22} />
              </span>
            </button>
          </div>
        </header>
      )}
      {showSidebar && profile && mobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div id="mobile-navigation-menu" className="mobile-nav-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-user-card">
              <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.avatarUrl} />
              <div>
                <strong>{profile.firstName} {profile.lastName}</strong>
                <span>WEMBA {profile.classYear}</span>
              </div>
              <button className="button ghost compact" type="button" onClick={handleLogout}>
                <LogOut size={16} /> Log Out
              </button>
            </div>
            <label className="mobile-menu-search">
              <Search size={17} />
              <input placeholder="Search Wharton..." />
            </label>
            <nav className="mobile-nav-links" aria-label="Mobile navigation">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileMenuOpen(false)}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
              {profile.role === 'ADMIN' && (
                <NavLink to="/admin/events" onClick={() => setMobileMenuOpen(false)}>
                  <ShieldCheck size={18} />
                  <span>Admin</span>
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
      {showSidebar && profile && <aside className="side-nav">
        <div className="side-brand-row">
          {sidebarCollapsed ? (
            <button
              className="side-brand side-brand-collapsed-trigger"
              type="button"
              aria-label="Expand navigation"
              title="Expand navigation"
              onClick={() => setSidebarCollapsed(false)}
            >
              <span className="side-brand-logo-swap">
                <img src={brandAssets.whartonLogo} alt="Wharton" />
                <PanelLeftOpen className="side-brand-expand-icon" size={22} />
              </span>
            </button>
          ) : (
            <>
              <NavLink to="/dashboard" className="side-brand">
                <img src={brandAssets.whartonLogo} alt="Wharton" />
                <span>{brandCopy.productName}</span>
              </NavLink>
              <button
                className="side-collapse-button"
                type="button"
                aria-label="Collapse navigation"
                onClick={() => setSidebarCollapsed(true)}
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          )}
        </div>
        <nav className="side-links">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} title={sidebarCollapsed ? label : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          {profile?.role === 'ADMIN' && (
            <NavLink to="/admin/events" title={sidebarCollapsed ? 'Admin' : undefined}>
              <ShieldCheck size={18} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
        <div className="side-profile">
          <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.avatarUrl} />
          <strong>{profile.firstName} {profile.lastName}</strong>
          <span>WEMBA {profile.classYear}</span>
          <button
            className="button ghost compact"
            title="Log out"
            onClick={handleLogout}
          >
            <LogOut size={16} /> <span className="logout-label">Log out</span>
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
