import { sql } from './index';

async function migrate() {
  console.log('Running migration 002: rename name → generic_name, add brand_name...');

  // Rename name → generic_name (only if name column still exists)
  await sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'medicines' AND column_name = 'name'
      ) THEN
        ALTER TABLE medicines RENAME COLUMN name TO generic_name;
      END IF;
    END $$
  `;

  // Add brand_name column if it doesn't exist
  await sql`
    ALTER TABLE medicines ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255)
  `;

  console.log('Migration 002 complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
