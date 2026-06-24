import { useEffect, useState } from 'react';
import client from '../api/client';
import { UserRecord } from '../types';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpReset, setOtpReset] = useState<{ qrCode: string; secret: string } | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  async function load() {
    try {
      const { data } = await client.get<UserRecord[]>('/admin/users');
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleUser(id: number) {
    setActionId(id);
    try {
      const { data } = await client.put<UserRecord>(`/admin/users/${id}/toggle`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: data.is_active } : u)));
    } catch {
      setError('Action failed');
    } finally {
      setActionId(null);
    }
  }

  async function resetOtp(id: number) {
    if (!confirm('Reset this user\'s OTP? They will need to re-scan a new QR code.')) return;
    setActionId(id);
    try {
      const { data } = await client.post<{ qrCode: string; otpSecret: string }>(
        `/admin/users/${id}/reset-otp`
      );
      setOtpReset({ qrCode: data.qrCode, secret: data.otpSecret });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, otp_enabled: false } : u)));
    } catch {
      setError('OTP reset failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <h4 className="mb-3">Admin — User Management</h4>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {otpReset && (
        <div className="card mb-4 border-success">
          <div className="card-header bg-success bg-opacity-10">
            <strong>New OTP QR Code</strong> — share with the user to re-scan
          </div>
          <div className="card-body text-center">
            <img src={otpReset.qrCode} alt="New OTP QR" className="img-fluid mb-2" style={{ maxWidth: 180 }} />
            <p className="small text-muted mb-1">Manual secret:</p>
            <code className="d-block bg-light rounded p-2 small user-select-all">{otpReset.secret}</code>
            <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setOtpReset(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>OTP</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="text-break small">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.otp_enabled ? (
                      <span className="badge bg-success">Enabled</span>
                    ) : (
                      <span className="badge bg-warning text-dark">Pending</span>
                    )}
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-danger">Disabled</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => toggleUser(u.id)}
                        disabled={actionId === u.id}
                      >
                        {actionId === u.id ? '…' : u.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => resetOtp(u.id)}
                        disabled={actionId === u.id}
                      >
                        Reset OTP
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
