import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, X, Edit3, CalendarClock, MessageSquare, Check, ChevronLeft } from "lucide-react";

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ExceptionHandlerModal({ cls, targetDate, onClose, onEditAll, onChanged }) {
  const [step, setStep] = useState(targetDate ? "override" : "prompt");
  const [override, setOverride] = useState({
    target_date: targetDate ? formatDate(targetDate) : "",
    is_cancelled: false,
    override_start_time: cls?.start_time || "",
    override_end_time: cls?.end_time || "",
    override_instructor: cls?.instructor || "",
    override_trial_closed: false,
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showNotify, setShowNotify] = useState(false);

  useEffect(() => {
    base44.auth.me().catch(() => null).then(setUser);
  }, []);

  const handleSave = async () => {
    if (!override.target_date) return;
    setSaving(true);
    try {
      await base44.entities.ScheduleException.create({
        linked_class_id: cls.id,
        class_name: cls.class_name,
        target_date: override.target_date,
        is_cancelled: override.is_cancelled,
        override_start_time: override.is_cancelled ? "" : override.override_start_time,
        override_end_time: override.is_cancelled ? "" : override.override_end_time,
        override_instructor: override.is_cancelled ? "" : override.override_instructor,
        override_trial_closed: override.override_trial_closed,
        reason: override.reason,
        created_by_id: user?.id || "",
        created_by_name: user?.full_name || "",
      });
      setShowNotify(true);
      onChanged();
    } catch (e) {
      alert("Failed to save exception: " + e.message);
    }
    setSaving(false);
  };

  const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarClock size={20} className="text-[#C9A84C]" />
            <h2 className="text-xl font-bold">Edit {cls.class_name}</h2>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        {showNotify ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center mx-auto">
              <Check size={28} className="text-[#C9A84C]" />
            </div>
            <p className="text-sm text-white">Exception saved for {fmtDate(override.target_date)}.</p>
            <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 text-left">
              <p className="text-xs text-[#A8A9AD] mb-3">Would you like to notify the rostered students about this schedule change?</p>
              <div className="flex gap-2">
                <Link to="/admin/broadcasts" onClick={onClose} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
                  <MessageSquare size={14} /> Notify Students
                </Link>
                <button onClick={onClose} className="px-4 py-2.5 border border-[#A8A9AD]/30 text-[#A8A9AD] text-xs font-bold tracking-wide uppercase hover:text-white transition-colors">
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : step === "prompt" ? (
          <div className="space-y-4">
            <p className="text-sm text-[#A8A9AD]">This is a recurring class. How would you like to edit it?</p>
            <div className="space-y-3">
              <button onClick={onEditAll} className="w-full flex items-center gap-3 p-4 border border-[#A8A9AD]/20 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-colors text-left">
                <Edit3 size={20} className="text-[#C9A84C] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">Edit All Future Occurrences</p>
                  <p className="text-xs text-[#A8A9AD]">Updates the permanent recurring rule for this class.</p>
                </div>
              </button>
              <button onClick={() => setStep("override")} className="w-full flex items-center gap-3 p-4 border border-[#A8A9AD]/20 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-colors text-left">
                <CalendarClock size={20} className="text-[#C9A84C] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">One-Time Override</p>
                  <p className="text-xs text-[#A8A9AD]">Change or cancel just one specific date without affecting the recurring schedule.</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setStep("prompt")} className="flex items-center gap-1 text-xs text-[#A8A9AD] hover:text-white">
              <ChevronLeft size={14} /> Back
            </button>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Date *</label>
              <input type="date" value={override.target_date} onChange={e => setOverride({ ...override, target_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
            </div>
            <label className="flex items-center gap-2 text-sm text-white bg-red-500/5 border border-red-500/20 p-3 cursor-pointer">
              <input type="checkbox" checked={override.is_cancelled} onChange={e => setOverride({ ...override, is_cancelled: e.target.checked })} className="accent-red-500 w-4 h-4" />
              <div>
                <span className="font-medium">Cancel this class on this date</span>
                <p className="text-xs text-[#A8A9AD] mt-0.5">The class will show as cancelled without affecting the recurring schedule.</p>
              </div>
            </label>
            {!override.is_cancelled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Override Start Time</label>
                    <input type="time" value={override.override_start_time} onChange={e => setOverride({ ...override, override_start_time: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Override End Time</label>
                    <input type="time" value={override.override_end_time} onChange={e => setOverride({ ...override, override_end_time: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Override Instructor</label>
                  <input type="text" value={override.override_instructor} onChange={e => setOverride({ ...override, override_instructor: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm text-white bg-[#C9A84C]/5 border border-[#C9A84C]/20 p-3 cursor-pointer">
                  <input type="checkbox" checked={override.override_trial_closed} onChange={e => setOverride({ ...override, override_trial_closed: e.target.checked })} className="accent-[#C9A84C] w-4 h-4" />
                  <div>
                    <span className="font-medium">Close trials for this date</span>
                    <p className="text-xs text-[#A8A9AD] mt-0.5">Manually close trial bookings if the mat is too crowded.</p>
                  </div>
                </label>
              </div>
            )}
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Reason (optional)</label>
              <input type="text" value={override.reason} onChange={e => setOverride({ ...override, reason: e.target.value })} placeholder="e.g., Holiday, Instructor sick, Room conflict" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
            <button onClick={handleSave} disabled={!override.target_date || saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : "Save Exception"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}