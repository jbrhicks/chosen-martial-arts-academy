import { MessageSquare } from "lucide-react";

export default function FeedbackInbox({ progress, criteria }) {
  const feedback = progress
    .filter(p => p.instructor_notes && p.instructor_notes.trim())
    .map(p => {
      const criterion = criteria.find(c => c.id === p.criteria_id);
      return {
        id: p.id,
        title: p.criteria_title || criterion?.title || "Unknown Criterion",
        notes: p.instructor_notes,
        status: p.status,
        evaluator: p.evaluator_name,
        date: p.date_mastered || p.updated_date,
      };
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (feedback.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
        <MessageSquare size={32} className="text-[#A8A9AD] mx-auto mb-3" />
        <p className="text-[#A8A9AD]">No instructor feedback yet. Your notes will appear here after your next evaluation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Instructor Feedback</h2>
        <p className="text-sm text-[#A8A9AD]">Personalized notes from your instructors to guide your home practice.</p>
      </div>
      <div className="space-y-3">
        {feedback.map(f => (
          <div key={f.id} className="border border-[#A8A9AD]/20 bg-black p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-[#A8A9AD]">{f.evaluator ? `From ${f.evaluator}` : ""} {f.date ? `• ${new Date(f.date).toLocaleDateString()}` : ""}</p>
              </div>
              {f.status === "mastered" && <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">Mastered</span>}
              {f.status === "practicing" && <span className="text-[9px] tracking-widest uppercase text-blue-400 border border-blue-400/30 px-2 py-0.5">Practicing</span>}
            </div>
            <p className="text-sm text-white pl-10">{f.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}