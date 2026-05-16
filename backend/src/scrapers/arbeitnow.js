/**
 * Arbeitnow Scraper
 * Arbeitnow.com has a free public API specifically for visa-sponsored tech jobs in Germany.
 * Docs: https://www.arbeitnow.com/api/job-board-api
 */

const axios = require("axios");

const BASE_URL = "https://www.arbeitnow.com/api/job-board-api";
const TIMEOUT = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

async function scrapeArbeitnow(title = "", skills = []) {
  const results = [];
  let page = 1;
  const maxPages = 3; // max 3 pages = ~75 results

  try {
    while (page <= maxPages) {
      const { data } = await axios.get(BASE_URL, {
        params: { page },
        timeout: TIMEOUT,
        headers: { "Accept": "application/json", "User-Agent": process.env.SCRAPER_USER_AGENT },
      });

      if (!data?.data?.length) break;

      const jobs = data.data.map((job) => ({
        id: `arbeitnow-${job.slug}`,
        company: job.company_name || "Unknown Company",
        role: job.title || "Unknown Role",
        location: job.location || "Germany",
        apply_link: job.url || `https://www.arbeitnow.com/jobs/${job.slug}`,
        sponsorship_status: "Visa Sponsored",
        source: "Arbeitnow",
        tags: job.tags || [],
        remote: job.remote || false,
        description: (job.description || "").substring(0, 500),
        posted_at: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
      }));

      results.push(...jobs);

      // If API returns fewer than 25 items, no more pages
      if (data.data.length < 25) break;
      page++;
    }
  } catch (err) {
    console.warn("[Arbeitnow] Scrape failed:", scrapeError(err));
  }

  return filterByQuery(results, title, skills);
}

/**
 * Client-side filtering. Arbeitnow returns all visa jobs so we filter here.
 * Uses word-based matching so "software engineer" also matches
 * "software developer", "backend engineer", "Softwareentwickler", etc.
 */
function filterByQuery(jobs, title, skills) {
  if (!title && (!skills || skills.length === 0)) return jobs;

  const titleLower  = title.toLowerCase().trim();
  const STOP        = new Set(["and","or","of","in","at","to","for","a","an","the"]);
  const titleWords  = titleLower.split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  const skillsLower = skills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  return jobs.filter((job) => {
    const roleLower  = job.role.toLowerCase();
    const haystack   = `${roleLower} ${job.company.toLowerCase()} ${(job.tags || []).join(" ").toLowerCase()} ${job.description.toLowerCase()}`;

    const titleMatch =
      !titleLower ||
      roleLower.includes(titleLower) ||                          // exact phrase in title
      haystack.includes(titleLower) ||                           // exact phrase anywhere
      titleWords.some((word) => roleLower.includes(word));       // any key word in title

    const skillsMatch =
      skillsLower.length === 0 ||
      skillsLower.some((skill) => haystack.includes(skill));

    return titleMatch && skillsMatch;
  });
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

module.exports = { scrapeArbeitnow };
