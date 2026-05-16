import { useState, useRef } from "react";
import { searchJobs } from "../api";
import JobCard from "../components/JobCard";
import AddJobModal from "../components/AddJobModal";

const EXPERIENCE_LEVELS = [
  { value: "all",      label: "All Levels" },
  { value: "intern",   label: "Intern / Trainee" },
  { value: "junior",   label: "Junior / Entry" },
  { value: "mid",      label: "Mid Level" },
  { value: "senior",   label: "Senior" },
  { value: "lead",     label: "Lead / Staff" },
  { value: "manager",  label: "Manager / Director" },
];

function detectLevel(role) {
  const r = (role || "").toLowerCase();
  if (/\b(intern|internship|werkstudent|trainee|apprentice|graduate|grad)\b/.test(r)) return "intern";
  if (/\b(junior|jr\.?|entry.?level|associate)\b/.test(r))                            return "junior";
  if (/\b(senior|sr\.?)\b/.test(r))                                                    return "senior";
  if (/\b(lead|staff|principal|expert|head of|architect)\b/.test(r))                   return "lead";
  if (/\b(director|vp|vice.?president|chief|head)\b/.test(r))                          return "manager";
  if (/\b(manager|supervisor|team.?lead)\b/.test(r))                                   return "manager";
  return "mid";
}

const SUGGESTIONS = [
  { title: "Software Engineer",    skills: "Python, React" },
  { title: "Data Engineer",        skills: "Spark, SQL" },
  { title: "DevOps Engineer",      skills: "AWS, Docker" },
  { title: "HR Manager",           skills: "Recruiting, HRIS" },
  { title: "IT Support",           skills: "Networking, Windows" },
  { title: "Operations Manager",   skills: "Process, Logistics" },
  { title: "Business Consultant",  skills: "Strategy, Analytics" },
  { title: "ML Engineer",          skills: "PyTorch, MLflow" },
];

function PlusIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

