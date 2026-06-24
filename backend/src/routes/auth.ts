import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { body, validationResult } from 'express-validator';
import { sql } from '../db';
import { requireAuth } from '../middleware/auth';
import { DbUser } from '../types';

const router = Router();

// ─── Register ────────────────────────────────────────────────────────────────
// Creates user + generates TOTP secret + returns QR code for authenticator app.
// Returns a short-lived setupToken so the client can call /verify-otp-setup.
router.post(
  '/register',
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body as { email: string; password: string };
    try {
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);
      const secret = speakeasy.generateSecret({ name: `MedGoBag (${email})`, length: 20 });

      const [user] = (await sql`
        INSERT INTO users (email, password_hash, otp_secret)
        VALUES (${email}, ${passwordHash}, ${secret.base32})
        RETURNING id, email, role
      `) as { id: number; email: string; role: string }[];

      // Short-lived token only valid for OTP setup (not full app access)
      const setupToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '10m' }
      );

      const qrCode = await QRCode.toDataURL(secret.otpauth_url ?? '');
      return res.status(201).json({ setupToken, otpSecret: secret.base32, qrCode });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── Verify OTP setup ─────────────────────────────────────────────────────────
// Called after scanning QR code. Requires the setupToken from /register.
router.post('/verify-otp-setup', requireAuth, async (req, res) => {
  const { token } = req.body as { token: string };
  try {
    const [user] = (await sql`
      SELECT otp_secret FROM users WHERE id = ${req.user!.userId}
    `) as { otp_secret: string }[];

    if (!user) return res.status(404).json({ error: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.otp_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) return res.status(400).json({ error: 'Invalid OTP — try again' });

    await sql`UPDATE users SET otp_enabled = true WHERE id = ${req.user!.userId}`;
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('token').notEmpty().withMessage('OTP token is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, token } = req.body as {
      email: string;
      password: string;
      token: string;
    };

    try {
      const [user] = (await sql`
        SELECT id, email, password_hash, role, otp_secret, otp_enabled, is_active
        FROM users WHERE email = ${email}
      `) as DbUser[];

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (!user.is_active) return res.status(403).json({ error: 'Account is disabled' });

      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) return res.status(401).json({ error: 'Invalid credentials' });

      if (user.otp_enabled) {
        const otpOk = speakeasy.totp.verify({
          secret: user.otp_secret,
          encoding: 'base32',
          token,
          window: 1,
        });
        if (!otpOk) return res.status(401).json({ error: 'Invalid OTP' });
      }

      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return res.json({ token: jwtToken, role: user.role, email: user.email });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── Current user profile ────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [user] = await sql`
      SELECT id, email, role, is_active, otp_enabled, created_at
      FROM users WHERE id = ${req.user!.userId}
    `;
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
