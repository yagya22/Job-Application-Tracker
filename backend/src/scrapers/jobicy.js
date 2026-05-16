const axios = require("axios");

const BASE_URL = "https://jobicy.com/api/v2/remote-jobs";
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

const INDUSTRY_MAP = [
  [/engineer|developer|software|backend|frontend|fullstack|react|node|typescript/,  "engineering"],
  [/data|machine.?learning|ml\b|ai\b|analytics|scientist/,                           "data-science"],
  [/devops|cloud|kubernetes|docker|infrastructure|sre\b/,                             "devops"],
  [/design|ux\b|ui\b|product.?design/,                                               "design"],
  [/marketing|seo|content|growth/,                                                    "marketing"],
  [/hr\b|human.?resource|recruit|talent|people.?ops?/,                               "hr"],
  [/finance|account|fintech|audit/,                                                   "finance"],
  [/consult/,                                                                         "consulting"],
  [/sales|account.?executive|business.?dev/,                                          "sales"],
  [/support|helpdesk|customer.?service/,                                              "customer-support"],
  [/project|program.?manager|scrum|agile/,                                            "project-management"],
  [/product.?(manager|owner)/,                                                        "product"],
];

function detectIndustry(title, skills) {
  const text = `${title} ${skills.join(" ")}`.toLowerCase();
  for (const [pattern, industry] of INDUSTRY_MAP) {
    if (pattern.test(text)) return industry;
  }
  return null;
}

async function scrapeJobicy(title = "", skills = []) {
  try {
    const params = { count: 50, geo: "germany" };

    const industry = detectIndustry(title, skills);
    if (industry) params.industry = industry;

    const firstWord = [title, ...skills].filter(Boolean).join(" ").split(/\s+/)[0] || "";
    if (firstWord.length > 2) params.tag = firstWord.toLowerCase();

    const { data } = await axios.get(BASE_URL, {
      params,
      timeout: TIMEOUT,
      headers: { Accept: "application/json" },
    });

    return (data.jobs || []).map((job) => ({
      id:                 `jobicy-${job.id}`,
      company:           job.companyName  || "Unknown Company",
      role:              job.jobTitle     || "Unknown Role",
      location:          job.jobGeo       || "Germany",
      apply_link:        job.url          || "",
      sponsorship_status: detectSponsorship(job.jobTitle + " " + (job.jobExcerpt || "")),
      source:            "Jobicy",
      tags:              [],
      remote:            true,
      description:       stripHtml(job.jobExcerpt || "").substring(0, 500),
      posted_at:         job.pubDate      || null,
    }));
  } catch (err) {
    console.warn("[Jobicy] Scrape failed:", scrapeError(err));
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

module.exports = { scrapeJobicy };
