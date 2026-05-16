const axios = require("axios");

const BASE_URL = "https://www.themuse.com/api/public/jobs";
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 15000;

const CATEGORY_MAP = [
  { pattern: /\b(hr|human.?resource|recruit|talent|people.?ops?)\b/,       category: "HR & Recruiting"      },
  { pattern: /\b(consult)\b/,                                               category: "Consulting"           },
  { pattern: /\b(operation|ops\b)\b/,                                       category: "Operations"           },
  { pattern: /\b(support|helpdesk|customer.?service|service.?desk)\b/,      category: "Customer Service"     },
  { pattern: /\b(data|machine.?learning|ml\b|ai\b|analytics|scientist)\b/,  category: "Data Science"         },
  { pattern: /\b(project|program).?(manager|management|lead)\b/,            category: "Project Management"   },
  { pattern: /\b(product.?manager|product.?owner)\b/,                       category: "Product Management"   },
  { pattern: /\b(finance|accounting|fintech|audit)\b/,                      category: "Finance"              },
  { pattern: /\b(it\b|sysadmin|system.?admin|network|infrastructure)\b/,    category: "IT"                   },
];

function detectCategory(title, skills) {
  const text = `${title} ${skills.join(" ")}`.toLowerCase();
  for (const { pattern, category } of CATEGORY_MAP) {
    if (pattern.test(text)) return category;
  }
  return "Engineering";
}

async function scrapeMuse(title = "", skills = []) {
  try {
    const category = detectCategory(title, skills);
    const results  = [];

    for (let page = 0; page <= 1; page++) {
      const { data } = await axios.get(BASE_URL, {
        params:  { category, page },
        timeout: TIMEOUT,
        headers: { Accept: "application/json" },
      });
      for (const job of data.results || []) {
        const location = (job.locations || []).map((l) => l.name).join(", ");
        results.push({
          id:                 `muse-${job.id}`,
          company:           job.company?.name     || "Unknown Company",
          role:              job.name               || "Unknown Role",
          location:          location               || "Remote / Various",
          apply_link:        job.refs?.landing_page || "",
          sponsorship_status: "Check Job Listing",
          source:            "The Muse",
          tags:              (job.categories || []).map((c) => c.name),
          remote:            (job.locations  || []).some((l) => /remote/i.test(l.name)),
          description:       stripHtml(job.contents || "").substring(0, 500),
          posted_at:         job.publication_date   || null,
        });
      }
    }

    return filterByQuery(results, title, skills);
  } catch (err) {
    console.warn("[TheMuse] Scrape failed:", scrapeError(err));
    return [];
  }
}

function filterByQuery(jobs, title, skills) {
  if (!title && (!skills || skills.length === 0)) return jobs;
  const STOP        = new Set(["and","or","of","in","at","to","for","a","an","the"]);
  const titleWords  = title.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  const skillsLower = skills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  return jobs.filter((job) => {
    const haystack   = `${job.role} ${job.company} ${job.description}`.toLowerCase();
    const titleMatch  = !title || titleWords.some((w) => haystack.includes(w));
    const skillsMatch = skillsLower.length === 0 || skillsLower.some((s) => haystack.includes(s));
    return titleMatch && skillsMatch;
  });
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

module.exports = { scrapeMuse };
