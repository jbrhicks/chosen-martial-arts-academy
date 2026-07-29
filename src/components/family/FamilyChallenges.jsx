import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Trophy, Target, TrendingUp, Award, Plus, LogIn, Calendar, Users, Lock, Camera } from "lucide-react";
import ChallengeProgressRing from "@/components/challenges/ChallengeProgressRing";
import TaskLoggerModal from "@/components/challenges/TaskLoggerModal";
import GuardianVerificationSection from "@/components/challenges/GuardianVerificationSection";
import TrophyCase from "@/components/challenges/TrophyCase";

const GOAL_ICONS = { attendance: Calendar, task: Target, media_proof: Camera };
const GOAL_LABELS = { attendance: "Attendance", task: "Task / Reps", media_proof: "Media Proof" };

export default function FamilyChallenges() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingChallenge, setLoggingChallenge] = useState(null);
  const [joining, setJoining] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getChallengeDashboard");
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const joinChallenge = async (challengeId, title) => {
    setJoining(challengeId);
    try {
      await base44.entities.ChallengeParticipant.create({
        challenge_id: challengeId,
        challenge_title: title,
        student_id: user.id,
        student_name: user.full_name,
        status: "active",
        current_score: 0,
        enrolled_date: new Date().toISOString(),
      });
      load();
    } catch (e) { alert("Failed to join challenge."); }
    setJoining(null);
  };

  if (loading || !data) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  const challenges = data.challenges || [];
  const myProgress = data.myProgress || [];
  const myBadges = data.myBadges || [];
  const pendingVerifications = data.pendingVerifications || [];
  const leaderboards = data.leaderboards || [];

  if (challenges.length === 0 && myBadges.length === 0 && pendingVerifications.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Challenge Hub</h2>
          <p className="text-sm text-[#A8A9AD]">Compete in academy challenges, track progress, and earn badges.</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <Trophy size={32} className="mx-auto text-[#A8A9AD]/40 mb-3" />
          <p className="text-[#A8A9AD]">No active challenges right now. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Challenge Hub</h2>
        <p className="text-sm text-[#A8A9AD]">Compete in academy challenges, track progress, and earn badges.</p>
      </div>

      {/* Guardian Verification Section */}
      {pendingVerifications.length > 0 && (
        <GuardianVerificationSection verifications={pendingVerifications} onResolved={load} />
      )}

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] flex items-center gap-2">
            <Target size={14} /> Active Challenges
          </h3>
          {challenges.map((ch) => {
            const progress = myProgress.find((p) => p.challenge_id === ch.id);
            const board = leaderboards.find((l) => l.challenge_id === ch.id);
            const isComplete = progress?.status === "completed";
            const isEnrolled = progress?.enrolled;
            const GoalIcon = GOAL_ICONS[ch.goal_type] || Target;

            return (
              <div key={ch.id} className={`border bg-black overflow-hidden ${isComplete ? "border-green-500/30" : "border-[#A8A9AD]/20"}`}>
                <div className={`p-5 ${isComplete ? "bg-green-500/5" : ""}`}>
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Progress Ring */}
                    <div className="shrink-0">
                      <ChallengeProgressRing
                        progress={progress?.progress_pct || 0}
                        size={100}
                        label={isComplete ? "DONE" : undefined}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold">{ch.title}</h3>
                        {isComplete && <span className="text-[9px] tracking-widest uppercase bg-green-500/20 text-green-400 px-2 py-0.5 border border-green-500/30">Completed</span>}
                      </div>
                      {ch.description && <p className="text-sm text-[#A8A9AD] mb-2">{ch.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-[#A8A9AD]/70 flex-wrap">
                        <span className="text-[#C9A84C] flex items-center gap-1"><GoalIcon size={11} /> {GOAL_LABELS[ch.goal_type]}</span>
                        <span>Goal: <strong className="text-white">{ch.target_goal_value} {ch.unit_label}</strong></span>
                        {progress && <span>Score: <strong className="text-white">{progress.current_value}</strong></span>}
                        {ch.start_date && <span>{new Date(ch.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                        {ch.end_date && <span>– {new Date(ch.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="shrink-0 flex flex-col gap-2">
                      {isComplete ? (
                        <div className="text-center py-2 px-4 bg-green-500/10 border border-green-500/30">
                          <Award size={16} className="mx-auto text-green-400 mb-1" />
                          <span className="text-[10px] tracking-widest uppercase text-green-400">Badge Earned!</span>
                        </div>
                      ) : !isEnrolled ? (
                        <button
                          onClick={() => joinChallenge(ch.id, ch.title)}
                          disabled={joining === ch.id}
                          className="flex items-center gap-1.5 px-4 py-2.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs tracking-widest uppercase font-bold hover:bg-[#C9A84C]/10 transition-colors disabled:opacity-50"
                        >
                          {joining === ch.id ? <Loader2 size={14} className="animate-spin" /> : <><LogIn size={14} /> Join</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => setLoggingChallenge({ ...ch, progress })}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C9A84C] text-black text-xs tracking-widest uppercase font-bold hover:bg-[#E0C97A] transition-colors"
                        >
                          <Plus size={14} /> Log Activity
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Punch Card for task type */}
                  {isEnrolled && ch.goal_type === "task" && progress && (
                    <div className="mt-4 flex gap-1 flex-wrap">
                      {Array.from({ length: Math.min(ch.target_goal_value, 30) }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 border flex items-center justify-center text-[10px] font-bold ${
                            i < progress.current_value
                              ? "bg-[#C9A84C] border-[#C9A84C] text-black"
                              : "border-[#A8A9AD]/20 text-[#A8A9AD]/30"
                          }`}
                        >
                          {i < progress.current_value ? "✓" : ""}
                        </div>
                      ))}
                      {ch.target_goal_value > 30 && <span className="text-xs text-[#A8A9AD] self-center ml-1">+{ch.target_goal_value - 30} more</span>}
                    </div>
                  )}
                </div>

                {/* Leaderboard */}
                {ch.has_leaderboard && board && board.entries.length > 0 && (
                  <div className="p-5 border-t border-[#A8A9AD]/20">
                    <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] font-bold mb-3 flex items-center gap-1">
                      <TrendingUp size={12} /> Leaderboard
                    </p>
                    <div className="space-y-1">
                      {board.entries.map((entry, i) => {
                        const rankColor = i === 0 ? "text-[#C9A84C]" : i === 1 ? "text-[#A8A9AD]" : i === 2 ? "text-orange-400" : "text-[#A8A9AD]";
                        const rowClass = entry.is_me ? "bg-[#C9A84C]/10 border border-[#C9A84C]/30" : "";
                        return (
                          <div key={entry.student_id} className={"flex items-center gap-3 px-3 py-1.5 " + rowClass}>
                            <span className={"w-5 text-center text-sm font-bold " + rankColor}>{i + 1}</span>
                            <span className="flex-1 text-sm font-medium truncate">
                              {entry.student_name}
                              {entry.is_me && <span className="text-[#C9A84C] text-xs ml-2">(You)</span>}
                            </span>
                            <span className="text-sm font-bold">{entry.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!ch.has_leaderboard && (
                  <div className="p-3 border-t border-[#A8A9AD]/20 flex items-center gap-1.5 text-xs text-[#A8A9AD]/60">
                    <Lock size={11} /> Leaderboard disabled for this challenge.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trophy Case */}
      {myBadges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] flex items-center gap-2">
            <Trophy size={14} /> Digital Trophy Case
          </h3>
          <TrophyCase badges={myBadges} />
        </div>
      )}

      {/* Task Logger Modal */}
      {loggingChallenge && (
        <TaskLoggerModal
          challenge={loggingChallenge}
          progress={loggingChallenge.progress}
          onClose={() => setLoggingChallenge(null)}
          onLogged={() => { setLoggingChallenge(null); load(); }}
        />
      )}
    </div>
  );
}