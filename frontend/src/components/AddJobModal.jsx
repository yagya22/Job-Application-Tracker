import { useState } from "react";
import toast from "react-hot-toast";
import { addTrackedJob } from "../api";

export default function AddJobModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    company: "", role: "", location: "Germany", apply_link: "",
    sponsorship_status: "Visa Sponsored", status: "applied",
    notes: "", applied_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.role.trim()) { toast.error("Company and role are required."); return; }
    setSaving(true);
    try {
      await addTrackedJob({ ...form, source: "Manual" });
      toast.success("Application added!");
      onAdded?.();
      onClose();
    } catch {
      toast.error("Failed to add application.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-lift w-full sm:max-w-lg animate-fade-up max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-display font-bold text-ink dark:text-gray-100 text-lg">Add Application</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manually track a job you've applied to</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Company *</Label>
            <input className="input-field" placeholder="e.g. Zalando" value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Role *</Label>
            <input className="input-field" placeholder="e.g. Senior Backend Engineer" value={form.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div>
            <Label>Location</Label>
            <input className="input-field" placeholder="Berlin, Germany" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <Label>Apply Link</Label>
            <input className="input-field" placeholder="https://..." type="url" value={form.apply_link} onChange={(e) => set("apply_link", e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <select className="input-field" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <Label>Applied Date</Label>
            <input className="input-field" type="date" value={form.applied_date} onChange={(e) => set("applied_date", e.target.value)} />
          </div>
          <div>
            <Label>Sponsorship</Label>
            <select className="input-field" value={form.sponsorship_status} onChange={(e) => set("sponsorship_status", e.target.value)}>
              <option value="Visa Sponsored">Visa Sponsored</option>
              <option value="Check Job Listing">Check Job Listing</option>
            </select>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <textarea className="input-field resize-none" rows={3} placeholder="Recruiter name, interview tips, next steps..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Add Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{children}</label>;
}
function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
