const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("[DB] ERROR: DATABASE_URL is not set. Add it to your .env file.");
  console.error("[DB] Example: DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/visajobs");
  process.exit(1);
}

const isLocalDB = process.env.DATABASE_URL.includes("localhost") ||
                  process.env.DATABASE_URL.includes("127.0.0.1");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDB ? false : { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracked_jobs (
      id                 SERIAL PRIMARY KEY,
      company            TEXT        NOT NULL,
      role               TEXT        NOT NULL,
      location           TEXT        DEFAULT 'Germany',
      apply_link         TEXT,
      source             TEXT        DEFAULT 'Manual',
      sponsorship_status TEXT        DEFAULT 'Visa Sponsored',
      status             TEXT        DEFAULT 'applied'
                                     CHECK(status IN ('applied','interview','offer','rejected')),
      notes              TEXT        DEFAULT '',
      applied_date       TIMESTAMPTZ DEFAULT NOW(),
      last_updated       TIMESTAMPTZ DEFAULT NOW(),
      follow_up_sent     INTEGER     DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      job_id     INTEGER REFERENCES tracked_jobs(id) ON DELETE CASCADE,
      message    TEXT        NOT NULL,
      type       TEXT        DEFAULT 'follow_up',
      read       INTEGER     DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tracked_jobs_status ON tracked_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_read  ON notifications(read);
  `);
  console.log("[DB] PostgreSQL schema ready");
}

module.exports = { pool, initDB };
