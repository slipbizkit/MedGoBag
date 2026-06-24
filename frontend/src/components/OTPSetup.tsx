import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function OTPSetup() {
  const navigate = useNavigate();
  const qrCode = sessionStorage.getItem('otp_qr') ?? '';
  const secret = sessionStorage.getItem('otp_secret') ?? '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/verify-otp-setup', { token: otp });
      // Setup complete — clear temp token, redirect to login for proper auth
      sessionStorage.removeItem('otp_qr');
      sessionStorage.removeItem('otp_secret');
      localStorage.removeItem('token');
      navigate('/login', { state: { message: 'Setup complete! Sign in with your OTP.' } });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error;
      setError(msg || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (!qrCode) {
    return (
      <div className="alert alert-warning">
        No setup in progress. <a href="/register">Register</a> first.
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-sm w-100" style={{ maxWidth: 480 }}>
        <div className="card-body p-4">
          <h5 className="card-title text-primary mb-1">Set Up Authenticator</h5>
          <p className="text-muted small mb-3">
            Scan the QR code below with <strong>Google Authenticator</strong> (or any TOTP app),
            then enter the 6-digit code to confirm.
          </p>

          <div className="text-center mb-3">
            <img src={qrCode} alt="OTP QR Code" className="img-fluid rounded border" style={{ maxWidth: 200 }} />
          </div>

          <div className="mb-3">
            <p className="small text-muted mb-1">Or enter this secret manually:</p>
            <code className="d-block bg-light rounded p-2 small user-select-all text-break">
              {secret}
            </code>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Enter Code to Confirm</label>
              <input
                type="text"
                className="form-control form-control-lg text-center"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </div>
            <button type="submit" className="btn btn-success w-100" disabled={loading || otp.length !== 6}>
              {loading && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              )}
              Confirm &amp; Finish Setup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
