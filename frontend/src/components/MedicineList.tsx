import { useEffect, useState } from 'react';
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

  async function handleDelete(id: number) {
    if (!confirm('Delete this medicine?')) return;
    setDeleting(id);
    try {
      await client.delete(`/medicines/${id}`);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError('Delete failed');
    } finally {
      setDeleting(null);
    }
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
      m.name.toLowerCase().includes(search.toLowerCase()) ||
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
                <th>Name</th>
                <th>Expires</th>
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
                    <td className="fw-semibold">{med.name}</td>
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
                      <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => startEdit(med)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(med.id)}
                        disabled={deleting === med.id}
                      >
                        {deleting === med.id ? '…' : 'Delete'}
                      </button>
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
