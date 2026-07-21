import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, BookOpen, Calendar, CheckCircle } from "lucide-react";
import LessonPlanBuilder from "@/components/admin/lessons/LessonPlanBuilder";
import SectionManager from "@/components/admin/lessons/SectionManager";

export default function AdminLessonPlans() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [progs, allPlans, allLinks, evts] = await Promise.all([
        base44.entities.Program.list(),
        base44.entities.LessonPlan.list("-target_date", 200),
        base44.entities.LessonPlanLink.list().catch(() => []),
        base44.entities.Event.list().catch(() => []),
      ]);
      setPrograms(progs);
      setPlans(allPlans);
      setLinks(allLinks);
      setEvents(evts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleApprove = async (planId) => {
    try {
      await base44.entities.LessonPlan.update(planId, {
        status: "published",
        review_requested: false,
        reviewed_by_id: user.id,
        reviewed_by_name: user.full_name,
      });
      load();
    } catch (e) { alert("Failed: " + e.message); }
  };

  const formatDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const statusBadge = (plan) => {
    if (plan.review_requested && plan.status !== "published") return { label: "Review Requested", cls: "text-orange-400 border-orange-400/30 bg-orange-400/10" };
    if (plan.status === "archived") return { label: "Archived", cls: "text-[#A8A9AD] border-[#A8A9AD]/30 bg-[#A8A9AD]/10" };
    if (plan.status === "published") return { label: "Published", cls: "text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10" };
    return { label: "Draft", cls: "text-gray-400 border-gray-400/30 bg-gray-400/10" };
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Curriculum</p>
        <h1 className="text-3xl font-bold">Lesson Plan Playbook</h1>
      </div>

      <SectionManager />

      <LessonPlanBuilder
        programs={programs}
        events={events}
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
              const badge = statusBadge(plan);
              return (
                <div key={plan.id} className={`border p-4 flex items-center gap-4 transition-colors ${editingPlan?.id === plan.id ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 hover:border-[#C9A84C]/40"}`}>
                  <Calendar size={16} className="text-[#A8A9AD] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.title || "Untitled"}</p>
                    <p className="text-xs text-[#A8A9AD]">{plan.program_name} · {plan.target_date ? formatDate(plan.target_date) : "No date"} · {planLinks.length} video link{planLinks.length !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={`text-[10px] tracking-widest uppercase border px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                  {plan.review_requested && plan.status !== "published" && (
                    <button onClick={() => handleApprove(plan.id)} className="flex items-center gap-1 px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold uppercase hover:bg-[#C9A84C]/10">
                      <CheckCircle size={12} /> Approve
                    </button>
                  )}
                  <button onClick={() => setEditingPlan(plan)} className="text-xs text-[#C9A84C] hover:text-[#E0C97A] shrink-0">Edit</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}