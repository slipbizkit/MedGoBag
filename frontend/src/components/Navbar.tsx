import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function Navbar({ theme, toggleTheme, onLogout }: Props) {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username');

  async function handleLogout() {
    const result = await Swal.fire({
      title: 'Log out?',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;
    onLogout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-3">
      <div className="container-lg">
        <Link className="navbar-brand fw-bold" to="/">
          💊 MedGoBag
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/medicines">Medicines</Link>
            </li>
            {role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">Admin</Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <span className="navbar-text text-white-50 small d-none d-lg-inline">{displayName}</span>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
