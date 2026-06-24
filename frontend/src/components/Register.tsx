import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAvailability, AvailabilityStatus } from '../hooks/useAvailability';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_CHECKS = [
  { label: 'At least 10 characters',    test: (p: string) => p.length >= 10 },
  { label: 'One uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',           test: (p: string) => /[0-9]/.test(p) },
  { label: 'One symbol (!@#$%^&*…)',     test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function AvailabilityHint({ status, takenMsg }: { status: AvailabilityStatus; takenMsg: string }) {
  if (status === 'idle')      return null;
  if (status === 'checking')  return <div className="form-text"><span className="spinner-border spinner-border-sm me-1" style={{ width: '0.75rem', height: '0.75rem' }} />Checking…</div>;
  if (status === 'available') return <div className="form-text text-success">✓ Available</div>;
  if (status === 'taken')     return <div className="form-text text-danger">✗ {takenMsg}</div>;
  return <div className="form-text text-warning">Could not verify — will check on submit</div>;
}

function availabilityClass(status: AvailabilityStatus, value: string, minLen = 3): string {
  if (value.length < minLen) return '';
  if (status === 'available') return 'is-valid';
  if (status === 'taken')     return 'is-invalid';
  return '';
}

export default function Register({ theme, toggleTheme }: Props) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName]       = useState('');
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [touched, setTouched]         = useState(false);

  const emailValid     = EMAIL_RE.test(email);
  const usernameStatus = useAvailability(username,              '/auth/check-username', 'username', 3);
  const emailStatus    = useAvailability(emailValid ? email : '', '/auth/check-email',  'email',    6);

  const checks = PASSWORD_CHECKS.map((c) => ({ ...c, passed: c.test(password) }));
  const allChecksPassed = checks.every((c) => c.passed);
  const confirmMatch    = password === confirm && confirm.length > 0;

  const canSubmit =
    !loading &&
    allChecksPassed &&
    confirmMatch &&
    emailValid &&
    usernameStatus === 'available' &&
    emailStatus    === 'available';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (usernameStatus === 'taken') { setError('Username is already taken.'); return; }
    if (emailStatus    === 'taken') { setError('Email is already registered.'); return; }
    if (!allChecksPassed)           { setError('Password does not meet all requirements.'); return; }
    if (!confirmMatch)              { setError('Passwords do not match.'); return; }

    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register', {
        email,
        username,
        password,
        display_name: displayName,
        full_name:    fullName,
      });

      localStorage.setItem('token', data.setupToken);
      sessionStorage.setItem('otp_qr',     data.qrCode);
      sessionStorage.setItem('otp_secret', data.otpSecret);
      navigate('/otp-setup');
    } catch (err: unknown) {
      const msg =
        err instanceof Error &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center py-4" style={{ minHeight: '100vh' }}>
      <button
        className="btn btn-outline-secondary btn-sm position-fixed top-0 end-0 m-3"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="card shadow-sm w-100" style={{ maxWidth: 480 }}>
        <div className="card-body p-4">
          <h4 className="card-title text-center text-primary mb-1">💊 MedGoBag</h4>
          <p className="text-center text-muted small mb-4">Create an account</p>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── What do we call you? ── */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                What do we call you? <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Tom"
                required
              />
              <div className="form-text">This is how we'll greet you in the app.</div>
            </div>

            {/* ── Full name ── */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Thomas Pinalakas"
                required
              />
            </div>

            {/* ── Username ── */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Username <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${availabilityClass(usernameStatus, username)}`}
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="e.g. tom_123"
                autoComplete="username"
                required
              />
              {usernameStatus === 'taken'
                ? <div className="invalid-feedback d-block">Username is already taken.</div>
                : <AvailabilityHint status={usernameStatus} takenMsg="Username is already taken." />
              }
              {usernameStatus !== 'taken' && usernameStatus === 'idle' && (
                <div className="form-text">Letters, numbers, and underscores only. Used to log in.</div>
              )}
            </div>

            {/* ── Email ── */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={`form-control ${
                  email.length === 0      ? '' :
                  !emailValid             ? 'is-invalid' :
                  availabilityClass(emailStatus, email, 6)
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {email.length > 0 && !emailValid ? (
                <div className="invalid-feedback d-block">Please enter a valid email.</div>
              ) : emailStatus === 'taken' ? (
                <div className="invalid-feedback d-block">Email is already registered.</div>
              ) : (
                <AvailabilityHint status={emailStatus} takenMsg="Email is already registered." />
              )}
            </div>

            {/* ── Password ── */}
            <div className="mb-2">
              <label className="form-label fw-semibold">
                Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                autoComplete="new-password"
                required
              />
            </div>

            {/* ── Live password checklist ── */}
            {(touched || password.length > 0) && (
              <ul className="list-unstyled small mb-3 ps-1">
                {checks.map((c) => (
                  <li key={c.label} className={c.passed ? 'text-success' : 'text-danger'}>
                    {c.passed ? '✓' : '✗'} {c.label}
                  </li>
                ))}
              </ul>
            )}

            {/* ── Confirm password ── */}
            <div className="mb-4">
              <label className="form-label fw-semibold">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className={`form-control ${confirm.length > 0 ? (confirmMatch ? 'is-valid' : 'is-invalid') : ''}`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              {confirm.length > 0 && !confirmMatch && (
                <div className="invalid-feedback">Passwords do not match.</div>
              )}
              {confirmMatch && (
                <div className="valid-feedback">Passwords match.</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!canSubmit}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>

          <hr className="my-3" />
          <p className="text-center small mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-decoration-none">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
