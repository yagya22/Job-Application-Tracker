const axios = require("axios");

const BASE_URL = "https://remoteok.com/api";
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

const TAG_MAP = [
  [/javascript|typescript|react|vue|angular|node/,  "javascript"],
  [/python/,                                         "python"],
  [/java\b/,                                         "java"],
  [/golang|go\b/,                                    "golang"],
  [/rust\b/,                                         "rust"],
  [/php\b/,                                          "php"],
  [/devops|kubernetes|k8s|docker|ci.?cd/,            "devops"],
  [/aws|cloud|gcp|azure/,                            "cloud"],
  [/data|machine.?learning|ml\b|ai\b|analytics/,     "data"],
  [/design|ux\b|ui\b/,                               "design"],
  [/marketing/,                                      "marketing"],
  [/finance|account/,                                "finance"],
  [/hr\b|recruit/,                                   "hr"],
  [/operations?\b|ops\b/,                            "operations"],
  [/consult/,                                        "consulting"],
  [/support|helpdesk/,                               "support"],
  [/manager|management/,                             "management"],
];

function extractTag(title, skills) {
  const text = `${title} ${skills.join(" ")}`.toLowerCase();
  for (const [pattern, tag] of TAG_MAP) {
    if (pattern.test(text)) return tag;
  }
  const first = (title || "").split(/\s+/)[0];
  return first && first.length > 2 ? first.toLowerCase() : "software";
}

async function scrapeRemoteok(title = "", skills = []) {
  try {
    const tag = extractTag(title, skills);

    const { data } = await axios.get(BASE_URL, {
      params:  { tag },
      timeout: TIMEOUT,
      headers: {
        "User-Agent": process.env.SCRAPER_USER_AGENT ||
          "Mozilla/5.0 (compatible; VisaJobsBot/1.0)",
        Accept: "application/json",
      },
    });

    const jobs = Array.isArray(data) ? data.slice(1) : [];

    return jobs
      .filter((j) => j && j.position)
      .map((job) => ({
        id:                 `remoteok-${job.id || job.slug || Math.random()}`,
        company:           job.company  || "Unknown Company",
        role:              job.position || "Unknown Role",
        location:          job.location || "Remote / Worldwide",
        apply_link:        job.url      || `https://remoteok.com/remote-jobs/${job.slug}`,
        sponsorship_status: detectSponsorship(job.position + " " + (job.description || "")),
        source:            "RemoteOK",
        tags:              Array.isArray(job.tags) ? job.tags : [],
        remote:            true,
        description:       stripHtml(job.description || "").substring(0, 500),
        posted_at:         job.date || null,
      }));
  } catch (err) {
    console.warn("[RemoteOK] Scrape failed:", scrapeError(err));
    return [];
  }
}

function detectSponsorship(text) {
  const lower = (text || "").toLowerCase();
  return lower.includes("visa") || lower.includes("sponsorship") ||
    lower.includes("work permit") || lower.includes("relocation")
    ? "Visa Sponsored" : "Check Job Listing";
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

module.exports = { scrapeRemoteok };
