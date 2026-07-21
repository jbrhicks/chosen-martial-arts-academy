import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Loader2, Check, Star } from "lucide-react";

export default function InstructorAccessToggle({ user, onRefresh, logActivity }) {
  const [isInstructor, setIsInstructor] = useState(user?.is_instructor || false);
  const [tier, setTier] = useState(user?.instructor_tier || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsInstructor(user?.is_instructor || false);
    setTier(user?.instructor_tier || "");
  }, [user?.id, user?.is_instructor, user?.instructor_tier]);

  const handleToggle = async () => {
    if (!user?.id) { alert("User not loaded yet."); return; }
    setSaving(true);
    const newVal = !isInstructor;
    const effectiveTier = newVal ? (tier || "Jr. Instructor") : "";
    try {
      await base44.entities.User.update(user.id, { is_instructor: newVal, instructor_tier: effectiveTier });
      setIsInstructor(newVal);
      if (!newVal) setTier("");
      else if (!tier) setTier("Jr. Instructor");
      try { await logActivity("edit", `Instructor access ${newVal ? "granted" : "revoked"}`); } catch (_) {}
      onRefresh();
    } catch (e) { alert("Failed to update: " + (e.response?.data?.error || e.message)); }
    setSaving(false);
  };

  const handleTierChange = async (newTier) => {
    if (!user?.id) { alert("User not loaded yet."); return; }
    setTier(newTier);
    setSaving(true);
    try {
      await base44.entities.User.update(user.id, { instructor_tier: newTier });
      try { await logActivity("edit", `Instructor tier set to ${newTier}`); } catch (_) {}
      onRefresh();
    } catch (e) { alert("Failed to update tier: " + (e.response?.data?.error || e.message)); }
    setSaving(false);
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";

  return (
    <div className={`border p-6 ${isInstructor ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-black"}`}>
      <div className="flex items-center gap-3 mb-4">
        <Shield size={20} className={isInstructor ? "text-[#C9A84C]" : "text-[#A8A9AD]"} />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Instructor Access</h3>
        {isInstructor && <span className="ml-auto flex items-center gap-1 text-xs text-[#C9A84C]"><Star size={12} fill="currentColor" /> {tier}</span>}
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-medium text-white">Grant Teaching Tab Access</p>
          <p className="text-xs text-[#A8A9AD] mt-1">Unlocks the hidden "Teaching" tab on this user's mobile app — the Lesson Plan Playbook, Mat Intel roster, and Shift Hand-Off Logbook.</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm tracking-wide uppercase transition-colors disabled:opacity-50 shrink-0 ${
            isInstructor
              ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
              : "bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
          }`}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : isInstructor ? <Check size={16} /> : <Shield size={16} />}
          {isInstructor ? "Access Granted — Click to Revoke" : "Grant Access"}
        </button>
      </div>
      {isInstructor && (
        <div className="mt-4 pt-4 border-t border-[#A8A9AD]/20">
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Instructor Tier</label>
          <select value={tier} onChange={(e) => handleTierChange(e.target.value)} disabled={saving} className={inputClass}>
            <option value="">Select tier...</option>
            <option value="Jr. Instructor">Jr. Instructor</option>
            <option value="Lead Instructor">Lead Instructor</option>
          </select>
        </div>
      )}
    </div>
  );
}