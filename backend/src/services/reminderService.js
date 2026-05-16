const cron = require("node-cron");
const { pool } = require("../db/database");
const { sendDigestEmail } = require("./emailService");

const FOLLOW_UP_DAYS = parseInt(process.env.FOLLOW_UP_DAYS) || 7;
const CRON_SCHEDULE  = process.env.REMINDER_CRON || "0 9 * * *";

function start() {
  console.log(`[Reminder] Cron scheduled: "${CRON_SCHEDULE}" (follow-up after ${FOLLOW_UP_DAYS} days)`);
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log("[Reminder] Running follow-up check...");
    await checkFollowUps();
  });
  checkFollowUps();
}

async function checkFollowUps() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FOLLOW_UP_DAYS);

  try {
    const { rows: staleJobs } = await pool.query(
      `SELECT * FROM tracked_jobs
       WHERE status IN ('applied', 'interview')
         AND follow_up_sent = 0
         AND applied_date <= $1`,
      [cutoff.toISOString()]
    );

    if (!staleJobs.length) {
      console.log("[Reminder] No stale applications found.");
      return;
    }

    console.log(`[Reminder] Found ${staleJobs.length} stale application(s).`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const job of staleJobs) {
        const daysSince = Math.floor(
          (Date.now() - new Date(job.applied_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const message = `No update on your application to ${job.company} (${job.role}) — ${daysSince} days since you applied.`;
        await client.query(
          "INSERT INTO notifications (job_id, message, type) VALUES ($1, $2, 'follow_up')",
          [job.id, message]
        );
        await client.query(
          "UPDATE tracked_jobs SET follow_up_sent = 1 WHERE id = $1",
          [job.id]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    sendDigestEmail(staleJobs).catch(() => {});
  } catch (err) {
    console.error("[Reminder] Error during follow-up check:", err.message);
  }
}

module.exports = { start, checkFollowUps };
