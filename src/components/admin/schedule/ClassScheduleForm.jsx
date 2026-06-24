import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { SCHEDULE_TYPES, WEEK_OCCURRENCES } from "@/lib/scheduleUtils";
import { Loader2, X, Plus, Calendar } from "lucide-react";

const BELT_LEVELS = ["All Belts", "Beginner", "Intermediate", "Advanced", "Black Belt"];

const EMPTY_FORM = {
  class_name: "",
  schedule_type: "Weekly",
  days: ["Monday"],
  pattern_weeks: [],
  series_start_date: "",
  series_end_date: "",
  custom_dates: [],
  monthly_pattern: [],
  start_time: "",
  end_time: "",
  instructor: "",
  location: "",
  linked_program_ids: [],
  belt_level: "All Belts",
  is_active: true,
  is_trial_eligible: false,
  max_trials_allowed: 2,
  require_full_series_signup: false,
};

export default function ClassScheduleForm({ editing, programs, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [newDateInput, setNewDateInput] = useState("");
  const [newPatternWeek, setNewPatternWeek] = useState("1");
  const [newPatternDay, setNewPatternDay] = useState("Friday");

  useEffect(() => {
    if (editing) {
      (async () => {
        const customDates = editing.schedule_type === "Custom-Dates"
          ? await base44.entities.ClassCustomDate.filter({ class_id: editing.id }).catch(() => [])
          : [];
        setForm({
          class_name: editing.class_name || "",
          schedule_type: editing.schedule_type || "Weekly",
          days: [editing.day_of_week || "Monday"],
          pattern_weeks: editing.pattern_weeks ? editing.pattern_weeks.split(",").filter(Boolean) : [],
          series_start_date: editing.series_start_date || "",
          series_end_date: editing.series_end_date || "",
          custom_dates: customDates.map(cd => cd.specific_date).sort(),
          monthly_pattern: editing.monthly_pattern ? editing.monthly_pattern.split(",").filter(Boolean) : [],
          start_time: editing.start_time || "",
          end_time: editing.end_time || "",
          instructor: editing.instructor || "",
          location: editing.location || "",
          linked_program_ids: editing.linked_program_ids ? editing.linked_program_ids.split(",").filter(Boolean) : editing.linked_program_id ? [editing.linked_program_id] : [],
          belt_level: editing.belt_level || "All Belts",
          is_active: editing.is_active !== false,
          is_trial_eligible: editing.is_trial_eligible || false,
          max_trials_allowed: editing.max_trials_allowed || 2,
          require_full_series_signup: editing.require_full_series_signup || false,
        });
      })();
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing]);

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const toggleProgram = (programId) => {
    setForm(prev => ({
      ...prev,
      linked_program_ids: prev.linked_program_ids.includes(programId)
        ? prev.linked_program_ids.filter(id => id !== programId)
        : [...prev.linked_program_ids, programId],
    }));
  };

  const togglePatternWeek = (week) => {
    setForm(prev => {
      if (prev.schedule_type === "Monthly") {
        return { ...prev, pattern_weeks: prev.pattern_weeks.includes(week) ? [] : [week] };
      }
      return {
        ...prev,
        pattern_weeks: prev.pattern_weeks.includes(week)
          ? prev.pattern_weeks.filter(w => w !== week)
          : [...prev.pattern_weeks, week],
      };
    });
  };

  const addCustomDate = () => {
    if (!newDateInput) return;
    setForm(prev => ({
      ...prev,
      custom_dates: [...new Set([...prev.custom_dates, newDateInput])].sort(),
    }));
    setNewDateInput("");
  };

  const removeCustomDate = (date) => {
    setForm(prev => ({
      ...prev,
      custom_dates: prev.custom_dates.filter(d => d !== date),
    }));
  };

  const addMonthlyPattern = () => {
    const entry = `${newPatternWeek}-${newPatternDay}`;
    if (!form.monthly_pattern.includes(entry)) {
      setForm(prev => ({ ...prev, monthly_pattern: [...prev.monthly_pattern, entry] }));
    }
  };

  const removeMonthlyPattern = (entry) => {
    setForm(prev => ({ ...prev, monthly_pattern: prev.monthly_pattern.filter(p => p !== entry) }));
  };

  const formatPatternLabel = (entry) => {
    const [week, day] = entry.split("-");
    const weekLabel = WEEK_OCCURRENCES.find(w => w.value === week)?.label || week;
    return `${weekLabel} ${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_name || !form.start_time || form.linked_program_ids.length === 0) return;

    if (form.schedule_type === "Custom-Dates") {
      if (form.custom_dates.length === 0) return;
    } else if (form.schedule_type === "Monthly Pattern") {
      if (form.monthly_pattern.length === 0) return;
    } else {
      if (form.days.length === 0) return;
      if ((form.schedule_type === "Bi-Weekly" || form.schedule_type === "Monthly") && form.pattern_weeks.length === 0) return;
      if (form.schedule_type === "Limited-Series" && (!form.series_start_date || !form.series_end_date)) return;
    }

    setSubmitting(true);
    try {
      const basePayload = {
        class_name: form.class_name,
        schedule_type: form.schedule_type,
        pattern_weeks: form.pattern_weeks.join(","),
        monthly_pattern: form.monthly_pattern.join(","),
        series_start_date: form.series_start_date || null,
        series_end_date: form.series_end_date || null,
        start_time: form.start_time,
        end_time: form.end_time,
        instructor: form.instructor,
        location: form.location,
        linked_program_id: form.linked_program_ids[0] || "",
        linked_program_ids: form.linked_program_ids.join(","),
        belt_level: form.belt_level,
        is_active: form.is_active,
        is_trial_eligible: form.is_trial_eligible,
        max_trials_allowed: form.max_trials_allowed,
        require_full_series_signup: form.require_full_series_signup,
      };

      if (form.schedule_type === "Custom-Dates") {
        const classPayload = { ...basePayload, day_of_week: "Custom" };
        let classId;
        if (editing) {
          classId = editing.id;
          await base44.entities.ClassSchedule.update(classId, classPayload);
          await base44.entities.ClassCustomDate.deleteMany({ class_id: classId }).catch(() => {});
        } else {
          const created = await base44.entities.ClassSchedule.create(classPayload);
          classId = created.id;
        }
        const dateRecords = form.custom_dates.map(date => ({
          class_id: classId,
          class_name: form.class_name,
          specific_date: date,
          specific_time: form.start_time,
        }));
        if (dateRecords.length > 0) {
          await base44.entities.ClassCustomDate.bulkCreate(dateRecords);
        }
      } else if (form.schedule_type === "Monthly Pattern") {
        const classPayload = { ...basePayload, day_of_week: "Custom" };
        if (editing) {
          await base44.entities.ClassSchedule.update(editing.id, classPayload);
        } else {
          await base44.entities.ClassSchedule.create(classPayload);
        }
      } else {
        if (editing) {
          await base44.entities.ClassSchedule.update(editing.id, { ...basePayload, day_of_week: form.days[0] });
        } else {
          const records = form.days.map(day => ({ ...basePayload, day_of_week: day }));
          await base44.entities.ClassSchedule.bulkCreate(records);
        }
      }
      onSaved();
    } catch (e) {
      alert("Failed to save class: " + e.message);
    }
    setSubmitting(false);
  };

  const needsDays = form.schedule_type !== "Custom-Dates" && form.schedule_type !== "Monthly Pattern";
  const needsPattern = form.schedule_type === "Bi-Weekly" || form.schedule_type === "Monthly";
  const needsSeriesDates = form.schedule_type === "Limited-Series";
  const isCustomDates = form.schedule_type === "Custom-Dates";
  const isMonthlyPattern = form.schedule_type === "Monthly Pattern";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{editing ? "Edit Class" : "Add Class"}</h2>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Class Name *</label>
            <input type="text" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program(s) *</label>
            <div className="flex flex-wrap gap-2">
              {programs.filter(p => p.status !== "inactive").map((p) => {
                const selected = form.linked_program_ids.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => toggleProgram(p.id)}
                    className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors ${selected ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"}`}
                  >
                    {p.program_name}
                  </button>
                );
              })}
            </div>
            {form.linked_program_ids.length === 0 && <p className="text-xs text-red-400 mt-1">Select at least one program</p>}
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Frequency *</label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_TYPES.map((type) => {
                const selected = form.schedule_type === type;
                return (
                  <button key={type} type="button" onClick={() => setForm({ ...form, schedule_type: type })}
                    className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors ${selected ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"}`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {needsDays && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">
                {editing ? "Day *" : "Day(s) * (select multiple to create recurring classes)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const selected = form.days.includes(day);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
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
          )}

          {needsPattern && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">
                {form.schedule_type === "Monthly" ? "Which Week? * (single select)" : "Which Weeks? * (e.g., 1st & 3rd)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEK_OCCURRENCES.map((week) => {
                  const selected = form.pattern_weeks.includes(week.value);
                  return (
                    <button key={week.value} type="button" onClick={() => togglePatternWeek(week.value)}
                      className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors ${selected ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"}`}
                    >
                      {week.label}
                    </button>
                  );
                })}
              </div>
              {form.pattern_weeks.length === 0 && <p className="text-xs text-red-400 mt-1">Select at least one week</p>}
            </div>
          )}

          {needsSeriesDates && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Series Start *</label>
                  <input type="date" value={form.series_start_date} onChange={(e) => setForm({ ...form, series_start_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Series End *</label>
                  <input type="date" value={form.series_end_date} onChange={(e) => setForm({ ...form, series_end_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white bg-[#C9A84C]/5 border border-[#C9A84C]/20 p-3">
                <input type="checkbox" checked={form.require_full_series_signup} onChange={(e) => setForm({ ...form, require_full_series_signup: e.target.checked })} className="accent-[#C9A84C] w-4 h-4" />
                <div>
                  <span className="font-medium">Require full series sign-up</span>
                  <p className="text-xs text-[#A8A9AD] mt-0.5">Students who join are automatically enrolled in all dates in this series.</p>
                </div>
              </label>
            </>
          )}

          {isCustomDates && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Specific Dates * (tap to add)</label>
              <div className="flex gap-2 mb-3">
                <input type="date" value={newDateInput} onChange={(e) => setNewDateInput(e.target.value)} className="time-picker-light flex-1 bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                <button type="button" onClick={addCustomDate} className="px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add
                </button>
              </div>
              {form.custom_dates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.custom_dates.map((date) => (
                    <div key={date} className="flex items-center gap-2 px-3 py-2 border border-[#C9A84C]/30 bg-[#C9A84C]/5">
                      <Calendar size={12} className="text-[#C9A84C]" />
                      <span className="text-xs text-white">{new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <button type="button" onClick={() => removeCustomDate(date)} className="text-[#A8A9AD] hover:text-red-400"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-400">Add at least one date</p>
              )}
            </div>
          )}

          {isMonthlyPattern && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Monthly Pattern * (e.g., 1st Friday, 1st & 3rd Monday)</label>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <select value={newPatternWeek} onChange={(e) => setNewPatternWeek(e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {WEEK_OCCURRENCES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
                <select value={newPatternDay} onChange={(e) => setNewPatternDay(e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="button" onClick={addMonthlyPattern} className="px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add Rule
                </button>
              </div>
              {form.monthly_pattern.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.monthly_pattern.map((entry) => (
                    <div key={entry} className="flex items-center gap-2 px-3 py-2 border border-[#6B21A8]/50 bg-[#6B21A8]/10">
                      <Calendar size={12} className="text-[#A78BFA]" />
                      <span className="text-xs text-white">{formatPatternLabel(entry)}</span>
                      <button type="button" onClick={() => removeMonthlyPattern(entry)} className="text-[#A8A9AD] hover:text-red-400"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-400">Add at least one pattern rule</p>
              )}
              <p className="text-xs text-[#A8A9AD] mt-2">Optional: set a date range below to limit when this pattern is active.</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Active From (optional)</label>
                  <input type="date" value={form.series_start_date} onChange={(e) => setForm({ ...form, series_start_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Active Until (optional)</label>
                  <input type="date" value={form.series_end_date} onChange={(e) => setForm({ ...form, series_end_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Start Time *</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
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
            <p className="text-xs text-[#A8A9AD] mt-2">Rank ranges for each level are configured per program via "Rank Levels" and determine student eligibility on their schedule.</p>
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

          <button type="submit" disabled={submitting} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <>{editing ? "Update" : `Create ${form.days.length > 1 && needsDays ? `${form.days.length} Classes` : "Class"}`}</>}
          </button>
        </form>
      </div>
    </div>
  );
}