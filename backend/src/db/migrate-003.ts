import { sql } from './index';

async function migrate() {
  console.log('Running migration 003: add display_name, full_name, username to users...');

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)`;

  // Give existing users a safe default username so we can add the NOT NULL + UNIQUE constraint
  await sql`UPDATE users SET username = 'user_' || id WHERE username IS NULL`;

  await sql`ALTER TABLE users ALTER COLUMN username SET NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`;

  console.log('Migration 003 complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
