import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { DAYS_OF_WEEK, BELT_RANKS, getRankIndex, formatTime } from "@/lib/constants";
import { classOccursOnDate, getScheduleBadge, getSeriesCountdown, getNextOccurrence, isClassCancelledOnDate, getActiveBlackout } from "@/lib/scheduleUtils";
import PortalClassCard, { getProgramColor } from "@/components/portal/schedule/PortalClassCard";
import { Loader2, CalendarDays, Clock, ChevronRight, ChevronLeft, Filter, AlertCircle } from "lucide-react";

const BELT_LEVEL_MIN_RANK = {
  "All Belts": 0,
  "Beginner": 0,
  "Intermediate": 4,
  "Advanced": 10,
  "Black Belt": 11,
};

export default function Schedule() {
  const { user } = useAuth();
  const { activeProfile } = useFamily();
  const [classes, setClasses] = useState([]);
  const [customDates, setCustomDates] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);

  const profile = activeProfile || user;
  const userRankIndex = getRankIndex(profile?.belt_rank);

  useEffect(() => {
    const load = async () => {
      const [allClasses, allCustomDates, enrolls, allPrograms, allCancellations, allBlackouts] = await Promise.all([
        base44.entities.ClassSchedule.list().catch(() => []),
        base44.entities.ClassCustomDate.list().catch(() => []),
        base44.entities.Enrollment.filter({ user_id: profile?.id || user?.id, status: "active" }).catch(() => []),
        base44.entities.Program.list().catch(() => []),
        base44.entities.ClassCancellation.list().catch(() => []),
        base44.entities.BlackoutDate.list().catch(() => []),
      ]);
      setClasses(allClasses.filter(c => c.is_active !== false));
      setCustomDates(allCustomDates);
      setEnrollments(enrolls);
      setPrograms(allPrograms);
      setCancellations(allCancellations);
      setBlackouts(allBlackouts);
      setLoading(false);
    };
    load();
  }, [user, profile]);

  const enrolledPrograms = useMemo(() => {
    return enrollments
      .map(e => programs.find(p => p.id === e.program_id || p.program_name === e.program))
      .filter(Boolean);
  }, [enrollments, programs]);

  const getProgram = (cls) => {
    const ids = cls.linked_program_ids ? cls.linked_program_ids.split(",").filter(Boolean) : cls.linked_program_id ? [cls.linked_program_id] : [];
    return programs.find(p => p.id === ids[0]);
  };

  const isEligible = (cls) => {
    if (cls.belt_level === "All Belts") return true;
    if (cls.belt_level === "Custom") {
      const belts = (cls.custom_eligible_belts || "").split(",").filter(Boolean);
      return belts.includes(profile?.belt_rank);
    }
    if (userRankIndex === -1) return false;
    if (cls.belt_level === "Black Belt") return userRankIndex >= getRankIndex("1st Degree Black Belt");
    const prog = getProgram(cls);
    const levelKey = cls.belt_level.toLowerCase();
    if (prog && (prog[`${levelKey}_min_rank`] || prog[`${levelKey}_max_rank`])) {
      const minIdx = prog[`${levelKey}_min_rank`] ? getRankIndex(prog[`${levelKey}_min_rank`]) : 0;
      const maxIdx = prog[`${levelKey}_max_rank`] ? getRankIndex(prog[`${levelKey}_max_rank`]) : BELT_RANKS.length - 1;
      return userRankIndex >= minIdx && userRankIndex <= maxIdx;
    }
    const fallbackMin = BELT_LEVEL_MIN_RANK[cls.belt_level] ?? 0;
    return userRankIndex >= fallbackMin;
  };

  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return DAYS_OF_WEEK.map((day, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return { day, date };
    });
  }, [weekStart]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekLabel = useMemo(() => {
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (weekOffset === 0) return `This Week · ${fmt(start)} – ${fmt(end)}`;
    if (weekOffset === 1) return `Next Week · ${fmt(start)} – ${fmt(end)}`;
    if (weekOffset === -1) return `Last Week · ${fmt(start)} – ${fmt(end)}`;
    return `${fmt(start)} – ${fmt(end)}`;
  }, [weekDays, weekOffset]);

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      if (programFilter !== "all") {
        const prog = getProgram(cls);
        if (!prog || prog.id !== programFilter) return false;
      }
      return weekDays.some(({ date }) => classOccursOnDate(cls, date, customDates));
    });
  }, [classes, programFilter, weekDays, customDates, programs]);

  const grouped = useMemo(() => {
    return weekDays.map(({ day, date }) => {
      const dayClasses = filteredClasses
        .filter(cls => classOccursOnDate(cls, date, customDates) && !isClassCancelledOnDate(cls, date, cancellations))
        .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
      return { day, date, items: dayClasses };
    });
  }, [filteredClasses, weekDays, customDates, cancellations]);

  const nextClass = useMemo(() => {
    const now = new Date();
    let best = null;
    let bestDate = null;
    for (const cls of classes) {
      if (!isEligible(cls)) continue;
      if (programFilter !== "all") {
        const prog = getProgram(cls);
        if (!prog || prog.id !== programFilter) continue;
      }
      const next = getNextOccurrence(cls, now, customDates);
      if (next && !isClassCancelledOnDate(cls, next, cancellations) && (!bestDate || next < bestDate)) {
        best = cls;
        bestDate = next;
      }
    }
    return best ? { cls: best, date: bestDate } : null;
  }, [classes, programFilter, customDates, userRankIndex, cancellations]);

  const activeBlackout = getActiveBlackout(new Date(), blackouts);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Training Calendar</p>
        <h1 className="text-3xl font-bold mb-2">My Schedule</h1>
        <p className="text-sm text-[#A8A9AD]">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      {activeBlackout && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">Academy Closed: {activeBlackout.public_message}</p>
            <p className="text-xs text-[#A8A9AD]">{new Date(activeBlackout.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })} through {new Date(activeBlackout.end_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
          </div>
        </div>
      )}

      {nextClass && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center shrink-0">
            <CalendarDays size={22} className="text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] mb-1">Your Next Class</p>
            <p className="text-sm font-bold truncate">{nextClass.cls.class_name}</p>
            <p className="text-xs text-[#A8A9AD] flex items-center gap-2 mt-1">
              <Clock size={11} /> {nextClass.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at {formatTime(nextClass.cls.start_time)}
              {nextClass.cls.instructor && ` • ${nextClass.cls.instructor}`}
            </p>
          </div>
          <ChevronRight size={20} className="text-[#A8A9AD] shrink-0" />
        </div>
      )}

      {enrolledPrograms.length > 1 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-[#A8A9AD]" />
            <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Filter by Program</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setProgramFilter("all")}
              className={`px-4 py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${programFilter === "all" ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"}`}
            >
              All Programs
            </button>
            {enrolledPrograms.map(p => {
              const color = getProgramColor(p.id, programs);
              const active = programFilter === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProgramFilter(p.id)}
                  className="px-4 py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-colors border"
                  style={active ? { background: color.accent, color: "#000", borderColor: color.accent } : { borderColor: "rgba(168,169,173,0.30)", color: "#A8A9AD" }}
                >
                  {p.program_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border border-[#A8A9AD]/20 p-3">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold tracking-wide">{weekLabel}</span>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
      {weekOffset !== 0 && (
        <button onClick={() => setWeekOffset(0)} className="text-xs text-[#C9A84C] hover:underline -mt-2">
          Back to This Week
        </button>
      )}

      {grouped.every(g => g.items.length === 0) ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No classes scheduled for this week.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => {
            const isToday = group.date.getTime() === today.getTime();
            return group.items.length > 0 ? (
              <div key={group.day + group.date.toISOString()}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
                  <span className={isToday ? "text-[#C9A84C]" : ""}>
                    {group.day} · {group.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {isToday ? " • Today" : ""}
                  </span>
                  <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                  <span className="text-xs text-[#A8A9AD] font-normal">{group.items.length} class{group.items.length > 1 ? "es" : ""}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map(cls => (
                    <PortalClassCard key={cls.id} cls={cls} program={getProgram(cls)} programs={programs} eligible={isEligible(cls)} isToday={isToday} date={group.date} customDates={customDates} />
                  ))}
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}