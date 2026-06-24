import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { body, validationResult } from 'express-validator';
import { sql } from '../db';
import { requireAuth } from '../middleware/auth';
import { DbUser } from '../types';

const router = Router();

// ─── Availability checks (debounced from the frontend) ───────────────────────
router.get('/check-username', async (req: Request, res: Response) => {
  const username = String(req.query.username ?? '').trim();
  if (username.length < 3) return res.json({ available: false });
  const rows = await sql`SELECT id FROM users WHERE username = ${username}`;
  return res.json({ available: rows.length === 0 });
});

router.get('/check-email', async (req: Request, res: Response) => {
  const email = String(req.query.email ?? '').trim().toLowerCase();
  if (!email.includes('@')) return res.json({ available: false });
  const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
  return res.json({ available: rows.length === 0 });
});

// ─── Pre-login: verify username + password only (step 1 of 2-step login) ────
router.post(
  '/pre-login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { username, password } = req.body as { username: string; password: string };

    try {
      const [user] = (await sql`
        SELECT id, password_hash, is_active FROM users WHERE username = ${username}
      `) as { id: number; password_hash: string; is_active: boolean }[];

      if (!user) return res.status(401).json({ error: 'Invalid username or password' });
      if (!user.is_active) return res.status(403).json({ error: 'Account is disabled' });

      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) return res.status(401).json({ error: 'Invalid username or password' });

      return res.json({ valid: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── Register ────────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may only contain letters, numbers, and underscores'),
    body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters'),
    body('display_name').trim().notEmpty().withMessage('Display name is required'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, username, password, display_name, full_name } = req.body as {
      email: string;
      username: string;
      password: string;
      display_name: string;
      full_name: string;
    };

    try {
      const existingEmail = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingEmail.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const existingUsername = await sql`SELECT id FROM users WHERE username = ${username}`;
      if (existingUsername.length > 0) return res.status(409).json({ error: 'Username already taken' });

      const passwordHash = await bcrypt.hash(password, 12);
      const secret = speakeasy.generateSecret({ name: `MedGoBag (${username})`, length: 20 });

      const [user] = (await sql`
        INSERT INTO users (email, username, display_name, full_name, password_hash, otp_secret)
        VALUES (${email}, ${username}, ${display_name}, ${full_name}, ${passwordHash}, ${secret.base32})
        RETURNING id, email, username, role
      `) as { id: number; email: string; username: string; role: string }[];

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

// ─── Login (by username) ──────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty(),
    body('token').notEmpty().withMessage('OTP token is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, token } = req.body as {
      username: string;
      password: string;
      token: string;
    };

    try {
      const [user] = (await sql`
        SELECT id, email, username, display_name, password_hash, role, otp_secret, otp_enabled, is_active
        FROM users WHERE username = ${username}
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

      return res.json({
        token: jwtToken,
        role: user.role,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
      });
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
      SELECT id, email, username, display_name, full_name, role, is_active, otp_enabled, created_at
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
