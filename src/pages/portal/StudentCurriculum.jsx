import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import TrainingVault from "@/components/portal/curriculum/TrainingVault";
import ProgressTracker from "@/components/portal/curriculum/ProgressTracker";
import JourneyMap from "@/components/portal/curriculum/JourneyMap";
import FeedbackInbox from "@/components/portal/curriculum/FeedbackInbox";
import { Loader2, BookOpen, Map, MessageSquare } from "lucide-react";
import { useCommunityAccess } from "@/lib/CommunityAccessContext";
import LockedCurriculum from "@/components/portal/community/LockedCurriculum";

export default function StudentCurriculum() {
  const { user } = useAuth();
  const { activeProfile } = useFamily();
  const { hasAccess, isChecking } = useCommunityAccess();
  const [tab, setTab] = useState("handbook");
  const [belts, setBelts] = useState([]);
  const [currentBelt, setCurrentBelt] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [allCriteria, setAllCriteria] = useState([]);
  const [progress, setProgress] = useState([]);
  const [stripes, setStripes] = useState([]);
  const [criteriaByBelt, setCriteriaByBelt] = useState({});
  const [categoriesByBelt, setCategoriesByBelt] = useState({});
  const [stripesByBelt, setStripesByBelt] = useState({});
  const [enrollmentDate, setEnrollmentDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const profile = activeProfile || user;

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) { setLoading(false); return; }
      try {
        const enrollments = await base44.entities.Enrollment.filter({ user_id: profile.id, status: "active" }).catch(() => []);
        const allEnrollments = await base44.entities.Enrollment.filter({ user_email: profile.email }).catch(() => []);
        const studentEnrollments = [...enrollments, ...allEnrollments];
        const programId = studentEnrollments[0]?.program_id;
        setEnrollmentDate(studentEnrollments[0]?.start_date);
        const programs = await base44.entities.Program.list().catch(() => []);
        const fallbackProgramId = programId || programs[0]?.id;

        if (!fallbackProgramId) { setLoading(false); return; }

        const allBelts = await base44.entities.RankBelt.filter({ program_id: fallbackProgramId });
        allBelts.sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));
        setBelts(allBelts);

        const matchingBelt = allBelts.find(b => b.belt_name === profile.belt_rank) || allBelts[0];
        setCurrentBelt(matchingBelt);

        // Load criteria for all belts (for journey map)
        const criteriaPromises = allBelts.map(b => base44.entities.CurriculumCriteria.filter({ rank_id: b.id }).catch(() => []));
        const criteriaResults = await Promise.all(criteriaPromises);
        const criteriaByBelt = {};
        const allCrit = [];
        allBelts.forEach((b, i) => { criteriaByBelt[b.id] = criteriaResults[i]; allCrit.push(...criteriaResults[i]); });
        setAllCriteria(allCrit);

        // Load categories for all belts
        const categoryPromises = allBelts.map(b => base44.entities.CurriculumCategory.filter({ rank_id: b.id }).catch(() => []));
        const categoryResults = await Promise.all(categoryPromises);
        const catMap = {};
        allBelts.forEach((b, i) => { catMap[b.id] = categoryResults[i]; });
        setCategoriesByBelt(catMap);

        // Set current belt criteria
        setCriteria(criteriaByBelt[matchingBelt?.id] || []);

        // Load progress and stripes
        const [prog, str] = await Promise.all([
          base44.entities.StudentCriteriaProgress.filter({ student_id: profile.id }).catch(() => []),
          base44.entities.StripeAward.filter({ student_id: profile.id }).catch(() => []),
        ]);
        setProgress(prog);
        setStripes(str);
        setCriteriaByBelt(criteriaByBelt);
        setStripesByBelt(allBelts.reduce((acc, b) => {
          acc[b.id] = str.filter(s => s.rank_id === b.id);
          return acc;
        }, {}));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [profile?.id, profile?.belt_rank]);

  const tabs = [
    { id: "handbook", label: "Training", icon: BookOpen },
    { id: "journey", label: "Journey", icon: Map },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ];

  if (isChecking) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  if (!hasAccess) return <LockedCurriculum />;

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  if (belts.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
        <BookOpen size={32} className="text-[#A8A9AD] mx-auto mb-3" />
        <p className="text-[#A8A9AD]">Your curriculum is being set up. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">{profile?.belt_rank || "Student"}</p>
        <h1 className="text-3xl font-bold">My Journey</h1>
      </div>

      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 overflow-x-auto scrollbar-hide w-full sm:w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide whitespace-nowrap transition-colors ${tab === t.id ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "handbook" && (
        <>
          <ProgressTracker studentId={profile.id} belt={currentBelt} enrollmentDate={enrollmentDate} />
          <TrainingVault belts={belts} currentBeltId={currentBelt?.id} criteriaByBelt={criteriaByBelt} categoriesByBelt={categoriesByBelt} progress={progress} studentId={profile.id} enrollmentDate={enrollmentDate} />
        </>
      )}
      {tab === "journey" && <JourneyMap belts={belts} criteriaMap={criteriaByBelt} progress={progress} currentBeltId={currentBelt?.id} stripesMap={stripesByBelt} />}
      {tab === "feedback" && <FeedbackInbox progress={progress} criteria={allCriteria} />}
    </div>
  );
}