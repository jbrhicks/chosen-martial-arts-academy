import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SessionBar from "@/components/admin/evaluation/SessionBar";
import LiveMatGrid from "@/components/admin/evaluation/LiveMatGrid";
import StudentDetail from "@/components/admin/evaluation/StudentDetail";
import ClassFilter from "@/components/admin/evaluation/ClassFilter";
import { Loader2 } from "lucide-react";

export default function InstructorEvaluation() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [checkedInStudents, setCheckedInStudents] = useState([]);
  const [readinessMap, setReadinessMap] = useState({});
  const [gridLoading, setGridLoading] = useState(false);
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [currentClassName, setCurrentClassName] = useState(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const load = async () => {
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const [users, progs, allEnroll, activeSessions, todaySched] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Program.list(),
        base44.entities.Enrollment.list(),
        base44.entities.LiveClassSession.filter({ status: "active", instructor_id: user.id }).catch(() => []),
        base44.entities.ClassSchedule.filter({ is_active: true, day_of_week: today }).catch(() => []),
      ]);
      setStudents(users.filter(u => u.role !== "admin"));
      setPrograms(progs);
      setEnrollments(allEnroll);
      setSession(activeSessions[0] || null);
      setTodayClasses(todaySched.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const detectCurrentClass = (classes) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return classes.find(c => {
      if (!c.start_time) return false;
      const start = c.start_time.slice(0, 5);
      const end = c.end_time ? c.end_time.slice(0, 5) : null;
      if (end) return currentTime >= start && currentTime <= end;
      const [h, m] = start.split(":").map(Number);
      const startMin = h * 60 + m;
      const [ch, cm] = currentTime.split(":").map(Number);
      const currentMin = ch * 60 + cm;
      return currentMin >= startMin && currentMin <= startMin + 90;
    });
  };

  useEffect(() => {
    if (todayClasses.length > 0 && !hasAutoSelected) {
      const current = detectCurrentClass(todayClasses);
      if (current) {
        setCurrentClassName(current.class_name);
        setSelectedClassFilter(current.class_name);
      }
      setHasAutoSelected(true);
    }
  }, [todayClasses, hasAutoSelected]);

  const computeReadiness = async (checkedIn) => {
    if (checkedIn.length === 0) { setReadinessMap({}); return; }
    try {
      const studentIds = checkedIn.map(s => s.id);
      const studentEnrollments = enrollments.filter(e => studentIds.includes(e.user_id) || checkedIn.some(s => s.email === e.user_email));
      const programIds = [...new Set(studentEnrollments.map(e => e.program_id).filter(Boolean))];

      const [beltBatches, allProgress, ...attendanceArrays] = await Promise.all([
        programIds.length > 0 ? Promise.all(programIds.map(pid => base44.entities.RankBelt.filter({ program_id: pid }).catch(() => []))) : Promise.resolve([]),
        base44.entities.StudentCriteriaProgress.list('-updated_date', 1000).catch(() => []),
        ...checkedIn.map(s => base44.entities.AttendanceRecord.filter({ user_id: s.id }).catch(() => [])),
      ]);

      const flatBelts = beltBatches.flat();
      const beltIds = flatBelts.map(b => b.id);
      const criteriaBatches = beltIds.length > 0
        ? await Promise.all(beltIds.map(bid => base44.entities.CurriculumCriteria.filter({ rank_id: bid }).catch(() => [])))
        : [];
      const allCriteria = criteriaBatches.flat();

      const map = {};
      checkedIn.forEach((s, idx) => {
        const studentEnroll = studentEnrollments.find(e => e.user_id === s.id || e.user_email === s.email);
        const programId = studentEnroll?.program_id;
        const programBelts = flatBelts.filter(b => b.program_id === programId);
        const currentBelt = programBelts.find(b => b.belt_name === s.belt_rank) || programBelts[0];
        if (!currentBelt) { map[s.id] = { ready: false }; return; }

        const beltCriteria = allCriteria.filter(c => c.rank_id === currentBelt.id);
        const studentProgress = allProgress.filter(p => p.student_id === s.id && beltCriteria.some(c => c.id === p.criteria_id));
        const masteredCount = studentProgress.filter(p => p.status === "mastered").length;
        const classCount = attendanceArrays[idx]?.length || 0;
        const weeksEnrolled = s.join_date ? Math.floor((new Date() - new Date(s.join_date)) / (7 * 24 * 60 * 60 * 1000)) : 0;

        const criteriaMet = beltCriteria.length > 0 && masteredCount >= beltCriteria.length;
        const classesMet = classCount >= (currentBelt.min_classes_required || 0);
        const timeMet = weeksEnrolled >= (currentBelt.min_time_in_grade || 0);

        map[s.id] = { ready: criteriaMet && classesMet && timeMet };
      });

      setReadinessMap(map);
    } catch (e) { console.error(e); }
  };

  const loadCheckedInStudents = useCallback(async () => {
    if (students.length === 0) return;
    setGridLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const recentAtt = await base44.entities.AttendanceRecord.list('-check_in_date', 500);
      const todayAtt = recentAtt.filter(a => {
        if (!a.check_in_date) return false;
        return new Date(a.check_in_date).toISOString().split("T")[0] === todayStr;
      });
      setTodayAttendance(todayAtt);
      const checkedInIds = [...new Set(todayAtt.map(a => a.user_id))];
      const checkedIn = students.filter(s => checkedInIds.includes(s.id));
      setCheckedInStudents(checkedIn);
      await computeReadiness(checkedIn);
    } catch (e) { console.error(e); }
    setGridLoading(false);
  }, [students]);

  useEffect(() => {
    if (students.length > 0) loadCheckedInStudents();
  }, [loadCheckedInStudents]);

  useEffect(() => {
    const unsubscribe = base44.entities.AttendanceRecord.subscribe(() => {
      loadCheckedInStudents();
    });
    return unsubscribe;
  }, [loadCheckedInStudents]);

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const program = programs.find(p => p.id === selectedProgramId);
      const newSession = await base44.entities.LiveClassSession.create({
        program_id: selectedProgramId || undefined,
        program_name: program?.program_name,
        instructor_id: user.id,
        instructor_name: user.full_name,
        start_time: new Date().toISOString(),
        status: "active",
      });
      setSession(newSession);
      setSelectedProgramId("");
    } catch (e) { alert("Failed to start session."); }
    setStarting(false);
  };

  const handleEndSession = async () => {
    if (!session) return;
    if (!confirm("End this class session?")) return;
    try {
      await base44.entities.LiveClassSession.update(session.id, { status: "completed", end_time: new Date().toISOString() });
      setSession(null);
    } catch (e) { alert("Failed to end session."); }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setSearch("");
  };

  const handleStudentUpdated = async () => {
    const users = await base44.entities.User.list();
    const newStudents = users.filter(u => u.role !== "admin");
    setStudents(newStudents);
    const updated = newStudents.find(u => u.id === selectedStudent?.id);
    if (updated) setSelectedStudent(updated);
  };

  const searchResults = search.length >= 1
    ? students.filter(s => {
        const name = (s.full_name || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      }).slice(0, 8)
    : [];

  const displayedStudents = selectedClassFilter === "all"
    ? checkedInStudents
    : checkedInStudents.filter(s => todayAttendance.some(a => a.user_id === s.id && a.class_name === selectedClassFilter));

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Mat-Side Evaluation</p>
        <h1 className="text-3xl font-bold">Instructor Evaluation Dashboard</h1>
      </div>

      <SessionBar
        session={session}
        onStart={handleStartSession}
        onEnd={handleEndSession}
        starting={starting}
        search={search}
        onSearchChange={setSearch}
        searchResults={searchResults}
        onSelectStudent={selectStudent}
        programs={programs}
        onProgramSelect={setSelectedProgramId}
        selectedProgramId={selectedProgramId}
      />

      {selectedStudent ? (
        <StudentDetail
          student={selectedStudent}
          evaluator={user}
          sessionId={session?.id}
          enrollments={enrollments}
          onBack={() => setSelectedStudent(null)}
          onStudentUpdated={handleStudentUpdated}
        />
      ) : (
        <>
          <ClassFilter
            todayClasses={todayClasses}
            selectedClass={selectedClassFilter}
            onSelectClass={setSelectedClassFilter}
            currentClassName={currentClassName}
          />
          <LiveMatGrid
            students={displayedStudents}
            readinessMap={readinessMap}
            onSelect={selectStudent}
            loading={gridLoading}
          />
        </>
      )}
    </div>
  );
}