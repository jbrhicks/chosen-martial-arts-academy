import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Loader2, Plus, X, Pencil, Trash2, Clock } from "lucide-react";

const AGE_GROUPS = ["Kids (4-7)", "Youth (8-12)", "Teens (13-17)", "Adults (18+)", "All Ages"];
const BELT_LEVELS = ["All Belts", "Beginner", "Intermediate", "Advanced", "Black Belt"];

export default function AdminSchedule() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    class_name: "", day_of_week: "Monday", start_time: "", end_time: "",
    instructor: "", location: "", age_group: "All Ages", belt_level: "All Belts", is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const data = await base44.entities.ClassSchedule.list();
      setClasses(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const resetForm = () => {
    setForm({ class_name: "", day_of_week: "Monday", start_time: "", end_time: "", instructor: "", location: "", age_group: "All Ages", belt_level: "All Belts", is_active: true });
    setEditing(null);
  };

  const handleEdit = (cls) => {
    setEditing(cls);
    setForm({
      class_name: cls.class_name || "", day_of_week: cls.day_of_week || "Monday",
      start_time: cls.start_time || "", end_time: cls.end_time || "",
      instructor: cls.instructor || "", location: cls.location || "",
      age_group: cls.age_group || "All Ages", belt_level: cls.belt_level || "All Belts",
      is_active: cls.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_name || !form.start_time) return;
    setSubmitting(true);
    try {
      const payload = { ...form, is_active: form.is_active };
      if (editing) {
        await base44.entities.ClassSchedule.update(editing.id, payload);
      } else {
        await base44.entities.ClassSchedule.create(payload);
      }
      setShowForm(false);
      resetForm();
      loadClasses();
    } catch (e) {
      alert("Failed to save class: " + e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class?")) return;
    try {
      await base44.entities.ClassSchedule.delete(id);
      loadClasses();
    } catch (e) { alert("Delete failed"); }
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
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={18} /> Add Class
        </button>
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
                        {cls.start_time}{cls.end_time ? ` – ${cls.end_time}` : ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cls.class_name}</p>
                        <p className="text-xs text-[#A8A9AD]">
                          {cls.instructor && `${cls.instructor}`}
                          {cls.age_group && ` · ${cls.age_group}`}
                          {cls.belt_level && ` · ${cls.belt_level}`}
                          {cls.location && ` · ${cls.location}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Day *</label>
                  <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {DAYS_OF_WEEK.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Age Group</label>
                  <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {AGE_GROUPS.map((ag) => <option key={ag} value={ag}>{ag}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Belt Level</label>
                  <select value={form.belt_level} onChange={(e) => setForm({ ...form, belt_level: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {BELT_LEVELS.map((bl) => <option key={bl} value={bl}>{bl}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-[#C9A84C]" />
                Active (visible on schedule)
              </label>
              <button type="submit" disabled={submitting} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <>{editing ? "Update" : "Create"} Class</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}