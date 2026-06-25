import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV = [
  {
    to: '/',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/medicines',
    exact: false,
    label: 'Medicines',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M18 15v6M15 18h6" />
      </svg>
    ),
  },
];

const ADMIN_NAV = {
  to: '/admin',
  label: 'Admin',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

export default function Sidebar({ theme, toggleTheme, onLogout, collapsed, onToggleCollapse }: Props) {
  const navigate = useNavigate();
  const role        = localStorage.getItem('role');
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username') || '?';
  const initials    = displayName.slice(0, 2).toUpperCase();

  async function handleLogout() {
    const result = await Swal.fire({
      title: 'Log out?',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, log out',
    });
    if (!result.isConfirmed) return;
    onLogout();
    navigate('/login');
  }

  const cls = `app-sidebar${collapsed ? ' collapsed' : ''}`;

  return (
    <aside className={cls}>
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">💊</span>
        {!collapsed && <span className="sidebar-logo-text">MedGoBag</span>}
        <button
          className="sidebar-collapse-btn ms-auto"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          }
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, exact, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-item-icon">{icon}</span>
            {!collapsed && <span className="sidebar-item-label">{label}</span>}
          </NavLink>
        ))}
        {role === 'admin' && (
          <NavLink
            to={ADMIN_NAV.to}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            title={collapsed ? ADMIN_NAV.label : undefined}
          >
            <span className="sidebar-item-icon">{ADMIN_NAV.icon}</span>
            {!collapsed && <span className="sidebar-item-label">{ADMIN_NAV.label}</span>}
          </NavLink>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button
          className="sidebar-item sidebar-footer-theme"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="sidebar-item-icon" style={{ fontSize: '1rem' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          {!collapsed && <span className="sidebar-item-label">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>}
        </button>

        <div className="sidebar-user" title={collapsed ? displayName : undefined}>
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed && <span className="sidebar-username">{displayName}</span>}
          {!collapsed && (
            <button className="sidebar-logout-btn ms-auto" onClick={handleLogout} title="Log out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button className="sidebar-item sidebar-footer-theme" onClick={handleLogout} title="Log out">
            <span className="sidebar-item-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
