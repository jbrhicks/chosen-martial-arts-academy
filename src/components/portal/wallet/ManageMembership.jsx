import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldAlert, CheckCircle, Loader2 } from "lucide-react";

export default function ManageMembership({ user, familyId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ request_type: "freeze", requested_effective_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      const enrolls = await base44.entities.Enrollment.filter({ user_id: user.id, status: "active" }).catch(() => []);
      setEnrollments(enrolls);
      if (familyId) {
        const allRequests = await base44.entities.MembershipRequest.filter({ family_id: familyId }).catch(() => []);
        setExistingRequests(allRequests.filter(r => r.status === "pending" || r.status === "contacted"));
      }
    };
    load();
  }, [user, familyId]);

  const handleSubmit = async () => {
    if (!form.reason || !form.requested_effective_date) return;
    setSubmitting(true);
    try {
      await base44.entities.MembershipRequest.create({
        family_id: familyId,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        program_id: enrollments[0]?.program_id,
        program_name: enrollments[0]?.program,
        request_type: form.request_type,
        reason: form.reason,
        requested_effective_date: form.requested_effective_date,
        status: "pending",
      });
      setConfirmation(true);
      setForm({ request_type: "freeze", requested_effective_date: "", reason: "" });
      setShowForm(false);
      const allRequests = await base44.entities.MembershipRequest.filter({ family_id: familyId }).catch(() => []);
      setExistingRequests(allRequests.filter(r => r.status === "pending" || r.status === "contacted"));
    } catch (e) { alert("Failed to submit request."); }
    setSubmitting(false);
  };

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={18} className="text-[#C9A84C]" />
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Manage Membership</h2>
      </div>

      {enrollments.length === 0 ? (
        <p className="text-sm text-[#A8A9AD]">No active membership found.</p>
      ) : existingRequests.length > 0 ? (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
          <p className="text-sm font-medium mb-1">Request Pending Review</p>
          <p className="text-xs text-[#A8A9AD]">Your {existingRequests[0].request_type} request submitted on {new Date(existingRequests[0].created_date).toLocaleDateString()} is being reviewed. An administrator will contact you within 24-48 hours.</p>
        </div>
      ) : confirmation ? (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-[#C9A84C] mb-2" />
          <p className="text-sm font-medium mb-1">Your request has been received.</p>
          <p className="text-xs text-[#A8A9AD]">An administrator will contact you within 24-48 hours to finalize this change.</p>
          <button onClick={() => setConfirmation(false)} className="mt-3 text-xs text-[#C9A84C] tracking-widest uppercase">Dismiss</button>
        </div>
      ) : showForm ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Request Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setForm({ ...form, request_type: "freeze" })} className={`px-4 py-3 text-sm font-medium border-2 transition-colors ${form.request_type === "freeze" ? "border-blue-400 bg-blue-400/10 text-blue-400" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>
                Freeze Account
              </button>
              <button onClick={() => setForm({ ...form, request_type: "cancellation" })} className={`px-4 py-3 text-sm font-medium border-2 transition-colors ${form.request_type === "cancellation" ? "border-red-400 bg-red-400/10 text-red-400" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>
                Cancel Membership
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Requested Effective Date</label>
            <input type="date" value={form.requested_effective_date} onChange={e => setForm({ ...form, requested_effective_date: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Reason (Required)</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Please tell us why you're requesting this change..." rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white py-3 text-sm font-medium tracking-wide uppercase">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !form.reason || !form.requested_effective_date} className="flex-1 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Request"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#A8A9AD] mb-4">Need to pause or cancel your membership? Submit a request and our team will contact you within 24-48 hours to finalize the change.</p>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 border border-[#C9A84C]/30 text-[#C9A84C] font-bold text-sm tracking-wide uppercase hover:bg-[#C9A84C]/10">
            Request Account Change
          </button>
        </div>
      )}
    </div>
  );
}