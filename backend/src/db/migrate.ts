import { sql } from './index';

async function migrate() {
  console.log('Running migrations...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role        VARCHAR(20) NOT NULL DEFAULT 'user',
      otp_secret  VARCHAR(255),
      otp_enabled BOOLEAN NOT NULL DEFAULT false,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS medicines (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name            VARCHAR(255) NOT NULL,
      expiration_date DATE NOT NULL,
      production_date DATE,
      used_for        VARCHAR(500) NOT NULL,
      dosage          VARCHAR(255) NOT NULL,
      description     TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_medicines_user_id ON medicines(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_medicines_expiration ON medicines(expiration_date)`;

  console.log('Migrations complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
