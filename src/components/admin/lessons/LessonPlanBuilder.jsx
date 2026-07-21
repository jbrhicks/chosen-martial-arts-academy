import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Save, Loader2, Trash2, Send, CheckCircle, Eye, Archive } from "lucide-react";
import ProgramSelector from "@/components/admin/lessons/ProgramSelector";
import LessonPlanSectionEditor from "@/components/admin/lessons/LessonPlanSectionEditor";
import RankGroupNotes from "@/components/admin/lessons/RankGroupNotes";
import CurriculumQuickTag from "@/components/admin/lessons/CurriculumQuickTag";

const getWeekRange = (dateStr) => {
  if (!dateStr) return { start: "", end: "" };
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
};

export default function LessonPlanBuilder({ programs, events, editingPlan, onSaved, onCancel }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [programId, setProgramId] = useState("");
  const [planType, setPlanType] = useState("ad_hoc");
  const [targetDate, setTargetDate] = useState("");
  const [weekOfDate, setWeekOfDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [universalNotes, setUniversalNotes] = useState("");
  const [rankGroupNotes, setRankGroupNotes] = useState({});
  const [linkedItems, setLinkedItems] = useState([]);
  const [status, setStatus] = useState("draft");
  const [reviewRequested, setReviewRequested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editingPlan) {
      setProgramId(editingPlan.program_id || "");
      setPlanType(editingPlan.plan_type || "ad_hoc");
      setTargetDate(editingPlan.target_date || "");
      setWeekOfDate(editingPlan.week_start_date || "");
      setSelectedEventId(editingPlan.event_id || "");
      setTitle(editingPlan.title || "");
      setUniversalNotes(editingPlan.universal_notes || "");
      setRankGroupNotes(editingPlan.rank_group_notes ? safeParse(editingPlan.rank_group_notes, {}) : {});
      setStatus(editingPlan.status || "draft");
      setReviewRequested(editingPlan.review_requested || false);

      if (editingPlan.sections) {
        setSections(safeParse(editingPlan.sections, []));
      } else if (editingPlan.plan_content) {
        setSections([{ section_name: "General", content: editingPlan.plan_content }]);
      } else {
        setSections([]);
      }
      loadLinks(editingPlan.id);
    } else {
      setProgramId(""); setPlanType("ad_hoc"); setTargetDate(""); setWeekOfDate("");
      setSelectedEventId(""); setTitle(""); setSections([]); setUniversalNotes("");
      setRankGroupNotes({}); setLinkedItems([]); setStatus("draft"); setReviewRequested(false);
    }
  }, [editingPlan]);

  const safeParse = (str, fallback) => { try { return JSON.parse(str); } catch { return fallback; } };

  const loadLinks = async (planId) => {
    const links = await base44.entities.LessonPlanLink.filter({ plan_id: planId }).catch(() => []);
    setLinkedItems(links.map((l) => ({
      criteria_id: l.criteria_id, criteria_title: l.criteria_title,
      video_url: l.video_url, embed_url: l.embed_url, thumbnail_url: l.thumbnail_url,
    })));
  };

  const handleAddLink = (item) => setLinkedItems([...linkedItems, item]);
  const handleRemoveLink = (cid) => setLinkedItems(linkedItems.filter((l) => l.criteria_id !== cid));

  const handleSave = async (publishNow = false) => {
    if (!programId || !planType) { alert("Please select a program and plan type."); return; }
    if (planType === "ad_hoc" && !targetDate) { alert("Please select a target date."); return; }
    if (planType === "weekly" && !weekOfDate) { alert("Please select a week."); return; }
    if (planType === "event" && !selectedEventId) { alert("Please select an event."); return; }

    setSaving(true);
    try {
      const program = programs.find((p) => p.id === programId);
      const weekRange = planType === "weekly" ? getWeekRange(weekOfDate) : { start: "", end: "" };
      const selectedEvent = planType === "event" ? events.find((e) => e.id === selectedEventId) : null;
      const eventDate = selectedEvent?.start_date ? new Date(selectedEvent.start_date).toISOString().split("T")[0] : "";

      const effectiveTargetDate = planType === "ad_hoc" ? targetDate : planType === "weekly" ? weekRange.start : eventDate;
      const dateLabel = planType === "weekly" ? `Week of ${weekRange.start}` : planType === "event" ? selectedEvent?.title || "Event" : effectiveTargetDate;

      const finalStatus = publishNow ? "published" : status;

      const planData = {
        title: title || `${program?.program_name || "Class"} — ${dateLabel}`,
        program_id: programId,
        program_name: program?.program_name || "",
        plan_type: planType,
        target_date: effectiveTargetDate || null,
        week_start_date: weekRange.start || null,
        week_end_date: weekRange.end || null,
        event_id: selectedEventId || null,
        event_title: selectedEvent?.title || null,
        sections: JSON.stringify(sections),
        universal_notes: universalNotes,
        rank_group_notes: JSON.stringify(rankGroupNotes),
        plan_content: sections.map((s) => `${s.section_name}:\n${s.content}`).join("\n\n"),
        status: finalStatus,
        review_requested: publishNow ? false : reviewRequested,
        author_admin_id: user.id,
        author_admin_name: user.full_name,
      };

      if (publishNow) {
        planData.reviewed_by_id = user.id;
        planData.reviewed_by_name = user.full_name;
      }

      let planId;
      if (editingPlan) {
        await base44.entities.LessonPlan.update(editingPlan.id, planData);
        planId = editingPlan.id;
        await base44.entities.LessonPlanLink.deleteMany({ plan_id: planId }).catch(() => {});
      } else {
        const created = await base44.entities.LessonPlan.create(planData);
        planId = created.id;
      }

      if (linkedItems.length > 0) {
        await base44.entities.LessonPlanLink.bulkCreate(linkedItems.map((item) => ({ plan_id: planId, ...item })));
      }

      onSaved();
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const handleRequestReview = async () => {
    setSaving(true);
    try {
      await handleSave(false);
      if (editingPlan) {
        await base44.entities.LessonPlan.update(editingPlan.id, { review_requested: true });
      }
      onSaved();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingPlan) return;
    if (!confirm("Delete this lesson plan?")) return;
    setDeleting(true);
    try {
      await base44.entities.LessonPlanLink.deleteMany({ plan_id: editingPlan.id }).catch(() => {});
      await base44.entities.LessonPlan.delete(editingPlan.id);
      onSaved();
    } catch (e) { alert("Failed to delete: " + e.message); }
    setDeleting(false);
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";
  const typeButtons = [
    { id: "ad_hoc", label: "Single Date" },
    { id: "weekly", label: "Entire Week" },
    { id: "event", label: "Specific Event" },
  ];

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
          {editingPlan ? "Edit Lesson Plan" : "New Lesson Plan"}
        </h3>
        <div className="flex items-center gap-2">
          {status === "published" && <span className="flex items-center gap-1 text-xs text-[#C9A84C]"><CheckCircle size={12} /> Published</span>}
          {status === "draft" && <span className="text-xs text-gray-400">Draft</span>}
          {reviewRequested && <span className="text-xs text-orange-400">Review Requested</span>}
        </div>
      </div>

      <ProgramSelector programs={programs} selectedId={programId} onSelect={setProgramId} />

      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Plan Type</label>
        <div className="flex gap-1">
          {typeButtons.map((tb) => (
            <button key={tb.id} type="button" onClick={() => setPlanType(tb.id)} className={`flex-1 px-3 py-2 text-xs font-medium border transition-colors ${planType === tb.id ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD] hover:border-[#C9A84C]/40"}`}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {planType === "ad_hoc" && (
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Target Date</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputClass} />
        </div>
      )}

      {planType === "weekly" && (
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Week Of (Monday)</label>
          <input type="date" value={weekOfDate} onChange={(e) => setWeekOfDate(e.target.value)} className={inputClass} />
          {weekOfDate && (
            <p className="text-xs text-[#C9A84C] mt-1.5">
              {(() => { const w = getWeekRange(weekOfDate); return `Covers ${w.start} through ${w.end}`; })()}
            </p>
          )}
        </div>
      )}

      {planType === "event" && (
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Select Event</label>
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className={inputClass}>
            <option value="">Select an event...</option>
            {events.sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0)).map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e.start_date ? new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Plan Title (optional)</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Week 3 — Side Kicks & Combinations" className={inputClass} />
      </div>

      <LessonPlanSectionEditor sections={sections} onChange={setSections} />

      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Universal Notes</label>
        <textarea value={universalNotes} onChange={(e) => setUniversalNotes(e.target.value)} rows={2} placeholder="Notes that apply to all students in this class..." className={inputClass + " resize-none"} />
      </div>

      <RankGroupNotes notes={rankGroupNotes} onChange={setRankGroupNotes} />

      <CurriculumQuickTag linkedItems={linkedItems} onAdd={handleAddLink} onRemove={handleRemoveLink} />

      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#A8A9AD]/20">
        <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 border border-[#A8A9AD]/30 text-white font-bold text-sm tracking-wide uppercase hover:bg-[#A8A9AD]/10 transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Draft
        </button>
        {!isAdmin && (
          <button onClick={handleRequestReview} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 border border-orange-400/30 text-orange-400 font-bold text-sm tracking-wide uppercase hover:bg-orange-400/10 transition-colors disabled:opacity-50">
            <Send size={16} /> Request Review
          </button>
        )}
        {isAdmin && (
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Publish
          </button>
        )}
        {editingPlan && isAdmin && status === "published" && (
          <button onClick={async () => { await base44.entities.LessonPlan.update(editingPlan.id, { status: "archived" }); onSaved(); }} className="flex items-center gap-2 px-5 py-2.5 border border-[#A8A9AD]/30 text-[#A8A9AD] text-sm hover:text-white transition-colors">
            <Archive size={16} /> Archive
          </button>
        )}
        {editingPlan && (
          <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm ml-auto disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
          </button>
        )}
        {editingPlan && onCancel && (
          <button onClick={onCancel} className="px-5 py-2.5 text-sm text-[#A8A9AD] hover:text-white transition-colors">Cancel</button>
        )}
      </div>
    </div>
  );
}