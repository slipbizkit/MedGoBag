import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Medicine } from '../types';

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number): 'clay' | 'amber' | 'sage' {
  if (days <= 14) return 'clay';
  if (days <= 30) return 'amber';
  return 'sage';
}

export default function Dashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username') || localStorage.getItem('email');

  useEffect(() => {
    client
      .get<Medicine[]>('/medicines/expiring')
      .then((res) => setMedicines(res.data))
      .catch(() => setError('Failed to load medicines'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="font-display mb-0">Dashboard</h4>
          <p className="text-muted small mb-0">Welcome back, {displayName}!</p>
        </div>
        <Link to="/medicines" className="btn btn-primary btn-sm">
          + Add Medicine
        </Link>
      </div>

      <div className="alert alert-warning d-flex align-items-center gap-2 py-2" role="alert">
        <span>⚠️</span>
        <span className="small">
          Showing medicines <strong>already expired</strong> or expiring within the next <strong>3 months</strong>.
        </span>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && medicines.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-5">✅ No medicines expiring in the next 3 months.</p>
          <Link to="/medicines" className="btn btn-outline-primary">
            View all medicines
          </Link>
        </div>
      )}

      <div className="row g-3">
        {medicines.map((med) => {
          const days = daysUntil(med.expiration_date);
          const tone = urgencyClass(days);
          return (
            <div key={med.id} className="col-12 col-md-6 col-xl-4">
              <div className={`card label-stripe-${tone} h-100`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="text-truncate font-display" style={{ fontSize: '1.05rem' }}>
                    {med.generic_name}
                    {med.brand_name && (
                      <span className="text-muted small ms-1" style={{ fontFamily: 'Inter' }}>({med.brand_name})</span>
                    )}
                  </div>
                  <span className={`label-pill label-pill-${tone} ms-2 flex-shrink-0`}>
                    {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? 'Expires today' : `${days}d left`}
                  </span>
                </div>
                <div className="card-body small">
                  <p className="mb-1">
                    <span className="text-muted">Expires:</span>{' '}
                    <strong className="font-mono">{new Date(med.expiration_date).toLocaleDateString()}</strong>
                  </p>
                  <p className="mb-1">
                    <span className="text-muted">Used for:</span> {med.used_for}
                  </p>
                  <p className="mb-0">
                    <span className="text-muted">Dosage:</span> <span className="font-mono">{med.dosage}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
