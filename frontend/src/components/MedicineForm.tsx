import { useState, FormEvent, useEffect } from 'react';
import { Medicine } from '../types';

interface Props {
  initial?: Medicine | null;
  onSave: (data: Omit<Medicine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const empty = {
  generic_name: '',
  brand_name: '',
  expiration_date: '',
  production_date: '',
  used_for: '',
  dosage: '',
  description: '',
};

export default function MedicineForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        generic_name: initial.generic_name,
        brand_name: initial.brand_name ?? '',
        expiration_date: initial.expiration_date.slice(0, 10),
        production_date: initial.production_date?.slice(0, 10) ?? '',
        used_for: initial.used_for,
        dosage: initial.dosage,
        description: initial.description ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  function set(field: keyof typeof empty) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        generic_name: form.generic_name,
        brand_name: form.brand_name || null,
        expiration_date: form.expiration_date,
        production_date: form.production_date || null,
        used_for: form.used_for,
        dosage: form.dosage,
        description: form.description || null,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error;
      setError(msg || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-3">
        <div className="col-12 col-sm-6">
          <label className="form-label fw-semibold">Brand Name</label>
          <input
            className="form-control"
            value={form.brand_name}
            onChange={set('brand_name')}
            placeholder="e.g. Biogesic"
          />
        </div>

        <div className="col-12 col-sm-6">
          <label className="form-label fw-semibold">
            Generic Name <span className="text-danger">*</span>
          </label>
          <input
            className="form-control"
            value={form.generic_name}
            onChange={set('generic_name')}
            placeholder="e.g. Paracetamol"
            required
          />
        </div>

        <div className="col-12 col-sm-6">
          <label className="form-label fw-semibold">
            Dosage <span className="text-danger">*</span>
          </label>
          <input
            className="form-control"
            value={form.dosage}
            onChange={set('dosage')}
            placeholder="e.g. 500mg twice daily"
            required
          />
        </div>

        <div className="col-12 col-sm-6">
          <label className="form-label fw-semibold">
            Used For <span className="text-danger">*</span>
          </label>
          <input
            className="form-control"
            value={form.used_for}
            onChange={set('used_for')}
            placeholder="e.g. Pain relief, fever"
            required
          />
        </div>

        <div className="col-12 col-sm-6">
          <label className="form-label fw-semibold">
            Expiration Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control"
            value={form.expiration_date}
            onChange={set('expiration_date')}
            required
          />
        </div>

        <div className="col-12 col-sm-6">
          <label className="form-label fw-semibold">Production Date</label>
          <input
            type="date"
            className="form-control"
            value={form.production_date}
            onChange={set('production_date')}
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Description</label>
          <textarea
            className="form-control"
            rows={2}
            value={form.description}
            onChange={set('description')}
            placeholder="Optional notes"
          />
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {initial ? 'Save Changes' : 'Add Medicine'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
