const { scrapeArbeitnow }    = require("./arbeitnow");
const { scrapeMuse }         = require("./themuse");
const { scrapeJobicy }       = require("./jobicy");
const { scrapeAdzuna }       = require("./adzuna");
const { scrapeRemotive }     = require("./remotive");
const { scrapeRemoteok }     = require("./remoteok");
const { scrapeWorkingNomads } = require("./workingnomads");

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Prevents hammering APIs on repeated searches. TTL: 5 minutes.
const cache     = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(title, skills) {
  return `${(title || "").toLowerCase().trim()}|${[...skills].map((s) => s.toLowerCase().trim()).sort().join(",")}`;
}
// ─────────────────────────────────────────────────────────────────────────────

async function scrapeAll(title = "", skills = []) {
  const key = cacheKey(title, skills);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    const age = Math.round((Date.now() - hit.at) / 1000);
    console.log(`[Scraper] Cache hit (${age}s old) for "${title}" — returning ${hit.jobs.length} cached jobs`);
    return hit.jobs;
  }

  console.log(`[Scraper] Starting search: title="${title}" skills="${skills.join(",")}"`);

  const [arbeitnow, muse, jobicy, adzuna, remotive, remoteok, workingnomads] = await Promise.allSettled([
    scrapeArbeitnow(title, skills),    // Germany visa-sponsored
    scrapeMuse(title, skills),         // International categories
    scrapeJobicy(title, skills),       // Germany geo-filtered
    scrapeAdzuna(title, skills),       // Germany physical jobs (needs ADZUNA_APP_ID + ADZUNA_APP_KEY)
    scrapeRemotive(title, skills),     // Remote jobs worldwide
    scrapeRemoteok(title, skills),     // Remote jobs worldwide
    scrapeWorkingNomads(title, skills),// Remote jobs by category
  ]);

  const allJobs = [
    ...(arbeitnow.status     === "fulfilled" ? arbeitnow.value     : []),
    ...(muse.status          === "fulfilled" ? muse.value          : []),
    ...(jobicy.status        === "fulfilled" ? jobicy.value        : []),
    ...(adzuna.status        === "fulfilled" ? adzuna.value        : []),
    ...(remotive.status      === "fulfilled" ? remotive.value      : []),
    ...(remoteok.status      === "fulfilled" ? remoteok.value      : []),
    ...(workingnomads.status === "fulfilled" ? workingnomads.value : []),
  ];

  console.log(
    `[Scraper] Raw: Arbeitnow=${arbeitnow.value?.length ?? 0}, ` +
    `TheMuse=${muse.value?.length ?? 0}, ` +
    `Jobicy=${jobicy.value?.length ?? 0}, ` +
    `Adzuna=${adzuna.value?.length ?? 0}, ` +
    `Remotive=${remotive.value?.length ?? 0}, ` +
    `RemoteOK=${remoteok.value?.length ?? 0}, ` +
    `WorkingNomads=${workingnomads.value?.length ?? 0}`
  );

  const deduplicated = deduplicateJobs(allJobs);
  const classified   = deduplicated.map((job) => ({ ...job, match: classifyMatch(job, title) }));
  const sorted       = sortByRelevance(classified, title, skills);

  const exactCount   = sorted.filter((j) => j.match === "exact").length;
  cache.set(key, { jobs: sorted, at: Date.now() });
  console.log(`[Scraper] Returning ${sorted.length} jobs (${exactCount} exact, ${sorted.length - exactCount} related) — cached 5 min`);
  return sorted;
}

// A job is an "exact" match when every significant word in the search query
// appears in the job title. "significant" = longer than 1 char and not a stopword.
// This fixes short terms like "IT" being silently dropped by a >2-char filter.
const STOPWORDS = new Set(["and","or","of","in","at","to","for","a","an","the","with","by","as"]);

function queryWords(title) {
  return (title || "").toLowerCase().trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function classifyMatch(job, title) {
  if (!title) return "related";
  const roleLower = (job.role || "").toLowerCase();
  const q         = title.toLowerCase().trim();

  // Exact phrase present in role title
  if (roleLower.includes(q)) return "exact";

  // Every significant word present in role title
  const words = queryWords(title);
  if (words.length > 0 && words.every((w) => roleLower.includes(w))) return "exact";

  return "related";
}

function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${normalize(job.company)}-${normalize(job.role)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortByRelevance(jobs, title, skills) {
  const titleLower  = (title  || "").toLowerCase();
  const skillsLower = (skills || []).map((s) => s.toLowerCase());

  return jobs.sort((a, b) => {
    // 1. Exact title matches always come first
    const aExact = a.match === "exact" ? 1 : 0;
    const bExact = b.match === "exact" ? 1 : 0;
    if (bExact !== aExact) return bExact - aExact;

    // 2. Within each group, visa-sponsored before non-sponsored
    const aSponsored = a.sponsorship_status === "Visa Sponsored" ? 1 : 0;
    const bSponsored = b.sponsorship_status === "Visa Sponsored" ? 1 : 0;
    if (bSponsored !== aSponsored) return bSponsored - aSponsored;

    // 3. Relevance score as tiebreaker
    return scoreJob(b, titleLower, skillsLower) - scoreJob(a, titleLower, skillsLower);
  });
}

function scoreJob(job, titleLower, skillsLower) {
  let score  = 0;
  const hay  = `${job.role} ${job.company} ${(job.tags || []).join(" ")}`.toLowerCase();
  if (titleLower  && hay.includes(titleLower))                    score += 10;
  skillsLower.forEach((s) => { if (hay.includes(s)) score += 3; });
  return score;
}

function normalize(text) {
  return (text || "").toLowerCase().trim().replace(/\s+/g, " ").substring(0, 50);
}

module.exports = { scrapeAll };
