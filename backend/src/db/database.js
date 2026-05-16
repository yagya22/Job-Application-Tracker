const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
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
