/**
 * migrate.js — Simple forward-only SQL migration runner.
 *
 * Usage:
 *   node db/migrate.js            # run all pending migrations
 *   node db/migrate.js --dry-run  # print pending migrations without running them
 *
 * How it works:
 *   1. Creates a `schema_migrations` table if it doesn't exist.
 *   2. Reads every *.sql file in db/migrations/ sorted by filename.
 *   3. Skips files already recorded in schema_migrations.
 *   4. Runs each pending file in a transaction; records on success.
 *
 * Naming convention: NNN_description.sql  (e.g. 001_initial_schema.sql)
 * Files must be numbered sequentially and never renamed after deployment.
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const DRY_RUN = process.argv.includes('--dry-run');

async function migrate() {
  const client = await pool.connect();
  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     VARCHAR(255) PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Fetch already-applied versions
    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map(r => r.version));

    // Read migration files, sorted numerically by filename
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('✓ No pending migrations.');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    pending.forEach(f => console.log(`  • ${f}`));

    if (DRY_RUN) {
      console.log('\nDry run — no changes made.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`\nRunning ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`  ✓ ${file} applied.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${file} failed: ${err.message}`);
        process.exit(1);
      }
    }

    console.log('\nAll migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
