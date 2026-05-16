const cron = require("node-cron");
const db   = require("../db/database");
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
  try {
    const staleJobs = db.prepare(
      `SELECT * FROM tracked_jobs
       WHERE status IN ('applied', 'interview')
         AND follow_up_sent = 0
         AND datetime(applied_date) <= datetime('now', '-${FOLLOW_UP_DAYS} days')`
    ).all();

    if (!staleJobs.length) {
      console.log("[Reminder] No stale applications found.");
      return;
    }

    console.log(`[Reminder] Found ${staleJobs.length} stale application(s).`);

    const insertNotif = db.prepare(
      "INSERT INTO notifications (job_id, message, type) VALUES (?, ?, 'follow_up')"
    );
    const markSent = db.prepare("UPDATE tracked_jobs SET follow_up_sent = 1 WHERE id = ?");

    const insertMany = db.transaction((jobs) => {
      for (const job of jobs) {
        const daysSince = Math.floor(
          (Date.now() - new Date(job.applied_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const message = `No update on your application to ${job.company} (${job.role}) — ${daysSince} days since you applied.`;
        insertNotif.run([job.id, message]);
        markSent.run([job.id]);
      }
    });

    insertMany(staleJobs);
    sendDigestEmail(staleJobs).catch(() => {});
  } catch (err) {
    console.error("[Reminder] Error during follow-up check:", err.message);
  }
}

module.exports = { start, checkFollowUps };
