import { Router } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { sql } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── List all users ───────────────────────────────────────────────────────────
router.get('/users', async (_req, res) => {
  try {
    const users = await sql`
      SELECT id, email, role, is_active, otp_enabled, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Toggle user active/disabled ──────────────────────────────────────────────
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const [user] = await sql`
      UPDATE users
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING id, email, is_active
    `;
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Reset user OTP secret ─────────────────────────────────────────────────────
// Generates a new secret and returns a fresh QR code for the user to re-scan.
router.post('/users/:id/reset-otp', async (req, res) => {
  try {
    const [existing] = await sql`SELECT email FROM users WHERE id = ${req.params.id}`;
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const secret = speakeasy.generateSecret({
      name: `MedGoBag (${existing.email})`,
      length: 20,
    });

    await sql`
      UPDATE users
      SET otp_secret  = ${secret.base32},
          otp_enabled = false,
          updated_at  = NOW()
      WHERE id = ${req.params.id}
    `;

    const qrCode = await QRCode.toDataURL(secret.otpauth_url ?? '');
    return res.json({ otpSecret: secret.base32, qrCode });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Change user role ─────────────────────────────────────────────────────────
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body as { role: string };
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role must be "admin" or "user"' });
  }
  try {
    const [user] = await sql`
      UPDATE users SET role = ${role}, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING id, email, role
    `;
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
