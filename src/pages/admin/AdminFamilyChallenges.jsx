import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trophy, Trash2, Users, Target, Calendar, Percent, Gift, ToggleRight, ToggleLeft, Award } from "lucide-react";
import ChallengeBuilderForm from "@/components/challenges/ChallengeBuilderForm";
import RewardFulfillmentWidget from "@/components/challenges/RewardFulfillmentWidget";

const AUDIENCE_LABELS = {
  all: "Entire School",
  program: "Specific Program",
  rank: "Specific Rank",
  age_group: "Age Range",
  family: "All Families",
};

const GOAL_LABELS = {
  attendance: "Attendance",
  task: "Task / Reps",
  media_proof: "Media Proof",
};

export default function AdminFamilyChallenges() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("challenges");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getAdminChallengeData");
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteChallenge = async (ch) => {
    if (!confirm(`Delete "${ch.title}"? This cannot be undone.`)) return;
    await base44.entities.Challenge.delete(ch.id);
    load();
  };

  const archiveChallenge = async (ch) => {
    await base44.entities.Challenge.update(ch.id, { status: "archived" });
    if (ch.linked_group_id) {
      await base44.entities.Group.update(ch.linked_group_id, { is_archived: true }).catch(() => {});
    }
    load();
  };

  if (loading || !data) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  const challenges = data.challenges || [];
  const rewardQueue = data.rewardQueue || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Gamification Engine</p>
          <h1 className="text-3xl font-bold">Challenge Engine</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">Create targeted challenges, track engagement, and reward achievements.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={16} /> New Challenge
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 w-fit">
        <button onClick={() => setTab("challenges")} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${tab === "challenges" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD]"}`}>
          <Trophy size={14} /> Challenges ({challenges.length})
        </button>
        <button onClick={() => setTab("rewards")} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${tab === "rewards" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD]"}`}>
          <Gift size={14} /> Reward Inbox {rewardQueue.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{rewardQueue.length}</span>}
        </button>
      </div>

      {tab === "rewards" ? (
        <RewardFulfillmentWidget queue={rewardQueue} onFulfilled={load} />
      ) : challenges.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <Trophy size={32} className="mx-auto text-[#A8A9AD] mb-3" />
          <p className="text-[#A8A9AD]">No challenges yet. Click "New Challenge" to build your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((ch) => (
            <div key={ch.id} className={`border bg-black p-5 ${ch.status === "active" ? "border-[#C9A84C]/30" : "border-[#A8A9AD]/20"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 ${ch.status === "active" ? "text-green-400 border border-green-400/30" : ch.status === "archived" ? "text-[#A8A9AD] border border-[#A8A9AD]/20" : "text-[#C9A84C] border border-[#C9A84C]/30"}`}>{ch.status}</span>
                    <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/20 px-2 py-0.5">{GOAL_LABELS[ch.goal_type]}</span>
                    <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5">{AUDIENCE_LABELS[ch.target_audience_type]}</span>
                    <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5">{ch.enrollment_type === "auto" ? "Auto-Enroll" : "Opt-In"}</span>
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 flex items-center gap-0.5 ${ch.has_leaderboard ? "text-[#C9A84C] border border-[#C9A84C]/20" : "text-[#A8A9AD] border border-[#A8A9AD]/20"}`}>
                      {ch.has_leaderboard ? <ToggleRight size={11} /> : <ToggleLeft size={11} />} Leaderboard
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{ch.title}</h3>
                  {ch.description && <p className="text-xs text-[#A8A9AD] mb-2">{ch.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#A8A9AD]/70 flex-wrap">
                    <span className="flex items-center gap-1"><Target size={10} /> Goal: <strong className="text-white">{ch.target_goal_value} {ch.unit_label}</strong></span>
                    <span className="flex items-center gap-1"><Users size={10} /> {ch.participant_count} enrolled</span>
                    <span className="flex items-center gap-1"><Award size={10} /> {ch.completion_count} completed</span>
                    <span className="flex items-center gap-1"><Percent size={10} /> {ch.completion_rate}% completion</span>
                    {ch.start_date && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(ch.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    {ch.end_date && <span>– {new Date(ch.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  </div>
                  {ch.badge_name && <p className="text-xs text-[#C9A84C] mt-2">🏆 Badge: {ch.badge_name}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {ch.status === "active" && (
                    <button onClick={() => archiveChallenge(ch)} className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white">Archive</button>
                  )}
                  <button onClick={() => deleteChallenge(ch)} className="p-1.5 text-[#A8A9AD] hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <ChallengeBuilderForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
    </div>
  );
}