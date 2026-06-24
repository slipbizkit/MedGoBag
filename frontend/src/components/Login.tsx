import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email, password, token: otp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error;
      setError(msg || 'Login failed. Check your credentials and OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-sm w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-4">
          <h4 className="card-title text-center text-primary mb-1">💊 MedGoBag</h4>
          <p className="text-center text-muted small mb-4">Sign in to your account</p>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Authenticator Code</label>
              <input
                type="text"
                className="form-control form-control-lg text-center letter-spacing-wide"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              <div className="form-text">6-digit code from Google Authenticator (or similar).</div>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              )}
              Sign In
            </button>
          </form>

          <hr className="my-3" />
          <p className="text-center small mb-0">
            No account?{' '}
            <Link to="/register" className="text-decoration-none">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
