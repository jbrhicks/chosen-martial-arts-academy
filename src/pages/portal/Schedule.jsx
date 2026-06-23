import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { DAYS_OF_WEEK, BELT_RANKS, getRankIndex } from "@/lib/constants";
import PortalClassCard, { getProgramColor } from "@/components/portal/schedule/PortalClassCard";
import { Loader2, CalendarDays, Clock, ChevronRight, Filter } from "lucide-react";

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
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("All");

  const profile = activeProfile || user;
  const userRankIndex = getRankIndex(profile?.belt_rank);

  useEffect(() => {
    const load = async () => {
      const [allClasses, enrolls, allPrograms] = await Promise.all([
        base44.entities.ClassSchedule.list().catch(() => []),
        base44.entities.Enrollment.filter({ user_id: profile?.id || user?.id, status: "active" }).catch(() => []),
        base44.entities.Program.list().catch(() => []),
      ]);
      setClasses(allClasses.filter(c => c.is_active !== false));
      setEnrollments(enrolls);
      setPrograms(allPrograms);
      setLoading(false);
    };
    load();
  }, [user, profile]);

  const enrolledPrograms = useMemo(() => {
    return enrollments
      .map(e => programs.find(p => p.id === e.program_id || p.program_name === e.program))
      .filter(Boolean);
  }, [enrollments, programs]);

  const enrolledProgramIds = new Set(enrolledPrograms.map(p => p.id));

  const isEligible = (cls) => {
    const minRank = BELT_LEVEL_MIN_RANK[cls.belt_level] ?? 0;
    if (userRankIndex === -1) return cls.belt_level === "All Belts" || cls.belt_level === "Beginner";
    return userRankIndex >= minRank;
  };

  const getProgram = (cls) => programs.find(p => p.id === cls.linked_program_id);

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      if (programFilter !== "all") {
        const prog = getProgram(cls);
        if (!prog || prog.id !== programFilter) return false;
      }
      if (dayFilter !== "All" && cls.day_of_week !== dayFilter) return false;
      return true;
    });
  }, [classes, programFilter, dayFilter, programs]);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // Next upcoming class
  const nextClass = useMemo(() => {
    const now = new Date();
    const todayIdx = DAYS_OF_WEEK.indexOf(todayName);
    let best = null;
    let bestDiff = Infinity;
    for (const cls of classes) {
      if (!isEligible(cls)) continue;
      if (programFilter !== "all") {
        const prog = getProgram(cls);
        if (!prog || prog.id !== programFilter) continue;
      }
      const dayIdx = DAYS_OF_WEEK.indexOf(cls.day_of_week);
      if (dayIdx === -1) continue;
      const [h, m] = (cls.start_time || "00:00").split(":").map(Number);
      const classDate = new Date();
      let dayDiff = dayIdx - todayIdx;
      if (dayDiff < 0) dayDiff += 7;
      if (dayDiff === 0 && h * 60 + m <= now.getHours() * 60 + now.getMinutes()) dayDiff = 7;
      classDate.setDate(now.getDate() + dayDiff);
      classDate.setHours(h, m, 0, 0);
      const diff = classDate - now;
      if (diff < bestDiff) { bestDiff = diff; best = cls; }
    }
    return best;
  }, [classes, todayName, programFilter, userRankIndex]);

  const grouped = DAYS_OF_WEEK.map(day => ({
    day,
    items: filteredClasses.filter(c => c.day_of_week === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Training Calendar</p>
        <h1 className="text-3xl font-bold mb-2">My Schedule</h1>
        <p className="text-sm text-[#A8A9AD]">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      {/* Next Class Callout */}
      {nextClass && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center shrink-0">
            <CalendarDays size={22} className="text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] mb-1">Your Next Class</p>
            <p className="text-sm font-bold truncate">{nextClass.class_name}</p>
            <p className="text-xs text-[#A8A9AD] flex items-center gap-2 mt-1">
              <Clock size={11} /> {nextClass.day_of_week} at {nextClass.start_time}
              {nextClass.instructor && ` • ${nextClass.instructor}`}
            </p>
          </div>
          <ChevronRight size={20} className="text-[#A8A9AD] shrink-0" />
        </div>
      )}

      {/* Program Filter */}
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

      {/* Day Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", ...DAYS_OF_WEEK].map(day => {
          const isToday = day === todayName;
          return (
            <button
              key={day}
              onClick={() => setDayFilter(day)}
              className={`px-4 py-2 text-xs tracking-widest uppercase font-medium whitespace-nowrap transition-all ${dayFilter === day ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"} ${isToday && dayFilter !== day ? "border-[#C9A84C]/50 text-[#C9A84C]" : ""}`}
            >
              {day}{isToday ? " • Today" : ""}
            </button>
          );
        })}
      </div>

      {/* Schedule */}
      {filteredClasses.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No classes match your filters.</p>
        </div>
      ) : dayFilter === "All" ? (
        <div className="space-y-8">
          {grouped.map(group =>
            group.items.length > 0 ? (
              <div key={group.day}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
                  <span className={group.day === todayName ? "text-[#C9A84C]" : ""}>{group.day}{group.day === todayName ? " • Today" : ""}</span>
                  <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                  <span className="text-xs text-[#A8A9AD] font-normal">{group.items.length} class{group.items.length > 1 ? "es" : ""}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map(cls => (
                    <PortalClassCard key={cls.id} cls={cls} program={getProgram(cls)} programs={programs} eligible={isEligible(cls)} isToday={group.day === todayName} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredClasses.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")).map(cls => (
            <PortalClassCard key={cls.id} cls={cls} program={getProgram(cls)} programs={programs} eligible={isEligible(cls)} isToday={dayFilter === todayName} />
          ))}
        </div>
      )}
    </div>
  );
}