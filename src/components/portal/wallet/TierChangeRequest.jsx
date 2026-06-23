import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Loader2, CheckCircle, ArrowRight } from "lucide-react";

export default function TierChangeRequest({ user, familyId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const enrolls = await base44.entities.Enrollment.filter({ user_id: user.id, status: "active" }).catch(() => []);
      setEnrollments(enrolls);
      const allTiers = await base44.entities.SubscriptionTier.list().catch(() => []);
      setTiers(allTiers);
      const allPrograms = await base44.entities.Program.list().catch(() => []);
      setPrograms(allPrograms);
      if (familyId) {
        const reqs = await base44.entities.MembershipRequest.filter({ family_id: familyId }).catch(() => []);
        setPendingRequest(reqs.find(r => (r.status === "pending" || r.status === "contacted") && (r.request_type === "upgrade" || r.request_type === "downgrade")) || null);
      }
      setLoading(false);
    };
    load();
  }, [user, familyId]);

  const selectedEnrollment = enrollments.find(e => e.id === selectedEnrollmentId);
  const currentTier = tiers.find(t => t.id === selectedEnrollment?.linked_tier_id);
  const targetTier = tiers.find(t => t.id === selectedTierId);
  const programTiers = selectedEnrollment ? tiers.filter(t => t.linked_program_id === selectedEnrollment.program_id && t.is_active !== false) : [];
  const isUpgrade = targetTier && currentTier && targetTier.price > (selectedEnrollment?.locked_in_price || currentTier.price || 0);
  const isDowngrade = targetTier && currentTier && targetTier.price < (selectedEnrollment?.locked_in_price || currentTier.price || 0);

  const handleSubmit = async () => {
    if (!selectedEnrollmentId || !selectedTierId || !reason) return;
    setSubmitting(true);
    try {
      await base44.entities.MembershipRequest.create({
        family_id: familyId,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        program_id: selectedEnrollment.program_id,
        program_name: selectedEnrollment.program,
        request_type: isUpgrade ? "upgrade" : "downgrade",
        reason,
        enrollment_id: selectedEnrollmentId,
        current_tier_name: currentTier?.tier_name || "No tier",
        requested_tier_id: selectedTierId,
        requested_tier_name: targetTier?.tier_name || "",
        status: "pending",
      });
      setConfirmation(true);
      setShowForm(false);
      setReason("");
      setSelectedEnrollmentId("");
      setSelectedTierId("");
      if (familyId) {
        const reqs = await base44.entities.MembershipRequest.filter({ family_id: familyId }).catch(() => []);
        setPendingRequest(reqs.find(r => (r.status === "pending" || r.status === "contacted") && (r.request_type === "upgrade" || r.request_type === "downgrade")) || null);
      }
    } catch (e) { alert("Failed to submit request."); }
    setSubmitting(false);
  };

  if (loading) return null;

  if (enrollments.length === 0) return null;

  if (pendingRequest) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#C9A84C]" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Subscription Tier Change</h2>
        </div>
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
          <p className="text-sm font-medium mb-1">Request Pending Review</p>
          <p className="text-xs text-[#A8A9AD]">Your {pendingRequest.request_type} request from "{pendingRequest.current_tier_name}" to "{pendingRequest.requested_tier_name}" submitted on {new Date(pendingRequest.created_date).toLocaleDateString()} is being reviewed. An administrator will contact you within 24-48 hours.</p>
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#C9A84C]" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Subscription Tier Change</h2>
        </div>
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-[#C9A84C] mb-2" />
          <p className="text-sm font-medium mb-1">Your request has been received.</p>
          <p className="text-xs text-[#A8A9AD]">An administrator will contact you within 24-48 hours to finalize this change.</p>
          <button onClick={() => setConfirmation(false)} className="mt-3 text-xs text-[#C9A84C] tracking-widest uppercase">Dismiss</button>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#C9A84C]" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Subscription Tier Change</h2>
        </div>
        <p className="text-sm text-[#A8A9AD] mb-4">Want to upgrade or downgrade your plan? Submit a request and our team will contact you within 24-48 hours to finalize the change.</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 border border-[#C9A84C]/30 text-[#C9A84C] font-bold text-sm tracking-wide uppercase hover:bg-[#C9A84C]/10">
          Request Tier Change
        </button>
      </div>
    );
  }

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-[#C9A84C]" />
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Request Tier Change</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Select Enrollment</label>
          <select value={selectedEnrollmentId} onChange={e => { setSelectedEnrollmentId(e.target.value); setSelectedTierId(""); }} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Choose a program...</option>
            {enrollments.map(e => <option key={e.id} value={e.id}>{e.program}</option>)}
          </select>
        </div>

        {selectedEnrollment && (
          <div className="border border-[#A8A9AD]/20 p-3 text-xs text-[#A8A9AD]">
            Current tier: <span className="text-white font-medium">{currentTier?.tier_name || "No tier"}</span> — ${selectedEnrollment.locked_in_price || currentTier?.price || 0}/{currentTier?.billing_interval?.replace("_", " ") || "mo"}
          </div>
        )}

        {selectedEnrollment && programTiers.length > 0 && (
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Select New Tier</label>
            <div className="space-y-2">
              {programTiers.map(tier => {
                const isCurrent = tier.id === selectedEnrollment.linked_tier_id;
                return (
                  <button key={tier.id} onClick={() => setSelectedTierId(tier.id)} disabled={isCurrent} className={`w-full text-left p-3 border-2 transition-colors ${selectedTierId === tier.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"} ${isCurrent ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{tier.tier_name} {isCurrent && "(current)"}</p>
                        <p className="text-xs text-[#A8A9AD]">{tier.billing_interval.replace("_", " ")} • {tier.classes_allowed_per_week || "Unlimited"} classes/wk</p>
                      </div>
                      <span className="text-sm font-bold text-[#C9A84C]">${tier.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {targetTier && targetTier.id !== selectedEnrollment?.linked_tier_id && (
          <div className="border border-[#A8A9AD]/20 bg-black p-3 flex items-center gap-2 text-sm">
            {isUpgrade ? <TrendingUp size={16} className="text-green-400" /> : isDowngrade ? <TrendingDown size={16} className="text-[#C9A84C]" /> : <ArrowRight size={16} className="text-[#A8A9AD]" />}
            <span className="font-medium">{isUpgrade ? "Upgrade" : "Downgrade"}</span>
            <span className="text-[#A8A9AD]">from ${selectedEnrollment?.locked_in_price || currentTier?.price || 0} to ${targetTier.price}</span>
          </div>
        )}

        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Reason (Required)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell us why you'd like to change your tier..." rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white py-3 text-sm font-medium tracking-wide uppercase">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !selectedEnrollmentId || !selectedTierId || !reason} className="flex-1 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}