const express = require("express");
const db      = require("../db/database");
const { checkFollowUps } = require("../services/reminderService");

const router = express.Router();

/** GET /api/notifications */
router.get("/", (req, res) => {
  try {
    const notifications = db.prepare(
      `SELECT n.*, t.company, t.role, t.status
       FROM notifications n
       LEFT JOIN tracked_jobs t ON t.id = n.job_id
       ORDER BY n.created_at DESC LIMIT 50`
    ).all();
    const unreadCount = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE read = 0").get().count;
    res.json({ success: true, unreadCount, notifications });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** PUT /api/notifications/:id/read */
router.put("/:id/read", (req, res) => {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run([req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** PUT /api/notifications/read-all */
router.put("/read-all", (req, res) => {
  try {
    db.prepare("UPDATE notifications SET read = 1").run();
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
