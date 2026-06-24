import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK, formatTime } from "@/lib/constants";
import { getScheduleBadge } from "@/lib/scheduleUtils";
import { Loader2, Plus, Pencil, Trash2, Clock, Settings, CalendarX } from "lucide-react";
import RankLevelSettings from "@/components/admin/schedule/RankLevelSettings";
import ClassScheduleForm from "@/components/admin/schedule/ClassScheduleForm";
import SeriesRosterManager from "@/components/admin/schedule/SeriesRosterManager";
import CancelOccurrenceModal from "@/components/admin/schedule/CancelOccurrenceModal";

export default function AdminSchedule() {
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRankSettings, setShowRankSettings] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rosterClass, setRosterClass] = useState(null);
  const [cancelClass, setCancelClass] = useState(null);
  const [cancellations, setCancellations] = useState([]);

  const loadClasses = useCallback(async () => {
    try {
      const [data, progs, cancels] = await Promise.all([
        base44.entities.ClassSchedule.list(),
        base44.entities.Program.list(),
        base44.entities.ClassCancellation.list().catch(() => []),
      ]);
      setClasses(data);
      setPrograms(progs);
      setCancellations(cancels);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const handleEdit = (cls) => {
    setEditing(cls);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const getProgramNames = (cls) => {
    const ids = cls.linked_program_ids ? cls.linked_program_ids.split(",").filter(Boolean) : cls.linked_program_id ? [cls.linked_program_id] : [];
    return ids.map(id => {
      const prog = programs.find(p => p.id === id);
      return prog?.program_name || "";
    }).filter(Boolean).join(", ");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class?")) return;
    try {
      await base44.entities.ClassSchedule.delete(id);
      await base44.entities.ClassCustomDate.deleteMany({ class_id: id }).catch(() => {});
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

  const grouped = [...DAYS_OF_WEEK, "Custom"].map((day) => ({
    day,
    items: classes.filter((c) => (c.day_of_week || "Custom") === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  }));

  const dayLabel = (day) => day === "Custom" ? "Pop-Up / Custom Dates" : day;

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
          <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
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
                <span className="text-[#C9A84C]">{dayLabel(group.day)}</span>
                <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                <span className="text-sm text-[#A8A9AD] font-normal">{group.items.length}</span>
              </h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-[#A8A9AD] pl-4">No classes scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {group.items.map((cls) => {
                    const badge = getScheduleBadge(cls);
                    return (
                      <div key={cls.id} className={`border p-4 flex items-center gap-4 ${cls.is_active === false ? "border-[#A8A9AD]/10 opacity-50" : "border-[#A8A9AD]/20"}`}>
                        <div className="flex items-center gap-2 text-sm text-[#C9A84C] w-32 shrink-0">
                          <Clock size={14} />
                          {formatTime(cls.start_time)}{cls.end_time ? ` – ${formatTime(cls.end_time)}` : ""}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{cls.class_name}</p>
                            {badge && (
                              <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 font-bold" style={{ color: badge.color, border: `1px solid ${badge.color}40` }}>{badge.label}</span>
                            )}
                          </div>
                          <p className="text-xs text-[#A8A9AD]">
                            {(cls.linked_program_ids || cls.linked_program_id) && <span className="text-[#C9A84C]">{getProgramNames(cls)}</span>}
                            {cls.instructor && ` · ${cls.instructor}`}
                            {cls.belt_level && ` · ${cls.belt_level}`}
                            {cls.location && ` · ${cls.location}`}
                            {cls.is_trial_eligible && ` · Trial Eligible`}
                          </p>
                          {cls.schedule_type === "Limited-Series" && cls.series_start_date && (
                            <p className="text-xs text-[#C53030] mt-1">Series: {new Date(cls.series_start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {new Date(cls.series_end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => toggleTrialEligible(cls)} className={`text-xs transition-colors ${cls.is_trial_eligible ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`}>
                            {cls.is_trial_eligible ? "Trial ✓" : "+ Trial"}
                          </button>
                          <button onClick={() => toggleActive(cls)} className="text-xs text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
                            {cls.is_active === false ? "Activate" : "Deactivate"}
                          </button>
                          {cls.schedule_type === "Limited-Series" && <button onClick={() => setRosterClass(cls)} className="text-xs text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">Roster</button>}
                          {cls.schedule_type !== "Custom-Dates" && <button onClick={() => setCancelClass(cls)} className="text-xs text-[#A8A9AD] hover:text-red-400 transition-colors flex items-center gap-1"><CalendarX size={12} /> Cancel Date</button>}
                          <button onClick={() => handleEdit(cls)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(cls.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClassScheduleForm
          editing={editing}
          programs={programs}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadClasses(); }}
        />
      )}

      {showRankSettings && <RankLevelSettings onClose={() => setShowRankSettings(false)} />}
      {rosterClass && <SeriesRosterManager cls={rosterClass} onClose={() => setRosterClass(null)} />}
      {cancelClass && <CancelOccurrenceModal cls={cancelClass} customDates={[]} cancellations={cancellations} onClose={() => setCancelClass(null)} onChanged={loadClasses} />}
    </div>
  );
}