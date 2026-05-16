const express = require("express");
const { scrapeAll } = require("../scrapers");

const router = express.Router();

/**
 * GET /api/jobs/search
 * Query params:
 *   - title  (string) — job title to search
 *   - skills (string) — comma-separated skills
 */
router.get("/search", async (req, res) => {
  try {
    const title  = (req.query.title  || "").trim();
    const skills = (req.query.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title && skills.length === 0) {
      return res.status(400).json({
        error: "Provide at least a job title or one skill to search.",
      });
    }

    const jobs = await scrapeAll(title, skills);

    res.json({
      success: true,
      count: jobs.length,
      query: { title, skills },
      jobs,
    });
  } catch (err) {
    console.error("[GET /jobs/search]", err.message);
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

module.exports = router;