export default function Search() {
  const [title,   setTitle]   = useState("");
  const [skills,  setSkills]  = useState("");
  const [level,   setLevel]   = useState("all");
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,   setError]   = useState(null);
  const [meta,    setMeta]    = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const resultsRef = useRef(null);

  const handleSearch = async (t = title, s = skills) => {
    if (!t.trim() && !s.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const { data } = await searchJobs(t.trim(), s.split(",").map((x) => x.trim()).filter(Boolean));
      setJobs(data.jobs || []);
      setMeta({ count: data.count, query: data.query });
      setSearched(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.response?.data?.error || "Search failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (s) => {
    setTitle(s.title);
    setSkills(s.skills);
    handleSearch(s.title, s.skills);
  };

  const filteredJobs = level === "all"
    ? jobs
    : jobs.filter((j) => detectLevel(j.role) === level);

  const exactJobs    = filteredJobs.filter((j) => j.match === "exact");
  const relatedJobs  = filteredJobs.filter((j) => j.match !== "exact");
  const sponsoredCount = filteredJobs.filter((j) => j.sponsorship_status === "Visa Sponsored").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink dark:text-gray-100 leading-tight tracking-tight mb-2">
          Find your next role in{" "}
          <span className="relative inline-block">
            Europe
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          </span>
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm sm:text-base max-w-xl">
          Search across job boards — Arbeitnow, Adzuna, Jobicy, The Muse, Remotive, RemoteOK & Working Nomads — for roles in Europe and Remote.
        </p>
      </div>

      {/* Search box */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Job Title
            </label>
            <input
              className="input-field"
              placeholder="Software Engineer, HR Manager, Consultant..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Key Skills <span className="normal-case font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              className="input-field"
              placeholder="Python, AWS, React, SAP..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="sm:w-44">
            <label className="block text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Experience
            </label>
            <select
              className="input-field"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleSearch()}
              disabled={loading || (!title.trim() && !skills.trim())}
              className="btn-primary h-[42px] px-6 sm:px-8 flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner /> Searching...
                </span>
              ) : (
                <><SearchIcon /> Search</>
              )}
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 pt-0.5 hidden sm:inline">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.title}
                onClick={() => useSuggestion(s)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700
                           text-gray-500 dark:text-gray-400 hover:border-ink dark:hover:border-gray-400
                           hover:text-ink dark:hover:text-gray-200 transition-all font-mono"
              >
                {s.title}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs text-gray-400 hover:text-ink dark:hover:text-gray-200 flex items-center gap-1.5 transition-colors flex-shrink-0 font-mono"
          >
            <PlusIcon size={11} /> Track an application manually
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center mb-6">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-ink dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="font-display font-semibold text-ink dark:text-gray-100">Searching job boards...</p>
              <p className="text-sm text-gray-400 mt-1">Arbeitnow · Adzuna · Jobicy · The Muse · Remotive · RemoteOK · Working Nomads</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-5 mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">⚠ {error}</p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div ref={resultsRef}>
          {/* Result header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              {exactJobs.length > 0 ? (
                <span className="font-display font-bold text-ink dark:text-gray-100 text-lg">
                  {exactJobs.length} result{exactJobs.length !== 1 ? "s" : ""} for &ldquo;{meta?.query.title || meta?.query.skills?.join(", ")}&rdquo;
                  {relatedJobs.length > 0 && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      + {relatedJobs.length} related
                    </span>
                  )}
                </span>
              ) : (
                <span className="font-display font-bold text-ink dark:text-gray-100 text-lg">
                  {relatedJobs.length} related match{relatedJobs.length !== 1 ? "es" : ""}
                </span>
              )}
              {jobs.length !== filteredJobs.length && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 font-mono">
                  (filtered by level)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {sponsoredCount > 0 && (
                <span className="badge-sponsored text-xs font-mono px-3 py-1 rounded-full">
                  ✓ {sponsoredCount} visa sponsored
                </span>
              )}
              {level !== "all" && (
                <button
                  onClick={() => setLevel("all")}
                  className="text-xs font-mono text-gray-400 hover:text-ink dark:hover:text-gray-200 flex items-center gap-1 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full hover:border-gray-400 transition-all"
                >
                  ✕ {EXPERIENCE_LEVELS.find((l) => l.value === level)?.label}
                </button>
              )}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="card p-12 sm:p-16 text-center">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="font-display font-semibold text-ink dark:text-gray-100 mb-1">No jobs found</p>
              <p className="text-sm text-gray-400 mb-6">
                {level !== "all" ? "Try changing the experience level filter." : "Try different keywords."}
              </p>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                  Already applied somewhere else? Track it here.
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PlusIcon size={13} /> Track an Application
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* No exact matches notice */}
              {exactJobs.length === 0 && relatedJobs.length > 0 && (
                <div className="flex items-center gap-3 card p-4 mb-5 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50">
                  <span className="text-lg flex-shrink-0">🔍</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    No exact matches for <strong>&ldquo;{meta?.query.title}&rdquo;</strong> — showing related roles below.
                  </p>
                </div>
              )}

              {/* Exact matches grid */}
              {exactJobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {exactJobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              )}

              {/* Related matches — only shown when there are also exact matches above */}
              {exactJobs.length > 0 && relatedJobs.length > 0 && (
                <div className="flex items-center gap-4 my-7">
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap px-1">
                    Related matches — similar roles you might consider
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                </div>
              )}

              {/* Related matches grid */}
              {relatedJobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {relatedJobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && !error && (
        <div className="card p-12 sm:p-16 text-center border-dashed dark:border-gray-700">
          <p className="font-display font-bold text-ink dark:text-gray-100 text-xl mb-2">Ready to search</p>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            Enter a job title and skills above to search across multiple job boards simultaneously.
          </p>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
              Applied from a company career page or another job board?
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-display font-semibold text-gray-500 dark:text-gray-400 hover:border-ink dark:hover:border-gray-400 hover:text-ink dark:hover:text-gray-200 transition-all"
            >
              <PlusIcon size={13} /> Track an Application Manually
            </button>
          </div>
        </div>
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function LoadingSpinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}
