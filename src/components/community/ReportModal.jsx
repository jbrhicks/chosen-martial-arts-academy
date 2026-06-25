import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Flag, Loader2 } from "lucide-react";

const REASONS = ["Spam or scam", "Inappropriate content", "Harassment or bullying", "Off-topic", "Other"];

export default function ReportModal({ targetType, targetId, targetContent, targetAuthorName, currentUser, onClose }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await base44.entities.ModerationFlag.create({
        target_type: targetType,
        target_id: targetId,
        target_content: targetContent,
        target_author_name: targetAuthorName,
        reported_by_id: currentUser.id,
        reported_by_name: currentUser.full_name,
        reason,
        status: "pending",
      });
      onClose();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-black border border-red-500/30 w-full max-w-md p-6 rounded-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Flag size={18} className="text-red-400" /> Report to Admin</h3>
          <button onClick={onClose}><X size={18} className="text-[#A8A9AD] hover:text-white" /></button>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-4">Select a reason. This will be sent to the admin moderation dashboard for review.</p>
        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)} className={`w-full text-left p-3 border text-sm transition-colors ${reason === r ? "border-red-500/50 bg-red-500/10 text-white" : "border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white"}`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={!reason || submitting} className="w-full bg-red-500/80 text-white py-2.5 font-bold text-sm hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><Flag size={14} /> Submit Report</>}
        </button>
      </div>
    </div>
  );
}