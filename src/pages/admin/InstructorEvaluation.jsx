import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import EvaluationChecklist from "@/components/admin/curriculum/EvaluationChecklist";
import TestingBadge from "@/components/admin/curriculum/TestingBadge";
import StripePanel from "@/components/admin/curriculum/StripePanel";
import { Loader2, Search, User } from "lucide-react";

export default function InstructorEvaluation() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [belts, setBelts] = useState([]);
  const [selectedBelt, setSelectedBelt] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stripes, setStripes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    try {
      const [users, progs, allEnroll] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Program.list(),
        base44.entities.Enrollment.list(),
      ]);
      setStudents(users.filter(u => u.role !== "admin"));
      setPrograms(progs);
      setEnrollments(allEnroll);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadStudentData = async (student) => {
    if (!student) return;
    setDetailLoading(true);
    setSelectedBelt(null);
    try {
      const studentEnrollments = enrollments.filter(e => e.user_id === student.id || e.user_email === student.email);
      const studentProgramId = studentEnrollments[0]?.program_id;
      const allBelts = await base44.entities.RankBelt.filter({ program_id: studentProgramId });
      allBelts.sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));
      setBelts(allBelts);
      const matchingBelt = allBelts.find(b => b.belt_name === student.belt_rank) || allBelts[0];
      if (matchingBelt) {
        setSelectedBelt(matchingBelt);
        await loadBeltData(student, matchingBelt);
      }
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  };

  const loadBeltData = async (student, belt) => {
    if (!belt) return;
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

  const selectStudent = (student) => {
    setSelectedStudent(student);
    loadStudentData(student);
  };

  const selectBelt = (belt) => {
    setSelectedBelt(belt);
    if (selectedStudent) loadBeltData(selectedStudent, belt);
  };

  const filteredStudents = students.filter(s => {
    const name = (s.full_name || "").toLowerCase();
    return name.includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase());
  });

  const masteredCount = progress.filter(p => p.status === "mastered" && criteria.some(c => c.id === p.criteria_id)).length;
  const classCount = attendance.length;
  const weeksEnrolled = selectedStudent?.join_date ? Math.floor((new Date() - new Date(selectedStudent.join_date)) / (7 * 24 * 60 * 60 * 1000)) : 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Mat-Side Evaluation</p>
        <h1 className="text-3xl font-bold">Instructor Evaluation Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student selector */}
        <div className="lg:col-span-1">
          <div className="border border-[#A8A9AD]/20 bg-black">
            <div className="p-4 border-b border-[#A8A9AD]/10">
              <div className="flex items-center gap-2 border border-[#A8A9AD]/20 px-3 py-2">
                <Search size={14} className="text-[#A8A9AD]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="bg-transparent text-sm text-white focus:outline-none flex-1" />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#A8A9AD]/10">
              {filteredStudents.length === 0 ? (
                <p className="text-center py-8 text-[#A8A9AD] text-sm">No students found.</p>
              ) : (
                filteredStudents.map(s => (
                  <button key={s.id} onClick={() => selectStudent(s)} className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${selectedStudent?.id === s.id ? "bg-[#C9A84C]/10" : "hover:bg-white/5"}`}>
                    <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                      <span className="text-[#C9A84C] font-bold text-xs">{s.full_name?.charAt(0) || "?"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.full_name}</p>
                      <p className="text-xs text-[#A8A9AD] truncate">{s.belt_rank || "No belt"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Evaluation panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedStudent ? (
            <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
              <User size={32} className="text-[#A8A9AD] mx-auto mb-3" />
              <p className="text-[#A8A9AD]">Select a student to begin evaluation.</p>
            </div>
          ) : detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
          ) : (
            <>
              {/* Student info */}
              <div className="border border-[#A8A9AD]/20 bg-black p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                    <span className="text-[#C9A84C] font-bold text-lg">{selectedStudent.full_name?.charAt(0) || "?"}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selectedStudent.full_name}</h2>
                    <p className="text-xs text-[#A8A9AD]">{selectedStudent.belt_rank || "No belt assigned"} • {classCount} classes attended</p>
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
                    <EvaluationChecklist criteria={criteria} progress={progress} student={selectedStudent} evaluator={user} onProgressUpdate={() => loadBeltData(selectedStudent, selectedBelt)} />
                  </div>
                  <StripePanel student={selectedStudent} rankId={selectedBelt.id} stripes={stripes} onUpdate={() => loadBeltData(selectedStudent, selectedBelt)} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}