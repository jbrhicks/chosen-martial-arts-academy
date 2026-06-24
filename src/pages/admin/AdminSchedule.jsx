import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK, formatTime } from "@/lib/constants";
import { Loader2, Plus, X, Pencil, Trash2, Clock, Settings } from "lucide-react";
import RankLevelSettings from "@/components/admin/schedule/RankLevelSettings";

const BELT_LEVELS = ["All Belts", "Beginner", "Intermediate", "Advanced", "Black Belt"];

export default function AdminSchedule() {
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRankSettings, setShowRankSettings] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    class_name: "", days: ["Monday"], start_time: "", end_time: "",
    instructor: "", location: "", linked_program_id: "", belt_level: "All Belts", is_active: true, is_trial_eligible: false, max_trials_allowed: 2,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const [data, progs] = await Promise.all([
        base44.entities.ClassSchedule.list(),
        base44.entities.Program.list(),
      ]);
      setClasses(data);
      setPrograms(progs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const resetForm = () => {
    setForm({ class_name: "", days: ["Monday"], start_time: "", end_time: "", instructor: "", location: "", linked_program_id: "", belt_level: "All Belts", is_active: true, is_trial_eligible: false, max_trials_allowed: 2 });
    setEditing(null);
  };

  const handleEdit = (cls) => {
    setEditing(cls);
    setForm({
      class_name: cls.class_name || "", days: [cls.day_of_week || "Monday"],
      start_time: cls.start_time || "", end_time: cls.end_time || "",
      instructor: cls.instructor || "", location: cls.location || "",
      linked_program_id: cls.linked_program_id || "", belt_level: cls.belt_level || "All Belts",
      is_active: cls.is_active !== false, is_trial_eligible: cls.is_trial_eligible || false, max_trials_allowed: cls.max_trials_allowed || 2,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_name || !form.start_time || form.days.length === 0) return;
    setSubmitting(true);
    try {
      const basePayload = {
        class_name: form.class_name,
        start_time: form.start_time,
        end_time: form.end_time,
        instructor: form.instructor,
        location: form.location,
        linked_program_id: form.linked_program_id,
        belt_level: form.belt_level,
        is_active: form.is_active,
        is_trial_eligible: form.is_trial_eligible,
        max_trials_allowed: form.max_trials_allowed,
      };
      if (editing) {
        await base44.entities.ClassSchedule.update(editing.id, { ...basePayload, day_of_week: form.days[0] });
      } else {
        const records = form.days.map(day => ({ ...basePayload, day_of_week: day }));
        await base44.entities.ClassSchedule.bulkCreate(records);
      }
      setShowForm(false);
      resetForm();
      loadClasses();
    } catch (e) {
      alert("Failed to save class: " + e.message);
    }
    setSubmitting(false);
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const getProgramName = (programId) => {
    const prog = programs.find(p => p.id === programId);
    return prog?.program_name || "";
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class?")) return;
    try {
      await base44.entities.ClassSchedule.delete(id);
      loadClasses();
    } catch (e) { alert("Delete failed"); }
  };

  const toggleTrialEligible = async (cls) => {
    try {
      await base44.entities.ClassSchedule.update(cls.id, { is_trial_eligible: !cls.is_trial_eligible });
      loadClasses();
    } catch (e) { console.error(e); }
  };

  const toggleActive = async (cls) => {
    try {
      await base44.entities.ClassSchedule.update(cls.id, { is_active: !cls.is_active });
      loadClasses();
    } catch (e) { console.error(e); }
  };

  const grouped = DAYS_OF_WEEK.map((day) => ({
    day,
    items: classes.filter((c) => c.day_of_week === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Weekly Training</p>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowRankSettings(true)} className="flex items-center gap-2 px-4 py-2.5 border border-[#A8A9AD]/30 text-[#A8A9AD] font-bold text-sm tracking-wide uppercase hover:text-white hover:border-[#C9A84C]/50 transition-colors">
            <Settings size={16} /> Rank Levels
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
            <Plus size={18} /> Add Class
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.day}>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-3">
                <span className="text-[#C9A84C]">{group.day}</span>
                <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                <span className="text-sm text-[#A8A9AD] font-normal">{group.items.length}</span>
              </h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-[#A8A9AD] pl-4">No classes scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {group.items.map((cls) => (
                    <div key={cls.id} className={`border p-4 flex items-center gap-4 ${cls.is_active === false ? "border-[#A8A9AD]/10 opacity-50" : "border-[#A8A9AD]/20"}`}>
                      <div className="flex items-center gap-2 text-sm text-[#C9A84C] w-32 shrink-0">
                        <Clock size={14} />
                        {formatTime(cls.start_time)}{cls.end_time ? ` – ${formatTime(cls.end_time)}` : ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cls.class_name}</p>
                        <p className="text-xs text-[#A8A9AD]">
                          {cls.linked_program_id && <span className="text-[#C9A84C]">{getProgramName(cls.linked_program_id)}</span>}
                          {cls.instructor && ` · ${cls.instructor}`}
                          {cls.belt_level && ` · ${cls.belt_level}`}
                          {cls.location && ` · ${cls.location}`}
                          {cls.is_trial_eligible && ` · Trial Eligible`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleTrialEligible(cls)} className={`text-xs transition-colors ${cls.is_trial_eligible ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`}>
                          {cls.is_trial_eligible ? "Trial ✓" : "+ Trial"}
                        </button>
                        <button onClick={() => toggleActive(cls)} className="text-xs text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
                          {cls.is_active === false ? "Activate" : "Deactivate"}
                        </button>
                        <button onClick={() => handleEdit(cls)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(cls.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? "Edit Class" : "Add Class"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Class Name *</label>
                <input type="text" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program *</label>
                <select value={form.linked_program_id} onChange={(e) => setForm({ ...form, linked_program_id: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required>
                  <option value="">Select a program...</option>
                  {programs.filter(p => p.status !== "inactive").map((p) => <option key={p.id} value={p.id}>{p.program_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">
                  {editing ? "Day *" : "Days * (select multiple to create recurring classes)"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = form.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors ${selected ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"}`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                {!editing && form.days.length > 1 && (
                  <p className="text-xs text-[#C9A84C] mt-2">Will create {form.days.length} class records at the same time.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Start Time *</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Instructor</label>
                  <input type="text" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Belt Level (Rank Category)</label>
                <select value={form.belt_level} onChange={(e) => setForm({ ...form, belt_level: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {BELT_LEVELS.map((bl) => <option key={bl} value={bl}>{bl}</option>)}
                </select>
                <p className="text-xs text-[#A8A9AD] mt-2">Rank ranges for each level are configured per program via "Rank Levels".</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-white">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-[#C9A84C]" />
                  Active (visible on schedule)
                </label>
                <label className="flex items-center gap-2 text-sm text-white">
                  <input type="checkbox" checked={form.is_trial_eligible} onChange={(e) => setForm({ ...form, is_trial_eligible: e.target.checked })} className="accent-[#C9A84C]" />
                  Trial Eligible (visible in trial booking calendar)
                </label>
                {form.is_trial_eligible && (
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Max Trials Allowed</label>
                    <input type="number" value={form.max_trials_allowed} onChange={(e) => setForm({ ...form, max_trials_allowed: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" min="0" />
                  </div>
                )}
              </div>
              <button type="submit" disabled={submitting || form.days.length === 0} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <>{editing ? "Update" : `Create ${form.days.length > 1 ? `${form.days.length} Classes` : "Class"}`}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {showRankSettings && <RankLevelSettings onClose={() => setShowRankSettings(false)} />}
    </div>
  );
}