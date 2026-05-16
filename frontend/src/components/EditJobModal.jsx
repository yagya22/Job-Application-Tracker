import { useState } from "react";
import toast from "react-hot-toast";
import { updateTrackedJob } from "../api";

export default function EditJobModal({ job, onClose, onUpdated }) {
  const [form, setForm] = useState({
    status: job.status, notes: job.notes || "",
    company: job.company, role: job.role,
    location: job.location, apply_link: job.apply_link || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTrackedJob(job.id, form);
      toast.success("Application updated");
      onUpdated?.();
      onClose();
    } catch {
      toast.error("Update failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: "applied",   label: "Applied"   },
    { value: "interview", label: "Interview" },
    { value: "offer",     label: "Offer"     },
    { value: "rejected",  label: "Rejected"  },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-lift w-full sm:max-w-lg animate-fade-up max-h-[95vh] overflow-y-auto">

        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-display font-bold text-ink dark:text-gray-100 text-lg truncate">{job.role}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{job.company}</p>
        </div>

        <div className="px-6 pt-5 pb-3">
          <p className="text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Application Status
          </p>
          <div className="grid grid-cols-4 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("status", opt.value)}
                className={`py-2.5 rounded-lg text-xs font-display font-semibold border transition-all ${
                  form.status === opt.value
                    ? `badge-${opt.value} shadow-sm`
                    : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Notes</Label>
            <textarea className="input-field resize-none" rows={3} placeholder="Recruiter contact, interview date, feedback..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Apply Link</Label>
            <input className="input-field" type="url" placeholder="https://..." value={form.apply_link} onChange={(e) => set("apply_link", e.target.value)} />
          </div>
          <div>
            <Label>Company</Label>
            <input className="input-field" value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div>
            <Label>Location</Label>
            <input className="input-field" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{children}</label>;
}
