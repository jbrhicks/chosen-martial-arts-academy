import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Check, X, Loader2, Camera, Target } from "lucide-react";

export default function GuardianVerificationSection({ verifications, onResolved }) {
  const [busy, setBusy] = useState("");

  const handleAction = async (logId, action) => {
    setBusy(logId + action);
    try {
      await base44.functions.invoke("verifyChallengeLog", { log_id: logId, action });
      onResolved();
    } catch (e) { alert("Failed to update."); }
    setBusy("");
  };

  if (!verifications || verifications.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Shield size={16} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Guardian Verification Required</h3>
      </div>
      <p className="text-xs text-[#A8A9AD] mb-2">Your child logged activity that needs your approval to count toward their challenge.</p>

      {verifications.map((log) => (
        <div key={log.id} className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{log.student_name}</p>
              <p className="text-xs text-[#A8A9AD] mt-0.5">{log.challenge_title}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-[#C9A84C] flex items-center gap-1">
                  {log.log_type === "media_upload" ? <Camera size={11} /> : <Target size={11} />}
                  {log.log_type === "media_upload" ? "Photo proof" : `${log.logged_value} ${log.unit_label || "units"}`}
                </span>
                {log.proof_description && <span className="text-[#A8A9AD]">"{log.proof_description}"</span>}
              </div>
              {log.proof_media_url && (
                <a href={log.proof_media_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-blue-400 hover:underline">
                  View proof →
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleAction(log.id, "approve")}
              disabled={busy === log.id + "approve"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-xs tracking-widest uppercase font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {busy === log.id + "approve" ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Verify & Approve</>}
            </button>
            <button
              onClick={() => handleAction(log.id, "reject")}
              disabled={busy === log.id + "reject"}
              className="px-4 py-2 border border-red-500/30 text-red-400 text-xs tracking-widest uppercase font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {busy === log.id + "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}