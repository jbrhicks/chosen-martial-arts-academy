import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BookOpen, Calendar } from "lucide-react";
import LessonPlanBuilder from "@/components/admin/lessons/LessonPlanBuilder";

export default function AdminLessonPlans() {
  const [programs, setPrograms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [progs, allPlans, allLinks] = await Promise.all([
        base44.entities.Program.list(),
        base44.entities.LessonPlan.list("-target_date", 200),
        base44.entities.LessonPlanLink.list().catch(() => []),
      ]);
      setPrograms(progs);
      setPlans(allPlans);
      setLinks(allLinks);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const formatDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Curriculum</p>
        <h1 className="text-3xl font-bold">Lesson Plan Playbook</h1>
      </div>

      <LessonPlanBuilder
        programs={programs}
        editingPlan={editingPlan}
        onSaved={() => { setEditingPlan(null); load(); }}
        onCancel={() => setEditingPlan(null)}
      />

      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen size={18} className="text-[#C9A84C]" /> Existing Plans</h2>
        {plans.length === 0 ? (
          <div className="border border-[#A8A9AD]/20 p-8 text-center text-[#A8A9AD] text-sm">No lesson plans yet. Create one above.</div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => {
              const planLinks = links.filter((l) => l.plan_id === plan.id);
              return (
                <button
                  key={plan.id}
                  onClick={() => setEditingPlan(plan)}
                  className={`w-full border p-4 text-left transition-colors flex items-center gap-4 ${
                    editingPlan?.id === plan.id ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 hover:border-[#C9A84C]/40"
                  }`}
                >
                  <Calendar size={16} className="text-[#A8A9AD] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.title || "Untitled"}</p>
                    <p className="text-xs text-[#A8A9AD]">{plan.program_name} · {formatDate(plan.target_date)} · {planLinks.length} video link{planLinks.length !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-xs text-[#C9A84C] shrink-0">Edit</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}