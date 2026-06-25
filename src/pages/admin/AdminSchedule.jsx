import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK, formatTime, AGE_PRESETS } from "@/lib/constants";
import { getScheduleBadge, getActiveBlackout, getClassColor } from "@/lib/scheduleUtils";
import { Loader2, Plus, Pencil, Trash2, Clock, Settings, CalendarX, LayoutGrid, List, Ban, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import RankLevelSettings from "@/components/admin/schedule/RankLevelSettings";
import ClassScheduleForm from "@/components/admin/schedule/ClassScheduleForm";
import SeriesRosterManager from "@/components/admin/schedule/SeriesRosterManager";
import CancelOccurrenceModal from "@/components/admin/schedule/CancelOccurrenceModal";
import BlackoutDateManager from "@/components/admin/schedule/BlackoutDateManager";
import ExceptionHandlerModal from "@/components/admin/schedule/ExceptionHandlerModal";
import ScheduleCalendarGrid from "@/components/admin/schedule/ScheduleCalendarGrid";

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function AdminSchedule() {
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [customDates, setCustomDates] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({ instructor: "", program: "", room: "" });
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  const [showForm, setShowForm] = useState(false);
  const [showRankSettings, setShowRankSettings] = useState(false);
  const [showBlackouts, setShowBlackouts] = useState(false);
  const [editing, setEditing] = useState(null);
  const [exceptionClass, setExceptionClass] = useState(null);
  const [exceptionDate, setExceptionDate] = useState(null);
  const [rosterClass, setRosterClass] = useState(null);
  const [cancelClass, setCancelClass] = useState(null);

  const loadClasses = useCallback(async () => {
    try {
      const [data, progs, cancels, cd, bl, exc] = await Promise.all([
        base44.entities.ClassSchedule.list(),
        base44.entities.Program.list(),
        base44.entities.ClassCancellation.list().catch(() => []),
        base44.entities.ClassCustomDate.list().catch(() => []),
        base44.entities.BlackoutDate.list().catch(() => []),
        base44.entities.ScheduleException.list().catch(() => []),
      ]);
      setClasses(data);
      setPrograms(progs);
      setCancellations(cancels);
      setCustomDates(cd);
      setBlackouts(bl);
      setExceptions(exc);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeBlackout = getActiveBlackout(today, blackouts);

  const instructors = [...new Set(classes.map(c => c.instructor).filter(Boolean))].sort();
  const rooms = [...new Set(classes.map(c => c.room).filter(Boolean))].sort();

  const filteredClasses = classes.filter(cls => {
    if (filters.instructor && cls.instructor !== filters.instructor) return false;
    if (filters.program) {
      const ids = cls.linked_program_ids ? cls.linked_program_ids.split(",") : cls.linked_program_id ? [cls.linked_program_id] : [];
      if (!ids.includes(filters.program)) return false;
    }
    if (filters.room && (cls.room || "") !== filters.room) return false;
    return true;
  });

  const handleEdit = (cls, date = null) => {
    const isRecurring = ["Weekly", "Bi-Weekly", "Monthly", "Limited-Series"].includes(cls.schedule_type);
    if (isRecurring) {
      setExceptionClass(cls);
      setExceptionDate(date);
    } else {
      setEditing(cls);
      setShowForm(true);
    }
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
    items: filteredClasses.filter((c) => (c.day_of_week || "Custom") === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  }));

  const dayLabel = (day) => day === "Custom" ? "Pop-Up / Custom Dates" : day;

  return (
    <div className="space-y-6">
      {activeBlackout && (
        <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/5">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">Academy Closed: {activeBlackout.public_message}</p>
            <p className="text-xs text-[#A8A9AD]">{new Date(activeBlackout.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })} through {new Date(activeBlackout.end_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Weekly Training</p>
          <h1 className="text-3xl font-bold">Master Schedule</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 border border-[#A8A9AD]/20 p-1">
            <button onClick={() => setView("list")} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors ${view === "list" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
              <List size={14} /> List
            </button>
            <button onClick={() => setView("grid")} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors ${view === "grid" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
              <LayoutGrid size={14} /> Grid
            </button>
          </div>
          <button onClick={() => setShowBlackouts(true)} className="flex items-center gap-2 px-4 py-2.5 border border-[#A8A9AD]/30 text-[#A8A9AD] font-bold text-sm tracking-wide uppercase hover:text-white hover:border-red-500/50 transition-colors">
            <Ban size={16} /> Blackouts
          </button>
          <button onClick={() => setShowRankSettings(true)} className="flex items-center gap-2 px-4 py-2.5 border border-[#A8A9AD]/30 text-[#A8A9AD] font-bold text-sm tracking-wide uppercase hover:text-white hover:border-[#C9A84C]/50 transition-colors">
            <Settings size={16} /> Rank Levels
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
            <Plus size={18} /> Add Class
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={filters.instructor} onChange={e => setFilters({ ...filters, instructor: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
          <option value="">All Instructors</option>
          {instructors.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={filters.program} onChange={e => setFilters({ ...filters, program: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
          <option value="">All Programs</option>
          {programs.filter(p => p.status !== "inactive").map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
        </select>
        <select value={filters.room} onChange={e => setFilters({ ...filters, room: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
          <option value="">All Rooms</option>
          {rooms.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(filters.instructor || filters.program || filters.room) && (
          <button onClick={() => setFilters({ instructor: "", program: "", room: "" })} className="text-xs text-[#A8A9AD] hover:text-white">Clear Filters</button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs text-[#A8A9AD]">
        <span className="tracking-widest uppercase">Legend:</span>
        {AGE_PRESETS.map(p => (
          <div key={p.value} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : view === "grid" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 text-[#A8A9AD] hover:text-white"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-white">{weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 text-[#A8A9AD] hover:text-white"><ChevronRight size={18} /></button>
            <button onClick={() => setWeekStart(getWeekStart(new Date()))} className="text-xs text-[#C9A84C] hover:text-[#E0C97A] ml-2">Today</button>
          </div>
          <ScheduleCalendarGrid
            classes={filteredClasses}
            customDates={customDates}
            cancellations={cancellations}
            exceptions={exceptions}
            blackouts={blackouts}
            weekStart={weekStart}
            onClassClick={(cls, date) => handleEdit(cls, date)}
          />
        </div>
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
                    const color = getClassColor(cls);
                    return (
                      <div key={cls.id} className={`border p-4 flex items-center gap-4 ${cls.is_active === false ? "border-[#A8A9AD]/10 opacity-50" : "border-[#A8A9AD]/20"}`} style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
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
                            {cls.age_preset && cls.age_preset !== "All Ages" && (
                              <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 font-bold" style={{ color: color, border: `1px solid ${color}40` }}>{cls.age_preset}</span>
                            )}
                          </div>
                          <p className="text-xs text-[#A8A9AD]">
                            {(cls.linked_program_ids || cls.linked_program_id) && <span className="text-[#C9A84C]">{getProgramNames(cls)}</span>}
                            {cls.instructor && ` · ${cls.instructor}`}
                            {cls.belt_level && ` · ${cls.belt_level}`}
                            {cls.room && ` · ${cls.room}`}
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
      {showBlackouts && <BlackoutDateManager onClose={() => setShowBlackouts(false)} onChanged={loadClasses} />}
      {exceptionClass && (
        <ExceptionHandlerModal
          cls={exceptionClass}
          targetDate={exceptionDate}
          onClose={() => { setExceptionClass(null); setExceptionDate(null); }}
          onEditAll={() => {
            setEditing(exceptionClass);
            setExceptionClass(null);
            setExceptionDate(null);
            setShowForm(true);
          }}
          onChanged={loadClasses}
        />
      )}
      {rosterClass && <SeriesRosterManager cls={rosterClass} onClose={() => setRosterClass(null)} />}
      {cancelClass && <CancelOccurrenceModal cls={cancelClass} customDates={customDates} cancellations={cancellations} onClose={() => setCancelClass(null)} onChanged={loadClasses} />}
    </div>
  );
}