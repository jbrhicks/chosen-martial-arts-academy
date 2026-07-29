import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Upload, Camera, Check, Image as ImageIcon } from "lucide-react";

export default function TaskLoggerModal({ challenge, progress, onClose, onLogged }) {
  const [loggedValue, setLoggedValue] = useState(1);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const isMediaProof = challenge.goal_type === "media_proof";
  const isAttendance = challenge.goal_type === "attendance";

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isMediaProof && !file && !preview) { alert("Please upload a photo or video as proof."); return; }
    setSaving(true);
    try {
      let proofUrl = "";
      if (file) {
        const res = await base44.integrations.Core.UploadFile({ file });
        proofUrl = res.file_url;
      }
      const result = await base44.functions.invoke("logChallengeProgress", {
        challenge_id: challenge.id,
        logged_value: Number(loggedValue),
        log_type: isMediaProof ? "media_upload" : "manual",
        proof_media_url: proofUrl || undefined,
        proof_description: description || undefined,
      });

      if (result.verification_status === "pending_guardian") {
        alert("Log submitted! A guardian will verify and approve your points shortly.");
      } else if (result.completed) {
        alert("🏆 Challenge complete! You've earned your badge!");
      } else if (result.milestone) {
        // Trigger confetti for milestones (25%, 50%, 75%)
        import("canvas-confetti").then((m) => {
          m.default({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        });
      }

      onLogged(result);
    } catch (e) { alert("Failed to log progress."); }
    setSaving(false);
  };

  if (isAttendance) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full max-w-sm border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <Check size={32} className="mx-auto text-green-400 mb-3" />
          <h3 className="text-lg font-bold mb-2">Auto-Tracked</h3>
          <p className="text-sm text-[#A8A9AD] mb-4">This challenge tracks your class attendance automatically. Just check in to class and your progress updates!</p>
          <button onClick={onClose} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-2.5">Got It</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Log Activity</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-[#A8A9AD] mb-1">{challenge.title}</p>
          <p className="text-[10px] tracking-widest uppercase text-[#C9A84C]">
            {isMediaProof ? "Media Proof Required" : "Manual Log"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {!isMediaProof && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">How many {challenge.unit_label || "units"}?</label>
              <input type="number" min="1" value={loggedValue} onChange={(e) => setLoggedValue(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
            </div>
          )}

          {isMediaProof && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Upload Proof *</label>
              {preview ? (
                <div className="relative border border-[#A8A9AD]/30 p-2">
                  <img src={preview} alt="Preview" className="w-full max-h-40 object-contain" />
                  <button type="button" onClick={() => { setFile(null); setPreview(""); }} className="absolute top-1 right-1 bg-black/80 p-1 text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-[#A8A9AD]/30 p-6 text-center hover:border-[#C9A84C]/40 transition-colors">
                  <Camera size={24} className="mx-auto text-[#A8A9AD] mb-2" />
                  <p className="text-xs text-[#A8A9AD]">Tap to upload photo/video</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </div>
          )}

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Notes (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="What did you work on?" />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /> Submit Log</>}
          </button>
        </form>
      </div>
    </div>
  );
}