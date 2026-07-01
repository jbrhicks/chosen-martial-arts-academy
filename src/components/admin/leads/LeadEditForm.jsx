import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, X } from "lucide-react";

export default function LeadEditForm({ lead, onSaved, onCancel }) {
  const [form, setForm] = useState({
    full_name: lead.full_name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    program_of_interest: lead.program_of_interest || "",
    lead_source: lead.lead_source || "Website",
    status: lead.status || "new",
    pipeline_stage: lead.pipeline_stage || "new_lead",
    student_age: lead.student_age ?? "",
    trial_date: lead.trial_date || "",
    trial_class_name: lead.trial_class_name || "",
    message: lead.message || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      setError("Name, email, and phone are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updates = {
        ...form,
        student_age: form.student_age === "" ? undefined : Number(form.student_age),
      };
      await base44.entities.Lead.update(lead.id, updates);
      onSaved();
    } catch (e) {
      setError("Failed to save: " + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  const inputClass = "w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none";
  const labelClass = "block text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1.5";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelClass}>Full Name *</label>
          <input type="text" value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input type="tel" value={form.phone} onChange={e => handleChange("phone", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Program of Interest</label>
          <select value={form.program_of_interest} onChange={e => handleChange("program_of_interest", e.target.value)} className={inputClass}>
            <option value="">—</option>
            <option value="Youth">Youth</option>
            <option value="Teen">Teen</option>
            <option value="Adult">Adult</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Lead Source</label>
          <select value={form.lead_source} onChange={e => handleChange("lead_source", e.target.value)} className={inputClass}>
            <option value="Organic">Organic</option>
            <option value="Facebook Ad">Facebook Ad</option>
            <option value="Referral">Referral</option>
            <option value="Website">Website</option>
            <option value="Exit Intent">Exit Intent</option>
            <option value="Guest Pass">Guest Pass</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={e => handleChange("status", e.target.value)} className={inputClass}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="enrolled">Enrolled</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Pipeline Stage</label>
          <select value={form.pipeline_stage} onChange={e => handleChange("pipeline_stage", e.target.value)} className={inputClass}>
            <option value="new_lead">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="trial_booked">Trial Booked</option>
            <option value="showed_up">Trial Attended</option>
            <option value="won">Won / Enrolled</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Student Age</label>
          <input type="number" min="0" max="99" value={form.student_age} onChange={e => handleChange("student_age", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Trial Date</label>
          <input type="date" value={form.trial_date} onChange={e => handleChange("trial_date", e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Trial Class Name</label>
          <input type="text" value={form.trial_class_name} onChange={e => handleChange("trial_class_name", e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Message / Notes</label>
          <textarea value={form.message} onChange={e => handleChange("message", e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#E0C97A] disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#A8A9AD] hover:text-white">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}