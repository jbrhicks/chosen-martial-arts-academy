import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, Trophy, Target, TrendingUp, Award } from "lucide-react";

const TYPE_LABELS = {
  attendance_count: "Combined Attendance",
  goal_completions: "Goals Completed",
  class_streak: "Class Streak",
  custom: "Custom Challenge",
};

export default function FamilyChallenges() {
  const { hasFamily } = useFamily();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getFamilyChallenges");
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  const challenges = data.challenges || [];
  const myProgress = data.myProgress || [];
  const leaderboard = data.leaderboard || [];

  if (!hasFamily) {
    return (
      <div className="border border-[#A8A9AD]/20 p-8 text-center">
        <Trophy size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
        <p className="text-[#A8A9AD] text-sm">Create or join a family to participate in challenges.</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Family Challenges</h2>
          <p className="text-sm text-[#A8A9AD]">Compete with other families and track shared training goals.</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <Trophy size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
          <p className="text-[#A8A9AD] text-sm">No active challenges right now. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Family Challenges</h2>
        <p className="text-sm text-[#A8A9AD]">Compete with other families and track shared training goals.</p>
      </div>

      {challenges.map((ch) => {
        const progress = myProgress.find((p) => p.challenge_id === ch.id);
        const board = leaderboard.find((l) => l.challenge_id === ch.id);
        const isComplete = progress && progress.progress_pct >= 100;

        return (
          <div key={ch.id} className="border border-[#A8A9AD]/20 bg-black overflow-hidden">
            <div className={`p-5 ${isComplete ? "bg-green-500/5 border-b border-green-500/20" : "border-b border-[#A8A9AD]/20"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${isComplete ? "bg-green-500/15 text-green-400" : "bg-[#C9A84C]/10 text-[#C9A84C]"}`}>
                    {isComplete ? <Award size={20} /> : <Target size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{ch.title}</h3>
                    {ch.description && <p className="text-sm text-[#A8A9AD] mt-0.5">{ch.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#A8A9AD]/70">
                      <span className="text-[#C9A84C]">{TYPE_LABELS[ch.challenge_type] || "Challenge"}</span>
                      {ch.start_date && <span>{new Date(ch.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      {ch.end_date && <span>– {new Date(ch.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                  </div>
                </div>
                {progress && (
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{progress.current_value}<span className="text-sm text-[#A8A9AD]">/{progress.target_value}</span></p>
                    <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{ch.unit_label || "units"}</p>
                  </div>
                )}
              </div>

              {progress && (
                <div className="mt-4">
                  <div className="h-2 bg-[#A8A9AD]/10 overflow-hidden">
                    <div
                      className={`h-full transition-all ${isComplete ? "bg-green-500" : "bg-[#C9A84C]"}`}
                      style={{ width: progress.progress_pct + "%" }}
                    />
                  </div>
                  <p className="text-xs mt-1.5 text-[#A8A9AD]">
                    {progress.progress_pct}% complete
                    {isComplete && <span className="text-green-400 ml-2">🏆 Challenge complete!</span>}
                  </p>
                </div>
              )}
            </div>

            {board && board.entries.length > 0 && (
              <div className="p-5">
                <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] font-bold mb-3 flex items-center gap-1">
                  <TrendingUp size={12} /> Family Leaderboard
                </p>
                <div className="space-y-1.5">
                  {board.entries.map((entry, i) => {
                    const rankColor = i === 0 ? "text-[#C9A84C]" : "text-[#A8A9AD]";
                    const rowClass = entry.is_me
                      ? "bg-[#C9A84C]/10 border border-[#C9A84C]/30"
                      : "border border-transparent";
                    return (
                      <div key={entry.family_id} className={"flex items-center gap-3 px-3 py-2 " + rowClass}>
                        <span className={"w-6 text-center text-sm font-bold " + rankColor}>{i + 1}</span>
                        <span className="flex-1 text-sm font-medium truncate">
                          {entry.family_name}
                          {entry.is_me && <span className="text-[#C9A84C] text-xs ml-2">(Your Family)</span>}
                        </span>
                        <span className="text-sm font-bold">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}