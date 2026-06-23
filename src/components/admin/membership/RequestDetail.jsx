import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Snowflake, XCircle, CheckCircle, Phone, TrendingUp, TrendingDown } from "lucide-react";

export default function RequestDetail({ request, onClose, onProcessed }) {
  const [notes, setNotes] = useState(request.admin_notes || "");
  const [resumeDate, setResumeDate] = useState("");
  const [showFreezePrompt, setShowFreezePrompt] = useState(false);
  const [processing, setProcessing] = useState(false);

  const updateRequest = async (updates) => {
    await base44.entities.MembershipRequest.update(request.id, { ...updates, admin_notes: notes });
  };

  const handleMarkContacted = async () => {
    try {
      await updateRequest({ status: "contacted" });
      onProcessed();
    } catch (e) { alert("Failed to update."); }
  };

  const handleApproveFreeze = async () => {
    if (!resumeDate) { alert("Please set a resume billing date."); return; }
    setProcessing(true);
    try {
      await updateRequest({ status: "approved", resume_billing_date: resumeDate, processed_date: new Date().toISOString() });
      const billings = await base44.entities.BillingRecord.filter({ family_id: request.family_id, status: "active" });
      for (const b of billings) {
        await base44.entities.BillingRecord.update(b.id, {
          status: "paused",
          freeze_start: request.requested_effective_date,
          freeze_end: resumeDate,
          freeze_reason: request.reason,
        });
      }
      const enrollments = await base44.entities.Enrollment.filter({ user_id: request.user_id, status: "active" });
      for (const e of enrollments) {
        await base44.entities.Enrollment.update(e.id, { status: "paused" });
      }
      onProcessed();
    } catch (e) { alert("Failed to process freeze."); }
    setProcessing(false);
  };

  const handleApproveCancellation = async () => {
    if (!confirm("Approve cancellation? This will terminate billing and revoke access to community and curriculum.")) return;
    setProcessing(true);
    try {
      await updateRequest({ status: "approved", processed_date: new Date().toISOString() });
      const billings = await base44.entities.BillingRecord.filter({ family_id: request.family_id, status: "active" });
      for (const b of billings) {
        await base44.entities.BillingRecord.update(b.id, { status: "cancelled" });
      }
      const enrollments = await base44.entities.Enrollment.filter({ user_id: request.user_id, status: "active" });
      for (const e of enrollments) {
        await base44.entities.Enrollment.update(e.id, { status: "cancelled" });
      }
      onProcessed();
    } catch (e) { alert("Failed to process cancellation."); }
    setProcessing(false);
  };

  const handleMarkSaved = async () => {
    try {
      await updateRequest({ status: "saved", processed_date: new Date().toISOString() });
      onProcessed();
    } catch (e) { alert("Failed to update."); }
  };

  const handleApproveTierChange = async () => {
    if (!request.requested_tier_id || !request.enrollment_id) { alert("Missing tier or enrollment data."); return; }
    if (!confirm(`Approve ${request.request_type} to "${request.requested_tier_name}"? This will update the student's tier and locked-in price.`)) return;
    setProcessing(true);
    try {
      const allTiers = await base44.entities.SubscriptionTier.list();
      const targetTier = allTiers.find(t => t.id === request.requested_tier_id);
      if (!targetTier) throw new Error("Requested tier no longer exists.");
      await base44.entities.Enrollment.update(request.enrollment_id, {
        linked_tier_id: targetTier.id,
        locked_in_price: targetTier.price,
      });
      const billings = await base44.entities.BillingRecord.filter({ user_email: request.user_email, status: "active" });
      for (const b of billings) {
        if (targetTier.billing_interval === "monthly") {
          await base44.entities.BillingRecord.update(b.id, { recurring_amount: targetTier.price });
        }
      }
      await updateRequest({ status: "approved", processed_date: new Date().toISOString() });
      onProcessed();
    } catch (e) { alert("Failed to process tier change: " + e.message); }
    setProcessing(false);
  };

  const isProcessed = request.status === "approved" || request.status === "saved";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">{request.user_name}</h3>
            <p className="text-xs text-[#A8A9AD]">{request.user_email}</p>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="border border-[#A8A9AD]/20 p-3">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Request Type</p>
            <p className={`text-sm font-bold ${request.request_type === "freeze" ? "text-blue-400" : request.request_type === "cancellation" ? "text-red-400" : request.request_type === "upgrade" ? "text-green-400" : "text-[#C9A84C]"}`}>
              {request.request_type === "freeze" ? "Freeze Account" : request.request_type === "cancellation" ? "Cancel Membership" : request.request_type === "upgrade" ? "Upgrade Tier" : "Downgrade Tier"}
            </p>
          </div>
          <div className="border border-[#A8A9AD]/20 p-3">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Effective Date</p>
            <p className="text-sm font-bold">{request.requested_effective_date ? new Date(request.requested_effective_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</p>
          </div>
        </div>

        {(request.request_type === "upgrade" || request.request_type === "downgrade") && (
          <div className="border border-[#A8A9AD]/20 p-4 mb-5">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-2">Tier Change Details</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#A8A9AD]">{request.current_tier_name || "No tier"}</span>
              {request.request_type === "upgrade" ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-[#C9A84C]" />}
              <span className="text-white font-medium">{request.requested_tier_name}</span>
            </div>
          </div>
        )}

        <div className="border border-[#A8A9AD]/20 p-4 mb-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-2">Reason Provided</p>
          <p className="text-sm">{request.reason}</p>
        </div>

        <div className="mb-5">
          <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Admin Notes & Communication Log</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Log outreach attempts, e.g., 'Called mom on Tuesday, left a voicemail.' or 'Offered to switch to 1-day-a-week program.'" rows={4} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" disabled={isProcessed} />
        </div>

        {showFreezePrompt && !isProcessed && (
          <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 mb-5">
            <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Resume Billing Date</label>
            <input type="date" value={resumeDate} onChange={e => setResumeDate(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none mb-3" />
            <button onClick={handleApproveFreeze} disabled={processing || !resumeDate} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? <Loader2 size={16} className="animate-spin" /> : <><Snowflake size={16} /> Confirm Freeze</>}
            </button>
          </div>
        )}

        {!isProcessed && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleMarkContacted} className="flex items-center justify-center gap-2 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-white py-3 text-sm font-medium tracking-wide uppercase transition-colors">
              <Phone size={15} /> Mark as Contacted
            </button>
            {request.request_type === "freeze" && (
              <button onClick={() => setShowFreezePrompt(!showFreezePrompt)} className="flex items-center justify-center gap-2 border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 py-3 text-sm font-medium tracking-wide uppercase transition-colors">
                <Snowflake size={15} /> Approve Freeze
              </button>
            )}
            {request.request_type === "cancellation" && (
              <button onClick={handleApproveCancellation} disabled={processing} className="flex items-center justify-center gap-2 border border-red-400/30 text-red-400 hover:bg-red-400/10 py-3 text-sm font-medium tracking-wide uppercase transition-colors disabled:opacity-50">
                {processing ? <Loader2 size={15} className="animate-spin" /> : <><XCircle size={15} /> Approve Cancellation</>}
              </button>
            )}
            {(request.request_type === "upgrade" || request.request_type === "downgrade") && (
              <button onClick={handleApproveTierChange} disabled={processing} className={`flex items-center justify-center gap-2 border py-3 text-sm font-medium tracking-wide uppercase transition-colors disabled:opacity-50 ${request.request_type === "upgrade" ? "border-green-400/30 text-green-400 hover:bg-green-400/10" : "border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10"}`}>
                {processing ? <Loader2 size={15} className="animate-spin" /> : <>{request.request_type === "upgrade" ? <TrendingUp size={15} /> : <TrendingDown size={15} />} Approve {request.request_type === "upgrade" ? "Upgrade" : "Downgrade"}</>}
              </button>
            )}
            <button onClick={handleMarkSaved} className="flex items-center justify-center gap-2 border border-green-400/30 text-green-400 hover:bg-green-400/10 py-3 text-sm font-medium tracking-wide uppercase transition-colors col-span-2">
              <CheckCircle size={15} /> Mark as Saved (Retained)
            </button>
          </div>
        )}

        {isProcessed && (
          <div className="text-center py-4">
            <p className="text-sm text-[#A8A9AD]">This request has been {request.status === "approved" ? "approved and processed" : "marked as saved"}.</p>
          </div>
        )}
      </div>
    </div>
  );
}