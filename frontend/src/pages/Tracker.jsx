import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import { getTrackedJobs, deleteTrackedJob } from "../api";
import AddJobModal from "../components/AddJobModal";
import EditJobModal from "../components/EditJobModal";

const STATUS_META = {
  applied:   { label: "Applied",   class: "badge-applied",   dot: "bg-sky-500" },
  interview: { label: "Interview", class: "badge-interview", dot: "bg-amber-400" },
  offer:     { label: "Offer",     class: "badge-offer",     dot: "bg-emerald-500" },
  rejected:  { label: "Rejected",  class: "badge-rejected",  dot: "bg-red-500" },
};
const PIPELINE_STAGES = ["applied", "interview", "offer", "rejected"];

export default function Tracker() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [view,    setView]    = useState("table");
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, company, role }

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await getTrackedJobs();
      setJobs(data.jobs || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleDelete = (id, company, role) => {
    setConfirmDelete({ id, company, role });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteTrackedJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("Removed from tracker");
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchStatus = filter === "all" || j.status === filter;
    const matchSearch = !search ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats     = PIPELINE_STAGES.reduce((acc, s) => { acc[s] = jobs.filter((j) => j.status === s).length; return acc; }, {});
  const staleCount = jobs.filter((j) => j.status === "applied" && differenceInDays(new Date(), new Date(j.applied_date)) >= 7).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-gray-100 tracking-tight mb-1">
            My Applications
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {jobs.length} application{jobs.length !== 1 ? "s" : ""} tracked
            {staleCount > 0 && (
              <span className="ml-2 text-amber-700 dark:text-amber-400 font-medium">
                · {staleCount} need{staleCount === 1 ? "s" : ""} follow-up
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start">
          <PlusIcon /> Add Application
        </button>
      </div>

      {/* Pipeline stats — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {PIPELINE_STAGES.map((stage) => {
          const meta = STATUS_META[stage];
          return (
            <button
              key={stage}
              onClick={() => setFilter(filter === stage ? "all" : stage)}
              className={`card p-4 text-left transition-all hover:shadow-lift ${filter === stage ? "ring-2 ring-ink dark:ring-white" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <span className="text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {meta.label}
                </span>
              </div>
              <span className="font-display font-bold text-2xl text-ink dark:text-gray-100">{stats[stage] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Follow-up alert */}
      {staleCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-5 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">⏰</span>
          <div>
            <p className="text-sm font-display font-semibold text-amber-800 dark:text-amber-300">
              {staleCount} application{staleCount > 1 ? "s" : ""} with no update in 7+ days
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Consider following up — highlighted in amber below.</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <input
          className="input-field sm:max-w-xs w-full"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filter !== "all" && (
          <button
            onClick={() => setFilter("all")}
            className="text-xs text-gray-400 hover:text-ink dark:hover:text-white flex items-center gap-1 font-mono"
          >
            ✕ Clear filter
          </button>
        )}
        <div className="sm:ml-auto flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 self-start sm:self-auto">
          {["table", "kanban"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-display font-semibold transition-all capitalize ${
                view === v
                  ? "bg-white dark:bg-gray-700 text-ink dark:text-gray-100 shadow-sm"
                  : "text-gray-400 hover:text-ink dark:hover:text-gray-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-16 text-center">
          <div className="w-8 h-8 border-2 border-ink dark:border-gray-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card p-12 sm:p-16 text-center border-dashed dark:border-gray-700">
          <span className="text-4xl block mb-3">📋</span>
          <p className="font-display font-semibold text-ink dark:text-gray-100 mb-1">
            {jobs.length === 0 ? "No applications yet" : "No matches"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {jobs.length === 0
              ? "Add your first application or search for jobs and click Track."
              : "Try adjusting your search or filter."}
          </p>
          {jobs.length === 0 && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">Add Application</button>
          )}
        </div>
      ) : view === "table" ? (
        <TableView jobs={filteredJobs} onEdit={setEditJob} onDelete={handleDelete} />
      ) : (
        <KanbanView jobs={filteredJobs} onEdit={setEditJob} onDelete={handleDelete} />
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onAdded={fetchJobs} />}
      {editJob  && <EditJobModal job={editJob} onClose={() => setEditJob(null)} onUpdated={fetchJobs} />}
      {confirmDelete && (
        <ConfirmDialog
          message={`Remove "${confirmDelete.role} at ${confirmDelete.company}" from your tracker?`}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function TableView({ jobs, onEdit, onDelete }) {
  return (
    <div className="card overflow-hidden">
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {jobs.map((job) => {
          const meta   = STATUS_META[job.status];
          const daysAgo = differenceInDays(new Date(), new Date(job.applied_date));
          const isStale = job.status === "applied" && daysAgo >= 7;
          return (
            <div key={job.id} className={`p-4 ${isStale ? "bg-amber-50/60 dark:bg-amber-950/20" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink dark:text-gray-100 text-sm truncate">{job.company}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.class}`}>{meta.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span className="font-mono">{isStale ? "⏰ " : ""}{formatDistanceToNow(new Date(job.applied_date), { addSuffix: true })}</span>
                <div className="flex items-center gap-1">
                  {job.apply_link && <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-gray-400 hover:text-ink dark:hover:text-white"><ExternalIcon /></a>}
                  <button onClick={() => onEdit(job)} className="p-1.5 rounded text-gray-400 hover:text-ink dark:hover:text-white"><EditIcon /></button>
                  <button onClick={() => onDelete(job.id, job.company, job.role)} className="p-1.5 rounded text-gray-400 hover:text-red-500"><TrashIcon /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              {["Company", "Role", "Location", "Status", "Applied", "Notes", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-display font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const meta    = STATUS_META[job.status];
              const daysAgo = differenceInDays(new Date(), new Date(job.applied_date));
              const isStale = job.status === "applied" && daysAgo >= 7;
              return (
                <tr key={job.id} className={`border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${isStale ? "bg-amber-50/60 dark:bg-amber-950/10" : ""}`}>
                  <td className="px-5 py-3.5">
                    <span className="font-display font-semibold text-ink dark:text-gray-100">{job.company}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <span className="truncate block text-gray-600 dark:text-gray-300">{job.role}</span>
                    {job.sponsorship_status === "Visa Sponsored" && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">✓ Visa</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs font-mono whitespace-nowrap">{job.location}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${meta.class}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-mono ${isStale ? "text-amber-700 dark:text-amber-400 font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                      {isStale && "⏰ "}{formatDistanceToNow(new Date(job.applied_date), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[160px]">
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">{job.notes || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      {job.apply_link && (
                        <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-gray-400 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ExternalIcon /></a>
                      )}
                      <button onClick={() => onEdit(job)} className="p-1.5 rounded-md text-gray-400 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><EditIcon /></button>
                      <button onClick={() => onDelete(job.id, job.company, job.role)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KanbanView({ jobs, onEdit, onDelete }) {
  const columns = PIPELINE_STAGES.map((stage) => ({
    stage, meta: STATUS_META[stage], jobs: jobs.filter((j) => j.status === stage),
  }));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(({ stage, meta, jobs: colJobs }) => (
        <div key={stage}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <span className="font-display font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{meta.label}</span>
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500 ml-auto">{colJobs.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {colJobs.map((job) => {
              const daysAgo = differenceInDays(new Date(), new Date(job.applied_date));
              const isStale = stage === "applied" && daysAgo >= 7;
              return (
                <div
                  key={job.id}
                  className={`card p-4 cursor-pointer hover:shadow-lift transition-all ${isStale ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
                  onClick={() => onEdit(job)}
                >
                  <p className="font-display font-semibold text-ink dark:text-gray-100 text-sm leading-snug mb-0.5">{job.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{job.company}</p>
                  {isStale && <p className="text-xs text-amber-700 dark:text-amber-400 font-mono mb-2">⏰ {daysAgo}d no update</p>}
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{job.location}</p>
                  {job.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2 italic">{job.notes}</p>}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-1">
                      {formatDistanceToNow(new Date(job.applied_date), { addSuffix: true })}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(job.id, job.company, job.role); }}
                      className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            {colJobs.length === 0 && (
              <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                <p className="text-xs text-gray-300 dark:text-gray-600 font-mono">empty</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lift border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 animate-fade-up">
        <div className="flex items-start gap-3 mb-5">
          <span className="text-2xl flex-shrink-0">🗑️</span>
          <div>
            <p className="font-display font-semibold text-ink dark:text-gray-100 text-sm mb-1">Remove application?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-display font-semibold text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-display font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function TrashIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function ExternalIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
}
