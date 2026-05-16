const express = require("express");
const { pool } = require("../db/database");

const router = express.Router();
const VALID_STATUSES = ["applied", "interview", "offer", "rejected"];

/** GET /api/tracker */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tracked_jobs ORDER BY last_updated DESC");
    res.json({ success: true, count: rows.length, jobs: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** GET /api/tracker/:id */
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tracked_jobs WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, job: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** POST /api/tracker */
router.post("/", async (req, res) => {
  try {
    const { company, role, location, apply_link, source, sponsorship_status, status, notes, applied_date } = req.body;
    if (!company || !role) return res.status(400).json({ error: "company and role are required." });
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });

    const { rows } = await pool.query(
      `INSERT INTO tracked_jobs
         (company, role, location, apply_link, source, sponsorship_status, status, notes, applied_date, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [company, role, location || "Germany", apply_link || null, source || "Manual",
       sponsorship_status || "Visa Sponsored", status || "applied", notes || "",
       applied_date || new Date().toISOString()]
    );
    res.status(201).json({ success: true, job: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** PUT /api/tracker/:id */
router.put("/:id", async (req, res) => {
  try {
    const { rows: existing } = await pool.query("SELECT * FROM tracked_jobs WHERE id = $1", [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: "Not found" });
    const job = existing[0];

    const { status, notes, company, role, location, apply_link } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });

    const newStatus     = status      ?? job.status;
    const resetFollowUp = newStatus !== "applied" ? 1 : job.follow_up_sent;

    const { rows } = await pool.query(
      `UPDATE tracked_jobs
       SET company=$1, role=$2, location=$3, apply_link=$4, status=$5,
           notes=$6, follow_up_sent=$7, last_updated=NOW()
       WHERE id=$8
       RETURNING *`,
      [company      ?? job.company,
       role         ?? job.role,
       location     ?? job.location,
       apply_link   ?? job.apply_link,
       newStatus,
       notes        ?? job.notes,
       resetFollowUp,
       req.params.id]
    );
    res.json({ success: true, job: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** DELETE /api/tracker/:id */
router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM tracked_jobs WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    await pool.query("DELETE FROM tracked_jobs WHERE id = $1", [req.params.id]);
    res.json({ success: true, deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
