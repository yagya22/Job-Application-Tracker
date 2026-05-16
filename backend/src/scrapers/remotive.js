const axios = require("axios");

const BASE_URL = "https://remotive.com/api/remote-jobs";
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

async function scrapeRemotive(title = "", skills = []) {
  try {
    const search = [title, ...skills].filter(Boolean).join(" ") || "software engineer";

    const { data } = await axios.get(BASE_URL, {
      params: { search, limit: 50 },
      timeout: TIMEOUT,
      headers: { "Accept": "application/json" },
    });

    return (data.jobs || []).map((job) => ({
      id:                 `remotive-${job.id}`,
      company:           job.company_name || "Unknown Company",
      role:              job.title        || "Unknown Role",
      location:          job.candidate_required_location || "Remote / Worldwide",
      apply_link:        job.url,
      sponsorship_status: detectSponsorship(job.title + " " + stripHtml(job.description || "")),
      source:            "Remotive",
      tags:              Array.isArray(job.tags) ? job.tags : [],
      remote:            true,
      description:       stripHtml(job.description || "").substring(0, 500),
      posted_at:         job.publication_date || null,
    }));
  } catch (err) {
    console.warn("[Remotive] Scrape failed:", scrapeError(err));
    return [];
  }
}

function detectSponsorship(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("visa") || lower.includes("sponsorship") || lower.includes("work permit") || lower.includes("relocation")) {
    return "Visa Sponsored";
  }
  return "Check Job Listing";
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function scrapeError(err) {
  const status = err.response?.status;
  if (!status) return err.message;
  const hint = status === 429 ? " — rate limited, try again in a few minutes"
    : status === 403 ? " — forbidden (IP may be blocked)"
    : status === 503 ? " — service unavailable"
    : "";
  return `HTTP ${status}${hint}`;
}

module.exports = { scrapeRemotive };
