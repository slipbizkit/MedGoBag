import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface Props {
  onLogout: () => void;
  collapsed: boolean;
}

const NAV = [
  {
    to: '/', exact: true, label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/medicines', exact: false, label: 'Medicines',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
        <path d="m8.5 8.5 7 7"/>
      </svg>
    ),
  },
];

const ADMIN = {
  to: '/admin', label: 'Admin',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

export default function Sidebar({ onLogout, collapsed }: Props) {
  const navigate    = useNavigate();
  const role        = localStorage.getItem('role');
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username') || '?';
  const initials    = displayName.slice(0, 2).toUpperCase();

  async function handleLogout() {
    const result = await Swal.fire({
      title: 'Log out?',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#B3472B',
      cancelButtonColor: '#5C6B60',
      confirmButtonText: 'Yes, log out',
    });
    if (!result.isConfirmed) return;
    onLogout();
    navigate('/login');
  }

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>

      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
            <path d="m8.5 8.5 7 7"/>
          </svg>
        </div>
        {!collapsed && <span className="sidebar-logo-text">MedGoBag</span>}
      </div>

      {/* ── Nav ── */}
      <div className="sidebar-body">
        {!collapsed && <span className="sidebar-section-label">MAIN MENU</span>}
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
            <>
              {!collapsed && <span className="sidebar-section-label mt-3">MANAGEMENT</span>}
              <NavLink
                to={ADMIN.to}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                title={collapsed ? ADMIN.label : undefined}
              >
                <span className="sidebar-item-icon">{ADMIN.icon}</span>
                {!collapsed && <span className="sidebar-item-label">{ADMIN.label}</span>}
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" title={collapsed ? displayName : undefined}>{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{displayName}</span>
              <span className="sidebar-user-role">{localStorage.getItem('role') ?? 'user'}</span>
            </div>
          )}
        </div>
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Log out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
