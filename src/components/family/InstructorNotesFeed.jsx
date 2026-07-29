import { useFamilyDashboard } from "@/hooks/useFamilyDashboard";
import { Loader2, AlertTriangle, Award, XCircle, MessageSquare } from "lucide-react";

const FLAG_STYLES = {
  ready_to_test: { icon: Award, color: "text-green-400", bg: "bg-green-400/10", label: "Ready to Test" },
  needs_help: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Needs Help" },
  behavior: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10", label: "Behavior Note" },
  injury: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Injury" },
};

export default function InstructorNotesFeed() {
  const { data, loading } = useFamilyDashboard();

  if (loading || !data) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  const students = data.students || [];
  const allFlags = [];
  students.forEach(s => {
    (s.flags || []).forEach(f => {
      allFlags.push({ ...f, student_name: s.full_name });
    });
  });
  allFlags.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Instructor Notes</h2>
        <p className="text-sm text-[#A8A9AD]">Observations and flags from your instructors about your students.</p>
      </div>

      {allFlags.length > 0 ? (
        <div className="space-y-3">
          {allFlags.map((f, i) => {
            const fs = FLAG_STYLES[f.flag_type] || FLAG_STYLES.needs_help;
            const FIcon = fs.icon;
            return (
              <div key={i} className={`border p-4 ${fs.bg} border-[#A8A9AD]/20`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${fs.bg} ${fs.color}`}>
                    <FIcon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium">{f.student_name}</p>
                      <span className={`text-[10px] tracking-widest uppercase font-bold ${fs.color}`}>{fs.label}</span>
                    </div>
                    {f.notes && <p className="text-sm text-[#A8A9AD] mt-2">{f.notes}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#A8A9AD]/70">
                      {f.instructor_name && <span>By {f.instructor_name}</span>}
                      {f.class_name && <span>• {f.class_name}</span>}
                      {f.created_date && <span>• {new Date(f.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <MessageSquare size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
          <p className="text-[#A8A9AD] text-sm">No instructor notes yet. When instructors flag your students, you'll see their observations here.</p>
        </div>
      )}
    </div>
  );
}