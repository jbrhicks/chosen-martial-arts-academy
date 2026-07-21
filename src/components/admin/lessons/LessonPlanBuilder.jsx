import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Save, Loader2, Trash2 } from "lucide-react";
import CurriculumQuickTag from "@/components/admin/lessons/CurriculumQuickTag";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

export default function LessonPlanBuilder({ programs, editingPlan, onSaved, onCancel }) {
  const { user } = useAuth();
  const [programId, setProgramId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkedItems, setLinkedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editingPlan) {
      setProgramId(editingPlan.program_id || "");
      setTargetDate(editingPlan.target_date || "");
      setTitle(editingPlan.title || "");
      setContent(editingPlan.plan_content || "");
      loadLinks(editingPlan.id);
    } else {
      setProgramId(""); setTargetDate(""); setTitle(""); setContent(""); setLinkedItems([]);
    }
  }, [editingPlan]);

  const loadLinks = async (planId) => {
    const links = await base44.entities.LessonPlanLink.filter({ plan_id: planId }).catch(() => []);
    setLinkedItems(links.map((l) => ({
      criteria_id: l.criteria_id, criteria_title: l.criteria_title,
      video_url: l.video_url, embed_url: l.embed_url, thumbnail_url: l.thumbnail_url,
    })));
  };

  const handleAddLink = (item) => setLinkedItems([...linkedItems, item]);
  const handleRemoveLink = (cid) => setLinkedItems(linkedItems.filter((l) => l.criteria_id !== cid));

  const handleSave = async () => {
    if (!programId || !targetDate) { alert("Please select a program and date."); return; }
    setSaving(true);
    try {
      const program = programs.find((p) => p.id === programId);
      const planData = {
        title: title || `${program?.program_name || "Class"} — ${targetDate}`,
        program_id: programId,
        program_name: program?.program_name || "",
        target_date: targetDate,
        plan_content: content,
        author_admin_id: user.id,
        author_admin_name: user.full_name,
      };

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
        await base44.entities.LessonPlanLink.bulkCreate(
          linkedItems.map((item) => ({ plan_id: planId, ...item }))
        );
      }

      onSaved();
      setProgramId(""); setTargetDate(""); setTitle(""); setContent(""); setLinkedItems([]);
    } catch (e) { alert("Failed to save: " + e.message); }
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

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
          {editingPlan ? "Edit Lesson Plan" : "New Lesson Plan"}
        </h3>
        {editingPlan && (
          <button onClick={handleDelete} disabled={deleting} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Program</label>
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={inputClass}>
            <option value="">Select program...</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.program_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Target Date</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Plan Title (optional)</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Week 3 — Side Kicks & Combinations" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Lesson Plan Content</label>
        <div className="bg-white">
          <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} placeholder="Warm-up, technique drills, sparring focus, cool-down..." />
        </div>
      </div>
      <CurriculumQuickTag linkedItems={linkedItems} onAdd={handleAddLink} onRemove={handleRemoveLink} />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Lesson Plan
        </button>
        {editingPlan && (
          <button onClick={onCancel} className="px-5 py-2.5 text-sm text-[#A8A9AD] hover:text-white transition-colors">Cancel</button>
        )}
      </div>
    </div>
  );
}