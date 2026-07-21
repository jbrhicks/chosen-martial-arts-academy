import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Award, HelpCircle, AlertTriangle, HeartPulse, Check } from "lucide-react";

const flagTypes = [
  { id: "ready_to_test", label: "Ready to Test", icon: Award, color: "text-[#C9A84C]", border: "border-[#C9A84C]/30", bg: "bg-[#C9A84C]/10" },
  { id: "needs_help", label: "Needs Help", icon: HelpCircle, color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-400/10" },
  { id: "behavior", label: "Behavior Issue", icon: AlertTriangle, color: "text-orange-400", border: "border-orange-400/30", bg: "bg-orange-400/10" },
  { id: "injury", label: "Injury", icon: HeartPulse, color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/10" },
];

export default function StudentFlagModal({ student, instructor, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      await base44.entities.InstructorStudentFlag.create({
        student_id: student.user_id,
        student_name: student.full_name,
        instructor_id: instructor.id,
        instructor_name: instructor.full_name,
        class_name: student.class_name || "",
        flag_type: selectedType,
        notes: notes.trim(),
        status: "pending",
      });
      setSubmitted(true);
      setTimeout(onClose, 1200);
    } catch (e) { alert("Failed to submit flag: " + e.message); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-2 border-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-[#C9A84C]" />
            </div>
            <p className="text-lg font-bold">Flag Submitted</p>
            <p className="text-sm text-[#A8A9AD] mt-1">Sent to the Debrief Inbox.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Post-Class Debrief</h2>
                <p className="text-sm text-[#A8A9AD]">{student.full_name} · {student.belt_rank || "No belt"}</p>
              </div>
              <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>

            <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Select Flag Type</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {flagTypes.map((ft) => {
                const Icon = ft.icon;
                const isSelected = selectedType === ft.id;
                return (
                  <button
                    key={ft.id}
                    onClick={() => setSelectedType(ft.id)}
                    className={`flex flex-col items-center gap-2 p-3 border transition-all ${isSelected ? `${ft.border} ${ft.bg}` : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"}`}
                  >
                    <Icon size={20} className={isSelected ? ft.color : "text-[#A8A9AD]"} />
                    <span className={`text-xs font-medium ${isSelected ? ft.color : "text-[#A8A9AD]"}`}>{ft.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add context for the front desk..."
                className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedType || submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Submit Flag
            </button>
          </>
        )}
      </div>
    </div>
  );
}