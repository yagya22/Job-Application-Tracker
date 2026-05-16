/**
 * Adzuna Germany Scraper
 * Adzuna aggregates jobs from thousands of German company sites & job boards.
 * Free API key at: https://developer.adzuna.com/ (10,000 calls/month free)
 * Set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env to enable this source.
 */

const axios = require("axios");

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/de/search/1";
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

async function scrapeAdzuna(title = "", skills = []) {
  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    // Silently skip — not configured, not an error
    return [];
  }

  try {
    const what = [title, ...skills].filter(Boolean).join(" ") || "software engineer";

    const { data } = await axios.get(BASE_URL, {
      params: {
        app_id:           appId,
        app_key:          appKey,
        results_per_page: 50,
        what,
        sort_by:          "date",
      },
      timeout: TIMEOUT,
      headers: { Accept: "application/json" },
    });

    return (data.results || []).map((job) => ({
      id:                 `adzuna-${job.id}`,
      company:           job.company?.display_name  || "Unknown Company",
      role:              job.title                  || "Unknown Role",
      location:          job.location?.display_name || "Germany",
      apply_link:        job.redirect_url           || "",
      sponsorship_status: detectSponsorship(job.title + " " + (job.description || "")),
      source:            "Adzuna",
      tags:              job.category?.label ? [job.category.label] : [],
      remote:            /remote/i.test(job.title + " " + (job.description || "")),
      description:       (job.description || "").substring(0, 500),
      posted_at:         job.created               || null,
    }));
  } catch (err) {
    console.warn("[Adzuna] Scrape failed:", scrapeError(err));
    return [];
  }
}

function detectSponsorship(text) {
  const lower = (text || "").toLowerCase();
  return lower.includes("visa") || lower.includes("sponsorship") ||
    lower.includes("work permit") || lower.includes("relocation")
    ? "Visa Sponsored" : "Check Job Listing";
}

function scrapeError(err) {
  const status = err.response?.status;
  if (!status) return err.message;
  const hint = status === 429 ? " — rate limited, try again in a few minutes"
    : status === 401 ? " — invalid API key (check ADZUNA_APP_ID / ADZUNA_APP_KEY in .env)"
    : status === 403 ? " — forbidden"
    : status === 503 ? " — service unavailable"
    : "";
  return `HTTP ${status}${hint}`;
}

module.exports = { scrapeAdzuna };
