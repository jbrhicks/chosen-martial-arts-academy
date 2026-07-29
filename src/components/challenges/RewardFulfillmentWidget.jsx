import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Check, Loader2, User } from "lucide-react";

export default function RewardFulfillmentWidget({ queue, onFulfilled }) {
  const [busy, setBusy] = useState("");

  const markFulfilled = async (badge) => {
    setBusy(badge.id);
    try {
      await base44.entities.ChallengeBadge.update(badge.id, {
        reward_fulfilled: true,
        fulfilled_by_id: "admin",
        fulfilled_date: new Date().toISOString(),
      });
      onFulfilled();
    } catch (e) { alert("Failed to mark fulfilled."); }
    setBusy("");
  };

  if (!queue || queue.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 p-8 text-center">
        <Gift size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
        <p className="text-sm text-[#A8A9AD]">No rewards pending fulfillment. When students complete challenges, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Gift size={18} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Reward Fulfillment Queue</h3>
        <span className="text-[10px] bg-[#C9A84C] text-black px-2 py-0.5 font-bold">{queue.length}</span>
      </div>
      <p className="text-xs text-[#A8A9AD] mb-3">Present the physical prize at the student's next class, then mark it fulfilled.</p>

      {queue.map((badge) => (
        <div key={badge.id} className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center shrink-0">
              {badge.badge_graphic_url ? (
                <img src={badge.badge_graphic_url} alt="" className="w-10 h-10 object-contain" />
              ) : (
                <Gift size={20} className="text-[#C9A84C]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-1.5"><User size={12} /> {badge.student_name}</p>
              <p className="text-xs text-[#A8A9AD] mt-0.5">Earned: <span className="text-white font-medium">{badge.badge_name}</span></p>
              <p className="text-[10px] text-[#A8A9AD]/70 mt-0.5">{badge.challenge_title}</p>
            </div>
          </div>
          <button
            onClick={() => markFulfilled(badge)}
            disabled={busy === badge.id}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-xs tracking-widest uppercase font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {busy === badge.id ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Mark Presented</>}
          </button>
        </div>
      ))}
    </div>
  );
}