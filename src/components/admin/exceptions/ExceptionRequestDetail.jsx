import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { X, Loader2, Check, XCircle, User, Calendar, FileText } from "lucide-react";

export default function ExceptionRequestDetail({ request, onClose, onProcessed }) {
  const { user: adminUser } = useAuth();
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  const [processing, setProcessing] = useState(null);

  const getGuardianEmail = async (familyId) => {
    if (!familyId) return null;
    const family = await base44.entities.FamilyGroup.get(familyId).catch(() => null);
    if (!family?.primary_contact_id) return null;
    const guardians = await base44.entities.User.filter({ id: family.primary_contact_id }).catch(() => []);
    return guardians[0]?.email || null;
  };

  const handleApprove = async () => {
    setProcessing("approve");
    try {
      await base44.entities.ExceptionRequest.update(request.id, {
        status: "approved",
        admin_notes: adminNotes,
        admin_id: adminUser?.id || "",
        admin_name: adminUser?.full_name || "",
        processed_date: new Date().toISOString(),
      });

      const students = await base44.entities.User.filter({ id: request.student_id }).catch(() => []);
      const student = students[0];
      if (student) {
        const existing = student.approved_program_overrides || [];
        if (!existing.includes(request.target_program_id)) {
          await base44.entities.User.update(student.id, {
            approved_program_overrides: [...existing, request.target_program_id],
          });
        }
      }

      const guardianEmail = await getGuardianEmail(request.family_id);
      if (guardianEmail) {
        const appUrl = window.location.origin;
        await base44.integrations.Core.SendEmail({
          to: guardianEmail,
          subject: `Age Override Approved for ${request.student_name}`,
          body: `Great news! Instructor ${adminUser?.full_name || "an instructor"} has approved ${request.student_name}'s entry into ${request.target_program_name}. Click here to complete your registration: ${appUrl}/portal/wallet`,
        });
      }
      onProcessed();
    } catch (e) {
      alert("Failed to approve request: " + e.message);
    }
    setProcessing(null);
  };

  const handleDeny = async () => {
    setProcessing("deny");
    try {
      await base44.entities.ExceptionRequest.update(request.id, {
        status: "denied",
        admin_notes: adminNotes,
        admin_id: adminUser?.id || "",
        admin_name: adminUser?.full_name || "",
        processed_date: new Date().toISOString(),
      });

      const allPrograms = await base44.entities.Program.filter({ status: "active" }).catch(() => []);
      const ageAppropriate = allPrograms.find(p =>
        request.student_age != null &&
        (p.age_minimum === 0 || request.student_age >= p.age_minimum) &&
        (p.age_maximum === 0 || request.student_age <= p.age_maximum)
      );

      const guardianEmail = await getGuardianEmail(request.family_id);
      if (guardianEmail) {
        const appUrl = window.location.origin;
        await base44.integrations.Core.SendEmail({
          to: guardianEmail,
          subject: `Update on ${request.student_name}'s Program Request`,
          body: `Thank you for your interest in ${request.target_program_name}. After review, we recommend that ${request.student_name} enroll in an age-appropriate program for their safety and development.${ageAppropriate ? ` We suggest "${ageAppropriate.program_name}" — please complete your registration here: ${appUrl}/portal/wallet` : ` Please browse our available programs here: ${appUrl}/portal/wallet`}`,
        });
      }
      onProcessed();
    } catch (e) {
      alert("Failed to deny request: " + e.message);
    }
    setProcessing(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Age Override Request</h2>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#A8A9AD]/20 p-4">
              <div className="flex items-center gap-2 text-xs text-[#A8A9AD] mb-1"><User size={12} /> Student</div>
              <p className="text-sm font-medium">{request.student_name}</p>
              <p className="text-xs text-[#A8A9AD]">Age: {request.student_age ?? "—"}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-4">
              <div className="flex items-center gap-2 text-xs text-[#A8A9AD] mb-1"><Calendar size={12} /> Target Program</div>
              <p className="text-sm font-medium">{request.target_program_name}</p>
            </div>
          </div>

          <div className="border border-[#A8A9AD]/20 p-4">
            <div className="flex items-center gap-2 text-xs text-[#A8A9AD] mb-2"><FileText size={12} /> Parent's Justification</div>
            <p className="text-sm text-white">{request.reason_for_request}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#A8A9AD]">
            <Calendar size={12} />
            Requested on {new Date(request.created_date).toLocaleDateString()}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Admin Notes (Internal)</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Evaluated him on Tuesday, he is ready for the older class."
            className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={processing !== null}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-red-400/30 text-red-400 font-bold text-sm tracking-wide uppercase hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            {processing === "deny" ? <Loader2 size={18} className="animate-spin" /> : <><XCircle size={18} /> Deny</>}
          </button>
          <button
            onClick={handleApprove}
            disabled={processing !== null}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
          >
            {processing === "approve" ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Approve</>}
          </button>
        </div>
      </div>
    </div>
  );
}