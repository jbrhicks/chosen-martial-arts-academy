import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, CheckCircle, Circle, Clock, Target, TrendingUp, Calendar } from "lucide-react";
import { useCommunityAccess } from "@/lib/CommunityAccessContext";
import LockedCurriculum from "@/components/portal/community/LockedCurriculum";
import BadgeCollection from "@/components/portal/progress/BadgeCollection";

export default function Progress() {
  const { user } = useAuth();
  const { activeProfile } = useFamily();
  const { hasAccess, isChecking } = useCommunityAccess();
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentRank = activeProfile?.belt_rank || "White";
  const currentIndex = BELT_RANKS.indexOf(currentRank);
  const nextRank = currentIndex < BELT_RANKS.length - 1 ? BELT_RANKS[currentIndex + 1] : null;

  useEffect(() => {
    const load = async () => {
      try {
        const [g, p, a] = await Promise.all([
          base44.entities.ProgressGoal.filter({ belt_rank: currentRank }),
          base44.entities.StudentProgress.filter({ user_id: activeProfile?.id, belt_rank: currentRank }),
          base44.entities.AttendanceRecord.filter({ user_id: activeProfile?.id }),
        ]);
        setGoals(g);
        setProgress(p);
        setAttendance(a);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (activeProfile) load();
  }, [activeProfile?.id, currentRank]);

  const getGoalStatus = (goalId) => {
    const p = progress.find((pr) => pr.goal_id === goalId);
    return p?.status || "not_started";
  };

  const getGoalNotes = (goalId) => {
    const p = progress.find((pr) => pr.goal_id === goalId);
    return p?.admin_notes || "";
  };

  const completedCount = goals.filter((g) => getGoalStatus(g.id) === "completed").length;
  const totalRequired = goals.filter((g) => g.is_required).length;
  const completedRequired = goals.filter((g) => g.is_required && getGoalStatus(g.id) === "completed").length;
  const progressPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  const categories = ["Technique", "Kata", "Sparring", "Fitness", "Knowledge"];

  const statusConfig = {
    not_started: { icon: Circle, label: "Not Started", color: "text-[#A8A9AD]", bg: "bg-[#A8A9AD]/10" },
    in_progress: { icon: Clock, label: "In Progress", color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10" },
    completed: { icon: CheckCircle, label: "Completed", color: "text-green-400", bg: "bg-green-400/10" },
  };

  // Attendance stats
  const thisMonthAttendance = attendance.filter((a) => {
    const d = new Date(a.check_in_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (isChecking) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  if (!hasAccess) return <LockedCurriculum />;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Your Journey</p>
        <h1 className="text-3xl font-bold">Progression</h1>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-2">Current Rank</p>
          <BeltBadge rank={currentRank} size="lg" />
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-2">Next Rank</p>
          {nextRank ? <BeltBadge rank={nextRank} size="lg" /> : <p className="text-sm text-[#C9A84C]">Highest Rank</p>}
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-2">Belt Progress</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[#C9A84C]">{progressPercent}%</span>
            <span className="text-xs text-[#A8A9AD] mb-1">{completedRequired}/{totalRequired} required</span>
          </div>
          <div className="mt-2 h-2 bg-white/10 overflow-hidden">
            <div className="h-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-2">Attendance This Month</p>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-[#C9A84C]" />
            <span className="text-2xl font-bold">{thisMonthAttendance}</span>
            <span className="text-xs text-[#A8A9AD]">classes</span>
          </div>
        </div>
      </div>

      {/* Goals by category */}
      {goals.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <Target size={32} className="mx-auto text-[#A8A9AD] mb-4" />
          <p className="text-[#A8A9AD]">No goals have been set for your current belt rank yet.</p>
          <p className="text-xs text-[#A8A9AD]/60 mt-2">Your instructor will add progression goals soon.</p>
        </div>
      ) : (
        categories.map((cat) => {
          const catGoals = goals.filter((g) => g.category === cat);
          if (catGoals.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">{cat}</h2>
              <div className="space-y-2">
                {catGoals.map((goal) => {
                  const status = getGoalStatus(goal.id);
                  const notes = getGoalNotes(goal.id);
                  const cfg = statusConfig[status];
                  const Icon = cfg.icon;
                  return (
                    <div key={goal.id} className={`border border-[#A8A9AD]/20 bg-black p-4 flex items-start gap-4 ${status === "completed" ? "border-green-400/20" : ""}`}>
                      <div className={`mt-0.5 p-1.5 ${cfg.bg}`}>
                        <Icon size={16} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{goal.title}</p>
                          {goal.is_required && <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-1.5 py-0.5">Required</span>}
                          <span className={`text-[9px] tracking-widest uppercase ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        {goal.description && <p className="text-xs text-[#A8A9AD] mt-1">{goal.description}</p>}
                        {notes && (
                          <p className="text-xs text-[#A8A9AD] mt-2 border-l-2 border-[#C9A84C]/30 pl-3 italic">
                            Instructor: {notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Badge Collection */}
      <BadgeCollection studentId={activeProfile?.id} />

      {/* Recent attendance */}
      {attendance.length > 0 && (
        <div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Recent Attendance</h2>
          <div className="border border-[#A8A9AD]/20 bg-black divide-y divide-[#A8A9AD]/10">
            {attendance.slice(0, 10).map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{a.class_name}</p>
                  <p className="text-xs text-[#A8A9AD]">{new Date(a.check_in_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                </div>
                <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-1">{a.check_in_method}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}