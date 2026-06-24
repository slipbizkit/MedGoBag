import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import client from '../api/client';
import { Medicine } from '../types';
import MedicineForm from './MedicineForm';

export default function MedicineList() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await client.get<Medicine[]>('/medicines');
      setMedicines(data);
    } catch {
      setError('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(
    data: Omit<Medicine, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) {
    if (editing) {
      await client.put(`/medicines/${editing.id}`, data);
    } else {
      await client.post('/medicines', data);
    }
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(med: Medicine) {
    const result = await Swal.fire({
      title: 'Delete medicine?',
      text: `"${med.generic_name}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setDeleting(med.id);
    try {
      await client.delete(`/medicines/${med.id}`);
      setMedicines((prev) => prev.filter((m) => m.id !== med.id));
    } catch {
      setError('Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  function fmtDays(n: number): string {
    if (n <= 0) return '0d';
    const y = Math.floor(n / 365);
    const rem = n - y * 365;
    const mo = Math.floor(rem / 30);
    const d = rem - mo * 30;
    return [y > 0 && `${y}y`, mo > 0 && `${mo}m`, (d > 0 || (!y && !mo)) && `${d}d`]
      .filter(Boolean).join(' ');
  }

  function handleView(med: Medicine) {
    const exp = new Date(med.expiration_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const expired = days < 0;
    const expiryLabel = expired
      ? `<span style="color:#dc3545;font-weight:600;">Expired ${fmtDays(Math.abs(days))} ago (${exp.toLocaleDateString()})</span>`
      : days === 0
      ? `<span style="color:#dc3545;font-weight:600;">Expires today</span>`
      : days <= 30
      ? `<span style="color:#fd7e14;font-weight:600;">${exp.toLocaleDateString()} (${fmtDays(days)} left)</span>`
      : `<span style="color:#198754;font-weight:600;">${exp.toLocaleDateString()} (${fmtDays(days)} left)</span>`;

    Swal.fire({
      title: med.generic_name,
      html: `
        <table style="width:100%;text-align:left;border-collapse:collapse;font-size:0.95rem;">
          ${med.brand_name ? `
          <tr>
            <td style="padding:6px 0;color:#6c757d;white-space:nowrap;width:40%;">Brand Name</td>
            <td style="padding:6px 0;font-weight:500;">${med.brand_name}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:6px 0;color:#6c757d;white-space:nowrap;width:40%;">Dosage</td>
            <td style="padding:6px 0;font-weight:500;">${med.dosage}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6c757d;">Used For</td>
            <td style="padding:6px 0;font-weight:500;">${med.used_for}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6c757d;">Expiration</td>
            <td style="padding:6px 0;">${expiryLabel}</td>
          </tr>
          ${med.production_date ? `
          <tr>
            <td style="padding:6px 0;color:#6c757d;">Produced</td>
            <td style="padding:6px 0;font-weight:500;">${new Date(med.production_date).toLocaleDateString()}</td>
          </tr>` : ''}
          ${med.description ? `
          <tr>
            <td style="padding:6px 0;color:#6c757d;vertical-align:top;">Description</td>
            <td style="padding:6px 0;">${med.description}</td>
          </tr>` : ''}
        </table>
      `,
      icon: expired ? 'warning' : 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#0d6efd',
    });
  }

  function startEdit(med: Medicine) {
    setEditing(med);
    setShowForm(true);
  }

  function startAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
  }

  const filtered = medicines.filter(
    (m) =>
      m.generic_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.brand_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      m.used_for.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">My Medicines</h4>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={startAdd}>
            + Add Medicine
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <strong>{editing ? 'Edit Medicine' : 'New Medicine'}</strong>
          </div>
          <div className="card-body">
            <MedicineForm initial={editing} onSave={handleSave} onCancel={cancelForm} />
          </div>
        </div>
      )}

      {!showForm && (
        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Search by name or condition…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-center py-4">
          {search ? 'No medicines match your search.' : 'No medicines yet. Add one above.'}
        </p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Brand Name</th>
                <th>Generic Name</th>
                <th>Expires In</th>
                <th className="d-none d-md-table-cell">Used For</th>
                <th className="d-none d-md-table-cell">Dosage</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((med) => {
                const exp = new Date(med.expiration_date);
                const soon = exp <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                const expired = exp < new Date();
                return (
                  <tr key={med.id}>
                    <td className="fw-semibold">{med.brand_name ?? <span className="text-muted fst-italic small">—</span>}</td>
                    <td className="text-muted">{med.generic_name}</td>
                    <td>
                      <span className={`badge ${expired ? 'bg-danger' : soon ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {exp.toLocaleDateString()}
                      </span>
                    </td>
                    <td className="d-none d-md-table-cell text-truncate" style={{ maxWidth: 200 }}>
                      {med.used_for}
                    </td>
                    <td className="d-none d-md-table-cell">{med.dosage}</td>
                    <td className="text-end">
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          disabled={deleting === med.id}
                        >
                          {deleting === med.id ? '…' : 'Actions'}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button className="dropdown-item" onClick={() => handleView(med)}>
                              👁 View
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => startEdit(med)}>
                              ✏️ Edit
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDelete(med)}
                            >
                              🗑 Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
