import { useLocation } from 'react-router-dom';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onToggleSidebar: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/':          'Overview',
  '/medicines': 'Medicines',
  '/admin':     'Admin Panel',
};

export default function PageHeader({ theme, toggleTheme, onToggleSidebar }: Props) {
  const { pathname } = useLocation();
  const title       = PAGE_TITLES[pathname] ?? 'MedGoBag';
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username') || '';

  return (
    <header className="page-header d-flex align-items-center">
      {/* Left */}
      <div className="d-flex align-items-center gap-3">
        <button className="page-header-toggle" onClick={onToggleSidebar} title="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h5 className="page-header-title mb-0">{title}</h5>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><span>MedGoBag</span></li>
              <li className="breadcrumb-item active" aria-current="page">{title}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Right */}
      <div className="ms-auto d-flex align-items-center gap-2">
        <button
          className="page-header-icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1"  x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <div className="page-header-user">
          <div className="page-header-avatar">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <span className="page-header-name d-none d-sm-inline">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
