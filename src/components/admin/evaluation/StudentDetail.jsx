import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronLeft } from "lucide-react";
import EvaluationChecklist from "@/components/admin/curriculum/EvaluationChecklist";
import TestingBadge from "@/components/admin/curriculum/TestingBadge";
import StripePanel from "@/components/admin/curriculum/StripePanel";
import RecentFeedback from "@/components/admin/evaluation/RecentFeedback";
import RankUpPanel from "@/components/admin/evaluation/RankUpPanel";

export default function StudentDetail({ student, evaluator, sessionId, enrollments, onBack, onStudentUpdated }) {
  const [belts, setBelts] = useState([]);
  const [selectedBelt, setSelectedBelt] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stripes, setStripes] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadBeltData = async (belt) => {
    if (!belt || !student) return;
    try {
      const [crit, prog, att, str] = await Promise.all([
        base44.entities.CurriculumCriteria.filter({ rank_id: belt.id }),
        base44.entities.StudentCriteriaProgress.filter({ student_id: student.id }),
        base44.entities.AttendanceRecord.filter({ user_id: student.id }).catch(() => []),
        base44.entities.StripeAward.filter({ student_id: student.id, rank_id: belt.id }).catch(() => []),
      ]);
      crit.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCriteria(crit);
      setProgress(prog);
      setAttendance(att);
      setStripes(str);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      if (!student) return;
      setDetailLoading(true);
      setSelectedBelt(null);
      setCriteria([]);
      setProgress([]);
      setAttendance([]);
      setStripes([]);
      try {
        const studentEnrollments = enrollments.filter(e => e.user_id === student.id || e.user_email === student.email);
        const studentProgramId = studentEnrollments[0]?.program_id;
        const allBelts = await base44.entities.RankBelt.filter({ program_id: studentProgramId });
        allBelts.sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));
        setBelts(allBelts);
        const matchingBelt = allBelts.find(b => b.belt_name === student.belt_rank) || allBelts[0];
        if (matchingBelt) {
          setSelectedBelt(matchingBelt);
          await loadBeltData(matchingBelt);
        }
      } catch (e) { console.error(e); }
      setDetailLoading(false);
    };
    load();
  }, [student, enrollments]);

  const selectBelt = (belt) => {
    setSelectedBelt(belt);
    loadBeltData(belt);
  };

  const masteredCount = progress.filter(p => p.status === "mastered" && criteria.some(c => c.id === p.criteria_id)).length;
  const classCount = attendance.length;
  const weeksEnrolled = student?.join_date ? Math.floor((new Date() - new Date(student.join_date)) / (7 * 24 * 60 * 60 * 1000)) : 0;

  if (detailLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-[#A8A9AD] hover:text-white">
        <ChevronLeft size={18} /> Back to Live Mat
      </button>

      <div className="border border-[#A8A9AD]/20 bg-black p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-lg">{student.full_name?.charAt(0) || "?"}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">{student.full_name}</h2>
            <p className="text-xs text-[#A8A9AD]">{student.belt_rank || "No belt assigned"} • {classCount} classes attended</p>
          </div>
        </div>
        {belts.length > 0 && (
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Evaluating Belt</label>
            <select value={selectedBelt?.id || ""} onChange={e => selectBelt(belts.find(b => b.id === e.target.value))} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              {belts.map(b => <option key={b.id} value={b.id}>{b.belt_name} (Rank {b.rank_order})</option>)}
            </select>
          </div>
        )}
      </div>

      <RecentFeedback studentId={student.id} />

      {selectedBelt && (
        <>
          <TestingBadge
            criteriaCount={criteria.length}
            masteredCount={masteredCount}
            minClasses={selectedBelt.min_classes_required}
            actualClasses={classCount}
            minTime={selectedBelt.min_time_in_grade}
            actualTime={weeksEnrolled}
          />
          <div>
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Criteria Checklist</h3>
            <EvaluationChecklist criteria={criteria} progress={progress} student={student} evaluator={evaluator} sessionId={sessionId} onProgressUpdate={() => loadBeltData(selectedBelt)} />
          </div>
          <StripePanel student={student} rankId={selectedBelt.id} stripes={stripes} onUpdate={() => loadBeltData(selectedBelt)} />
          <RankUpPanel student={student} belts={belts} currentBelt={selectedBelt} onUpdate={onStudentUpdated} />
        </>
      )}
    </div>
  );
}