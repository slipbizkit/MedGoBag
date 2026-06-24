# MedGoBag — CLAUDE.md

## Project overview

MedGoBag is a medicine management web app. Users track medicines and get warned when items expire within 3 months. Admins manage user accounts and OTP secrets.

**Stack:** React + TypeScript (Vite) · Express + TypeScript · Neon (Postgres) · Bootstrap 5 · Vercel

---

## Repo structure

```
MedGoBag/
├── backend/          Express API — runs locally and as Vercel serverless
│   ├── api/          Vercel entry point (exports Express app)
│   └── src/
│       ├── app.ts        Express app factory (shared by local + Vercel)
│       ├── index.ts      Local dev: calls app.listen()
│       ├── db/
│       │   ├── index.ts      Neon sql tagged-template client
│       │   └── migrate.ts    Run once: npm run migrate
│       ├── middleware/
│       │   ├── auth.ts       JWT verification → req.user
│       │   └── requireAdmin.ts
│       ├── routes/
│       │   ├── auth.ts       register / verify-otp-setup / login / me
│       │   ├── medicines.ts  CRUD + GET /expiring (3-month window)
│       │   └── admin.ts      list users / toggle active / reset OTP / change role
│       └── types/
│           ├── index.ts      Shared TS interfaces (JwtPayload, DbUser, DbMedicine)
│           └── express.d.ts  Augments Express Request with req.user
└── frontend/         Vite + React SPA
    └── src/
        ├── api/client.ts     Axios instance — auto-attaches Bearer token; 401 → /login
        ├── App.tsx           Routes + RequireAuth / RequireAdmin guards
        ├── types/index.ts    Shared TS interfaces (Medicine, UserRecord)
        └── components/
            ├── Navbar.tsx        Bootstrap responsive nav
            ├── Login.tsx         Email + password + 6-digit TOTP
            ├── Register.tsx      Creates account, redirects to OTP setup
            ├── OTPSetup.tsx      QR code display + TOTP confirmation
            ├── Dashboard.tsx     Cards for medicines expiring ≤ 3 months
            ├── MedicineList.tsx  Full table with search, edit, delete
            ├── MedicineForm.tsx  Add/edit form (shared)
            └── AdminPanel.tsx    User table with enable/disable + OTP reset
```

---

## Local development

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) project (free tier is fine)

### First-time setup

```powershell
# 1. Backend env
cd backend
copy .env.example .env
# Edit .env: paste DATABASE_URL from Neon dashboard, generate JWT_SECRET

# 2. Install deps and create DB tables
npm install
npm run migrate

# 3. Frontend
cd ../frontend
npm install
```

### Running

```powershell
# Terminal 1 — backend on :3001
cd backend && npm run dev

# Terminal 2 — frontend on :5173 (proxies /api → :3001)
cd frontend && npm run dev
```

Open `http://localhost:5173`.

---

## Authentication flow

| Step | Endpoint / Page | Notes |
|------|----------------|-------|
| Register | `POST /api/auth/register` → `/otp-setup` | Returns `setupToken` (10-min JWT) + QR code |
| OTP setup | `POST /api/auth/verify-otp-setup` | Uses setupToken; sets `otp_enabled = true` |
| Login | `POST /api/auth/login` | Email + password + 6-digit TOTP → 24h JWT |
| Auth guard | `requireAuth` middleware | Reads `Authorization: Bearer <token>` |
| Admin guard | `requireAdmin` middleware | Checks `req.user.role === 'admin'` |

---

## Database schema (Neon / Postgres)

```sql
-- users
id, email (unique), password_hash, role ('user'|'admin'),
otp_secret, otp_enabled, is_active, created_at, updated_at

-- medicines
id, user_id (FK → users.id CASCADE), name, expiration_date (DATE),
production_date (DATE nullable), used_for, dosage,
description (nullable), created_at, updated_at
```

Indices on `medicines.user_id` and `medicines.expiration_date`.

---

## API routes summary

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account, returns QR + setupToken |
| POST | `/verify-otp-setup` | setupToken | Confirms authenticator configured |
| POST | `/login` | — | Returns 24h JWT |
| GET | `/me` | JWT | Current user profile |

### Medicines — `/api/medicines`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All medicines for current user |
| GET | `/expiring` | Expiring within 3 months |
| POST | `/` | Create medicine |
| PUT | `/:id` | Update medicine (must own it) |
| DELETE | `/:id` | Delete medicine (must own it) |

### Admin — `/api/admin` (admin role required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| PUT | `/users/:id/toggle` | Enable / disable account |
| POST | `/users/:id/reset-otp` | Reset OTP secret, returns new QR |
| PUT | `/users/:id/role` | Change role (`admin` \| `user`) |

---

## Environment variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon connection string (`?sslmode=require`) |
| `JWT_SECRET` | Yes | Long random string — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT` | No | Default `3001` |
| `FRONTEND_URL` | Yes | CORS origin — `http://localhost:5173` locally |

### Frontend (`.env` / Vercel env var)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production only | Backend Vercel URL, e.g. `https://medgobag-api.vercel.app/api` |

In development, Vite proxies `/api` → `localhost:3001` so no env var is needed.

---

## Vercel deployment

### Backend

1. Import `backend/` as a Vercel project.
2. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (your frontend Vercel URL), `NODE_ENV=production`.
3. `backend/vercel.json` routes all requests to `api/index.ts` (the Express serverless handler).

### Frontend

1. Import `frontend/` as a separate Vercel project.
2. Set env var: `VITE_API_URL=https://<your-backend>.vercel.app/api`.
3. Vercel auto-detects Vite — no extra config needed.

---

## Key conventions

- All DB queries use the Neon tagged-template `sql\`...\`` — never string-concatenate SQL.
- Medicines are always scoped to `user_id = req.user.userId` — users cannot see each other's data.
- The axios client in `frontend/src/api/client.ts` auto-attaches the JWT and redirects to `/login` on 401.
- Bootstrap 5 bundle (JS + CSS) is imported in `main.tsx` — no CDN needed.
- `backend/src/app.ts` is the shared Express factory; `src/index.ts` adds `app.listen()` for local dev and `api/index.ts` exports it for Vercel.
