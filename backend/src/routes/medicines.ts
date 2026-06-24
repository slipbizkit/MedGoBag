import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { sql } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── List all medicines for the logged-in user ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const medicines = await sql`
      SELECT * FROM medicines
      WHERE user_id = ${req.user!.userId}
      ORDER BY expiration_date ASC
    `;
    return res.json(medicines);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Medicines expiring within the next 3 months (dashboard feed) ─────────────
router.get('/expiring', async (req, res) => {
  try {
    const medicines = await sql`
      SELECT * FROM medicines
      WHERE user_id = ${req.user!.userId}
        AND expiration_date <= CURRENT_DATE + INTERVAL '3 months'
      ORDER BY expiration_date ASC
    `;
    return res.json(medicines);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const medicineValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('expiration_date').isISO8601().withMessage('Valid expiration date is required'),
  body('used_for').trim().notEmpty().withMessage('Used For is required'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('production_date').optional({ nullable: true }).isISO8601(),
  body('description').optional({ nullable: true }).trim(),
];

// ─── Create medicine ──────────────────────────────────────────────────────────
router.post('/', medicineValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, expiration_date, production_date, used_for, dosage, description } = req.body;
  try {
    const [medicine] = await sql`
      INSERT INTO medicines (user_id, name, expiration_date, production_date, used_for, dosage, description)
      VALUES (
        ${req.user!.userId},
        ${name},
        ${expiration_date},
        ${production_date ?? null},
        ${used_for},
        ${dosage},
        ${description ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(medicine);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Update medicine ──────────────────────────────────────────────────────────
router.put('/:id', medicineValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, expiration_date, production_date, used_for, dosage, description } = req.body;
  try {
    const [medicine] = await sql`
      UPDATE medicines
      SET name            = ${name},
          expiration_date = ${expiration_date},
          production_date = ${production_date ?? null},
          used_for        = ${used_for},
          dosage          = ${dosage},
          description     = ${description ?? null},
          updated_at      = NOW()
      WHERE id = ${req.params.id} AND user_id = ${req.user!.userId}
      RETURNING *
    `;
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    return res.json(medicine);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Delete medicine ──────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await sql`
      DELETE FROM medicines
      WHERE id = ${req.params.id} AND user_id = ${req.user!.userId}
      RETURNING id
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Medicine not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
