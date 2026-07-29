import { useFamilyDashboard } from "@/hooks/useFamilyDashboard";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, Award } from "lucide-react";

export default function MilestonesTimeline() {
  const { data, loading } = useFamilyDashboard();

  if (loading || !data) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  const students = data.students || [];

  const events = [];
  students.forEach(s => {
    (s.progress || []).forEach(p => {
      if (p.status === "completed" && p.completed_date) {
        events.push({
          date: p.completed_date,
          student: s.full_name,
          title: p.goal_title || "Goal Completed",
          belt: p.belt_rank,
          type: "goal",
        });
      }
    });
    (s.enrollments || []).forEach(e => {
      if (e.start_date) {
        const years = new Date().getFullYear() - new Date(e.start_date).getFullYear();
        if (years >= 1) {
          events.push({
            date: e.start_date,
            student: s.full_name,
            title: `${e.program} Enrollment Anniversary`,
            belt: e.belt_rank,
            type: "anniversary",
            years,
          });
        }
      }
    });
  });

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Milestones Timeline</h2>
        <p className="text-sm text-[#A8A9AD]">Belt progressions, completed goals, and anniversaries across your family.</p>
      </div>

      {/* Current belts */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Current Ranks</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map(s => (
            <div key={s.id} className="border border-[#A8A9AD]/20 bg-black p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-sm font-bold text-[#C9A84C]">
                {s.full_name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-sm font-medium">{s.full_name}</p>
                {s.belt_rank && <div className="mt-1"><BeltBadge rank={s.belt_rank} size="sm" /></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {events.length > 0 ? (
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Achievement History</h3>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-[#A8A9AD]/20">
            {events.map((e, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-[#C9A84C] bg-black" />
                <div className="border border-[#A8A9AD]/20 bg-black p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-[#A8A9AD] mt-0.5">{e.student}{e.belt ? ` • ${e.belt}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#A8A9AD]">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      {e.years && <p className="text-[10px] text-[#C9A84C] tracking-wide uppercase mt-0.5">{e.years} Year{e.years !== 1 ? "s" : ""}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <Award size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
          <p className="text-[#A8A9AD] text-sm">No milestones recorded yet. Complete curriculum goals to see them here!</p>
        </div>
      )}
    </div>
  );
}