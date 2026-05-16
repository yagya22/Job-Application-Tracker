import { useState } from "react";
import toast from "react-hot-toast";
import { addTrackedJob } from "../api";

const SOURCE_COLORS = {
  Arbeitnow:         "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "The Muse":        "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Jobicy:            "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  Adzuna:            "bg-blue-50   dark:bg-blue-950/40   text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-800",
  Remotive:          "bg-cyan-50   dark:bg-cyan-950/40   text-cyan-700   dark:text-cyan-300   border-cyan-200   dark:border-cyan-800",
  RemoteOK:          "bg-rose-50   dark:bg-rose-950/40   text-rose-700   dark:text-rose-300   border-rose-200   dark:border-rose-800",
  "Working Nomads":  "bg-teal-50   dark:bg-teal-950/40   text-teal-700   dark:text-teal-300   border-teal-200   dark:border-teal-800",
  Manual:            "bg-gray-100  dark:bg-gray-800       text-gray-600   dark:text-gray-400   border-gray-200   dark:border-gray-700",
};

export default function JobCard({ job }) {
  const [tracking, setTracking] = useState(false);
  const [tracked,  setTracked]  = useState(false);

  const handleTrack = async () => {
    setTracking(true);
    try {
      await addTrackedJob({
        company:            job.company,
        role:               job.role,
        location:           job.location,
        apply_link:         job.apply_link,
        source:             job.source,
        sponsorship_status: job.sponsorship_status,
        status:             "applied",
        notes:              "",
        applied_date:       new Date().toISOString(),
      });
      setTracked(true);
      toast.success(`Added "${job.role}" to your tracker`);
    } catch {
      toast.error("Failed to add job. Try again.");
    } finally {
      setTracking(false);
    }
  };

  const sourceColor = SOURCE_COLORS[job.source] || SOURCE_COLORS.Manual;

  return (
    <div className="card p-5 animate-fade-up job-card hover:shadow-lift transition-all duration-200 flex flex-col">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-ink dark:text-gray-100 text-base leading-snug line-clamp-2">
            {job.role}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium truncate">{job.company}</p>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${
            job.sponsorship_status === "Visa Sponsored" ? "badge-sponsored" : "badge-check"
          }`}
        >
          {job.sponsorship_status === "Visa Sponsored" ? "✓ Visa" : "Check"}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
          <LocationIcon />
          <span className="truncate max-w-[120px]">{job.location}</span>
        </span>
        <span className={`text-xs px-2 py-0.5 rounded border font-mono flex-shrink-0 ${sourceColor}`}>
          {job.source}
        </span>
        {job.remote && (
          <span className="text-xs px-2 py-0.5 rounded border bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 font-mono flex-shrink-0">
            Remote
          </span>
        )}
        {job.posted_at && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">
            {new Date(job.posted_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Tags */}
      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
              {tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 px-1">+{job.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
          {job.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
        >
          Apply <ExternalIcon />
        </a>
        <button
          onClick={handleTrack}
          disabled={tracking || tracked}
          className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-4"
        >
          {tracked   ? "✓ Tracking" :
           tracking  ? <span className="animate-pulse-soft">Adding...</span> :
           <><PlusIcon /> Track</>}
        </button>
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
