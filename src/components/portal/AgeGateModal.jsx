import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";

export default function AgeGateModal({ studentName, studentAge, programName, programId, studentId, familyId, onClose }) {
  const [step, setStep] = useState("gate");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.ExceptionRequest.create({
        family_id: familyId || "",
        student_id: studentId,
        student_name: studentName,
        student_age: studentAge,
        target_program_id: programId,
        target_program_name: programName,
        reason_for_request: reason.trim(),
        status: "pending",
      });
      setStep("submitted");
    } catch (e) {
      alert("Failed to submit request. Please try again or contact the academy.");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
        {step === "gate" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center">
                <AlertCircle size={24} className="text-[#C9A84C]" />
              </div>
              <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <h2 className="text-xl font-bold mb-3">Age Requirement Notice</h2>
            <p className="text-sm text-[#A8A9AD] mb-6">
              It looks like <span className="text-white font-medium">{studentName}</span> doesn't meet the standard age requirement for <span className="text-[#C9A84C] font-medium">{programName}</span>. Sometimes, instructors grant exceptions for students with prior experience.
            </p>
            <button onClick={() => setStep("form")} className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#A8A9AD]/40 text-[#A8A9AD] font-bold text-sm tracking-wide uppercase hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
              <ShieldCheck size={18} /> Request Instructor Evaluation / Age Override
            </button>
            <button onClick={onClose} className="w-full text-sm text-[#A8A9AD] hover:text-white py-3 mt-2">Cancel</button>
          </>
        )}

        {step === "form" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Age Override Request</h2>
              <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-[#A8A9AD] mb-4">
              Tell us about {studentName}'s experience and why you believe they're ready for {programName}. An instructor will review your request.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              autoFocus
              placeholder="e.g., My child is 6 but has 2 years of prior martial arts experience and is very focused."
              className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none"
            />
            <button onClick={handleSubmit} disabled={submitting || !reason.trim()} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Submit Request"}
            </button>
          </>
        )}

        {step === "submitted" && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-[#C9A84C] flex items-center justify-center">
              <CheckCircle size={32} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold mb-3">Request Submitted!</h2>
            <p className="text-sm text-[#A8A9AD] mb-6">An instructor will review your request for {programName}. You'll receive an email notification once it's been reviewed.</p>
            <button onClick={onClose} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}