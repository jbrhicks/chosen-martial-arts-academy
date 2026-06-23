import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowUpCircle, CheckCircle } from "lucide-react";

export default function RankUpPanel({ student, belts, currentBelt, onUpdate }) {
  const [promoting, setPromoting] = useState(false);
  const [success, setSuccess] = useState(null);

  const currentIndex = belts.findIndex(b => b.id === currentBelt?.id);
  const nextBelt = currentIndex >= 0 && currentIndex < belts.length - 1 ? belts[currentIndex + 1] : null;

  const handleRankUp = async () => {
    if (!nextBelt) return;
    if (!confirm(`Promote ${student.full_name} to ${nextBelt.belt_name}? This will update their rank, unlock new videos, and notify their guardian.`)) return;
    setPromoting(true);
    try {
      const res = await base44.functions.invoke('rankUpStudent', { student_id: student.id, new_belt: nextBelt.belt_name });
      setSuccess(res.data.new_belt);
      onUpdate();
    } catch (e) { alert("Failed to promote student."); }
    setPromoting(false);
  };

  if (!nextBelt) {
    return (
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5 text-center">
        <CheckCircle size={20} className="text-[#C9A84C] mx-auto mb-2" />
        <p className="text-sm text-[#C9A84C]">Highest rank achieved in this program.</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#C9A84C]/40 bg-[#C9A84C]/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpCircle size={18} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Rank Promotion</h3>
      </div>
      {success ? (
        <div className="text-center py-2">
          <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm text-white">Promoted to <span className="text-[#C9A84C] font-bold">{success}</span>!</p>
          <p className="text-xs text-[#A8A9AD] mt-1">Videos unlocked. Guardian notified by email.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#A8A9AD] mb-3">
            Current: <span className="text-white font-medium">{currentBelt?.belt_name || "None"}</span>
            {" → "}Next: <span className="text-[#C9A84C] font-bold">{nextBelt.belt_name}</span>
          </p>
          <button onClick={handleRankUp} disabled={promoting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {promoting ? <Loader2 size={16} className="animate-spin" /> : <><ArrowUpCircle size={16} /> Promote to {nextBelt.belt_name}</>}
          </button>
        </>
      )}
    </div>
  );
}