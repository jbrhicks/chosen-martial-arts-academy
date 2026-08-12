import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Snowflake, Play, Ban, AlertTriangle } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active", label: "Active", icon: Play, borderClass: "border-green-400 bg-green-400/10", iconClass: "text-green-400", desc: "Full access — billing resumes normally." },
  { value: "paused", label: "Freeze", icon: Snowflake, borderClass: "border-blue-400 bg-blue-400/10", iconClass: "text-blue-400", desc: "Membership paused. Billing record set to paused and next billing date held." },
  { value: "cancelled", label: "Cancel", icon: Ban, borderClass: "border-red-400 bg-red-400/10", iconClass: "text-red-400", desc: "Enrollment cancelled. Linked billing record cancelled — no future charges." },
];

export default function EnrollmentStatusModal({ enrollment, onClose, onDone }) {
  const [status, setStatus] = useState(enrollment.status || "active");
  const [freezeStart, setFreezeStart] = useState("");
  const [freezeEnd, setFreezeEnd] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [billingRecord, setBillingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Billing records are family-level; match by user_email if present, else via family_id on the user
        const byEmail = await base44.entities.BillingRecord.filter({ user_email: enrollment.user_email }).catch(() => []);
        let records = byEmail;
        if (records.length === 0 && enrollment.user_id) {
          const user = await base44.entities.User.filter({ id: enrollment.user_id }).catch(() => []);
          const famId = user?.[0]?.family_id;
          if (famId) records = await base44.entities.BillingRecord.filter({ family_id: famId }).catch(() => []);
        }
        setBillingRecord(records.find(r => r.status === "active" || r.status === "paused") || records[0] || null);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [enrollment]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Enrollment.update(enrollment.id, { status });

      if (billingRecord) {
        const billingStatus = status === "active" ? "active" : status === "paused" ? "paused" : "cancelled";
        const updates = { status: billingStatus };
        if (status === "paused") {
          if (freezeStart) updates.freeze_start = freezeStart;
          if (freezeEnd) updates.freeze_end = freezeEnd;
          if (freezeReason) updates.freeze_reason = freezeReason;
        } else {
          // clear freeze fields if not paused
          updates.freeze_start = "";
          updates.freeze_end = "";
          updates.freeze_reason = "";
        }
        await base44.entities.BillingRecord.update(billingRecord.id, updates);
      }

      onDone();
    } catch (e) {
      alert("Failed to update status: " + (e.message || "Unknown error"));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">Manage Membership</h3>
            <p className="text-xs text-[#A8A9AD] mt-1">{enrollment.user_name || enrollment.user_email}</p>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#C9A84C]" /></div>
        ) : (
          <div className="space-y-4">
            {/* Billing link indicator */}
            <div className={`border p-3 flex items-start gap-2 ${billingRecord ? "border-[#C9A84C]/20 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-[#A8A9AD]/5"}`}>
              <AlertTriangle size={16} className={billingRecord ? "text-[#C9A84C] shrink-0 mt-0.5" : "text-[#A8A9AD] shrink-0 mt-0.5"} />
              <p className="text-xs text-[#A8A9AD]">
                {billingRecord ? (
                  <>Linked billing record found (${billingRecord.recurring_amount || 0}/{billingRecord.billing_cycle}). Status changes will sync automatically.</>
                ) : (
                  <>No linked billing record found. Only enrollment status will be updated.</>
                )}
              </p>
            </div>

            {/* Status options */}
            <div className="space-y-2">
              {STATUS_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 border text-left transition-colors ${
                      status === opt.value
                        ? opt.borderClass
                        : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/50"
                    }`}
                  >
                    <Icon size={18} className={`${opt.iconClass} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-[#A8A9AD] mt-0.5">{opt.desc}</p>
                    </div>
                    {status === opt.value && <span className="text-xs text-[#C9A84C] font-bold tracking-widest uppercase">Selected</span>}
                  </button>
                );
              })}
            </div>

            {/* Freeze details */}
            {status === "paused" && (
              <div className="border border-blue-400/20 bg-blue-400/5 p-4 space-y-3">
                <p className="text-xs tracking-widest uppercase text-blue-400">Freeze Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#A8A9AD] mb-1">Freeze Start</label>
                    <input type="date" value={freezeStart} onChange={e => setFreezeStart(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A8A9AD] mb-1">Freeze End</label>
                    <input type="date" value={freezeEnd} onChange={e => setFreezeEnd(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#A8A9AD] mb-1">Reason (optional)</label>
                  <input type="text" value={freezeReason} onChange={e => setFreezeReason(e.target.value)} placeholder="Vacation, injury, etc." className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <>Save Status</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}