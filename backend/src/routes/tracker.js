const express = require("express");
const db      = require("../db/database");

const router = express.Router();
const VALID_STATUSES = ["applied", "interview", "offer", "rejected"];

/** GET /api/tracker */
router.get("/", (req, res) => {
  try {
    const jobs = db.prepare("SELECT * FROM tracked_jobs ORDER BY last_updated DESC").all();
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** GET /api/tracker/:id */
router.get("/:id", (req, res) => {
  try {
    const job = db.prepare("SELECT * FROM tracked_jobs WHERE id = ?").get([req.params.id]);
    if (!job) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, job });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** POST /api/tracker */
router.post("/", (req, res) => {
  try {
    const { company, role, location, apply_link, source, sponsorship_status, status, notes, applied_date } = req.body;
    if (!company || !role) return res.status(400).json({ error: "company and role are required." });
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });

    const result = db.prepare(
      `INSERT INTO tracked_jobs (company, role, location, apply_link, source, sponsorship_status, status, notes, applied_date, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run([company, role, location || "Germany", apply_link || null, source || "Manual",
           sponsorship_status || "Visa Sponsored", status || "applied", notes || "",
           applied_date || new Date().toISOString()]);

    const created = db.prepare("SELECT * FROM tracked_jobs WHERE id = ?").get([result.lastInsertRowid]);
    res.status(201).json({ success: true, job: created });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** PUT /api/tracker/:id */
router.put("/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM tracked_jobs WHERE id = ?").get([req.params.id]);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const { status, notes, company, role, location, apply_link } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });

    const newStatus = status ?? existing.status;
    const resetFollowUp = newStatus !== "applied" ? 1 : existing.follow_up_sent;

    db.prepare(
      `UPDATE tracked_jobs SET company=?, role=?, location=?, apply_link=?, status=?, notes=?,
       follow_up_sent=?, last_updated=datetime('now') WHERE id=?`
    ).run([company ?? existing.company, role ?? existing.role, location ?? existing.location,
           apply_link ?? existing.apply_link, newStatus, notes ?? existing.notes,
           resetFollowUp, req.params.id]);

    const updated = db.prepare("SELECT * FROM tracked_jobs WHERE id = ?").get([req.params.id]);
    res.json({ success: true, job: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** DELETE /api/tracker/:id */
router.delete("/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT id FROM tracked_jobs WHERE id = ?").get([req.params.id]);
    if (!existing) return res.status(404).json({ error: "Not found" });
    db.prepare("DELETE FROM tracked_jobs WHERE id = ?").run([req.params.id]);
    res.json({ success: true, deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
