import { useState, useRef, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogin: () => void;
}

type Step = 'credentials' | 'otp';
type Anim = 'idle' | 'exiting' | 'entering';

const OTP_LEN = 6;

export default function Login({ theme, toggleTheme, onLogin }: Props) {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep]         = useState<Step>('credentials');
  const [anim, setAnim]         = useState<Anim>('idle');
  const [digits, setDigits]     = useState<string[]>(Array(OTP_LEN).fill(''));
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function transitionTo(next: Step) {
    setAnim('exiting');
    setTimeout(() => {
      setStep(next);
      setAnim('entering');
      if (next === 'otp') setTimeout(() => otpRefs.current[0]?.focus(), 30);
      setTimeout(() => setAnim('idle'), 280);
    }, 220);
  }

  // ── Step 1: verify credentials ───────────────────────────────────────────
  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/pre-login', { username, password });
      transitionTo('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: OTP box handlers ──────────────────────────────────────────────
  function handleOtpChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LEN - 1) submitOtp(next.join(''));
  }

  function handleOtpKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setDigits(next);
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LEN - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LEN - 1);
    otpRefs.current[focusIdx]?.focus();
    if (pasted.length === OTP_LEN) submitOtp(pasted);
  }

  async function submitOtp(code: string) {
    if (code.length < OTP_LEN) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', {
        username,
        password,
        token: code,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
      localStorage.setItem('username', data.username);
      if (data.displayName) localStorage.setItem('displayName', data.displayName);
      onLogin();
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Invalid authenticator code');
      setDigits(Array(OTP_LEN).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 30);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    submitOtp(digits.join(''));
  }

  // ── Animation class ───────────────────────────────────────────────────────
  const animClass = anim === 'exiting' ? 'step-exit' : anim === 'entering' ? 'step-enter' : '';

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <button
        className="btn btn-outline-secondary btn-sm position-fixed top-0 end-0 m-3"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="card shadow-sm w-100" style={{ maxWidth: 420, overflow: 'hidden' }}>
        <div className="card-body p-4">
          <h4 className="card-title text-center text-primary mb-1">💊 MedGoBag</h4>

          {error && (
            <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>
          )}

          {/* ── Step 1: username + password ── */}
          {step === 'credentials' && (
            <div className={animClass}>
              <p className="text-center text-muted small mb-4 mt-1">Sign in to your account</p>
              <form onSubmit={handleCredentials} noValidate>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
                <div className="mb-4">
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
                <button type="submit" className="btn btn-primary w-100" disabled={loading || !username || !password}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Verifying…</>
                    : 'Continue'}
                </button>
              </form>
              <hr className="my-3" />
              <p className="text-center small mb-0">
                No account?{' '}
                <Link to="/register" className="text-decoration-none">Register</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: 6-box OTP ── */}
          {step === 'otp' && (
            <div className={animClass}>
              <p className="text-center text-muted small mb-1 mt-1">
                Open your authenticator app
              </p>
              <p className="text-center fw-semibold mb-4" style={{ fontSize: '0.95rem' }}>
                Enter the 6-digit code
              </p>

              <form onSubmit={handleOtpSubmit} noValidate>
                <div className="d-flex justify-content-center gap-2 mb-4">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`otp-box${d ? ' filled' : ''}`}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      onPaste={handleOtpPaste}
                      autoComplete="one-time-code"
                      disabled={loading}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading || digits.join('').length < OTP_LEN}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Signing in…</>
                    : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-3">
                <button
                  className="btn btn-link btn-sm text-muted p-0"
                  onClick={() => {
                    setError('');
                    setDigits(Array(OTP_LEN).fill(''));
                    setAnim('entering');
                    setStep('credentials');
                    setTimeout(() => setAnim('idle'), 280);
                  }}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
