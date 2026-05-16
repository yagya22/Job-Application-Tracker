const axios = require("axios");

const BASE_URL = "https://www.workingnomads.com/api/exposed_jobs/";
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

// Valid Working Nomads category slugs
const CATEGORY_MAP = [
  [/engineer|developer|software|backend|frontend|fullstack|react|node|typescript|java\b|python|php|ruby/,  "dev"],
  [/devops|cloud|kubernetes|docker|infrastructure|sre\b|aws|gcp|azure/,                                     "devops"],
  [/data|machine.?learning|ml\b|ai\b|analytics|scientist/,                                                  "data"],
  [/design|ux\b|ui\b|figma|product.?design/,                                                               "design"],
  [/marketing|seo|content|growth|paid.?media|social.?media/,                                               "marketing"],
  [/product.?(manager|owner)/,                                                                              "product"],
  [/project.?manager|scrum|agile|program.?manager/,                                                        "project-management"],
  [/customer.?support|helpdesk|customer.?service|customer.?success/,                                       "customer-support"],
  [/hr\b|human.?resource|recruit|talent|people.?ops?/,                                                     "hr"],
  [/finance|account|fintech|audit/,                                                                         "finance"],
  [/sales|account.?executive|business.?dev/,                                                               "sales"],
  [/consult/,                                                                                                "consulting"],
];

function detectCategory(title, skills) {
  const text = `${title} ${skills.join(" ")}`.toLowerCase();
  for (const [pattern, cat] of CATEGORY_MAP) {
    if (pattern.test(text)) return cat;
  }
  return "dev";
}

async function scrapeWorkingNomads(title = "", skills = []) {
  try {
    const category = detectCategory(title, skills);

    const { data } = await axios.get(BASE_URL, {
      params:  { category },
      timeout: TIMEOUT,
      headers: { Accept: "application/json" },
    });

    const jobs = Array.isArray(data) ? data : [];

    return jobs
      .filter((j) => j && j.title)
      .map((job) => ({
        id:                 `workingnomads-${job.id}`,
        company:           job.company_name || "Unknown Company",
        role:              job.title        || "Unknown Role",
        location:          "Remote / Worldwide",
        apply_link:        job.url          || "",
        sponsorship_status: detectSponsorship(job.title + " " + (job.description || "")),
        source:            "Working Nomads",
        tags:              [],
        remote:            true,
        description:       stripHtml(job.description || "").substring(0, 500),
        posted_at:         job.pub_date     || null,
      }))
      .filter((job) => matchesQuery(job, title, skills));
  } catch (err) {
    console.warn("[WorkingNomads] Scrape failed:", scrapeError(err));
    return [];
  }
}

function matchesQuery(job, title, skills) {
  if (!title && (!skills || skills.length === 0)) return true;
  const STOP        = new Set(["and","or","of","in","at","to","for","a","an","the"]);
  const titleWords  = title.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  const skillsLower = skills.map((s) => s.toLowerCase().trim()).filter(Boolean);
  const hay = `${job.role} ${job.company} ${job.description}`.toLowerCase();
  const titleMatch  = !title || titleWords.some((w) => hay.includes(w));
  const skillsMatch = skillsLower.length === 0 || skillsLower.some((s) => hay.includes(s));
  return titleMatch && skillsMatch;
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

module.exports = { scrapeWorkingNomads };
