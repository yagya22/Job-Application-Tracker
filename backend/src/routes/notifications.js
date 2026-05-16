const express = require("express");
const { pool } = require("../db/database");
const { checkFollowUps } = require("../services/reminderService");

const router = express.Router();

/** GET /api/notifications */
router.get("/", async (req, res) => {
  try {
    const { rows: notifications } = await pool.query(
      `SELECT n.*, t.company, t.role, t.status
       FROM notifications n
       LEFT JOIN tracked_jobs t ON t.id = n.job_id
       ORDER BY n.created_at DESC LIMIT 50`
    );
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM notifications WHERE read = 0"
    );
    res.json({ success: true, unreadCount: countRows[0].count, notifications });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** PUT /api/notifications/:id/read */
router.put("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET read = 1 WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** PUT /api/notifications/read-all */
router.put("/read-all", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET read = 1");
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** POST /api/notifications/trigger */
router.post("/trigger", async (req, res) => {
  try {
    await checkFollowUps();
    res.json({ success: true, message: "Follow-up check triggered." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
