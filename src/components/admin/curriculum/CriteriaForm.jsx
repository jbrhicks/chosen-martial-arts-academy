import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";

const CATEGORIES = ["Forms/Kata", "Sparring", "Self-Defense", "Terminology", "Technique", "Fitness", "Knowledge"];

export default function CriteriaForm({ rankId, criteria, onSave, onClose }) {
  const [form, setForm] = useState({
    title: criteria?.title || "",
    category: criteria?.category || "Technique",
    description: criteria?.description || "",
    video_url: criteria?.video_url || "",
    thumbnail_url: criteria?.thumbnail_url || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (criteria?.id) {
        await base44.entities.CurriculumCriteria.update(criteria.id, form);
      } else {
        await base44.entities.CurriculumCriteria.create({ ...form, rank_id: rankId, display_order: 0 });
      }
      onSave();
      onClose();
    } catch (e) { alert("Failed to save criterion."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{criteria ? "Edit Criterion" : "Add Criterion"}</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. Kicking Combinations 1-3" required />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="Detailed description of the technique or requirement..." />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Video URL (YouTube, Vimeo, or direct link)</label>
            <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Thumbnail URL (optional)</label>
            <input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="https://..." />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Criterion"}
          </button>
        </form>
      </div>
    </div>
  );
}