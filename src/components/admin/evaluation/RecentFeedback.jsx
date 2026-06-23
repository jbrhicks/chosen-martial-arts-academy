import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Loader2 } from "lucide-react";

export default function RecentFeedback({ studentId }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const logs = await base44.entities.EvaluationLog.filter({ student_id: studentId });
        const withNotes = logs
          .filter(l => l.instructor_notes)
          .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
          .slice(0, 3);
        setFeedback(withNotes);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[#A8A9AD]" /></div>;
  if (feedback.length === 0) return null;

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-[#C9A84C]" />
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#C9A84C]">Recent Feedback</h3>
      </div>
      <div className="space-y-2">
        {feedback.map((f) => (
          <div key={f.id} className="text-xs border-l-2 border-[#C9A84C]/30 pl-3">
            <p className="text-white">"{f.instructor_notes}"</p>
            <p className="text-[#A8A9AD] mt-1">
              {f.instructor_name || "Instructor"}
              {f.timestamp ? ` • ${new Date(f.timestamp).toLocaleDateString()}` : ""}
              {f.criteria_title ? ` • ${f.criteria_title}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}