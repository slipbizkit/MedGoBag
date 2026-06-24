import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register', { email, password });

      // Store the setup token temporarily so OTPSetup can call verify-otp-setup
      localStorage.setItem('token', data.setupToken);
      sessionStorage.setItem('otp_qr', data.qrCode);
      sessionStorage.setItem('otp_secret', data.otpSecret);

      navigate('/otp-setup');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-sm w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-4">
          <h4 className="card-title text-center text-primary mb-1">💊 MedGoBag</h4>
          <p className="text-center text-muted small mb-4">Create an account</p>

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
                autoComplete="new-password"
                required
              />
              <div className="form-text">Minimum 8 characters.</div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              )}
              Create Account
            </button>
          </form>

          <hr className="my-3" />
          <p className="text-center small mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-decoration-none">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
