import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, Plus, X, Video, Pencil, Trash2, Upload, Link as LinkIcon, Settings2, GripVertical } from "lucide-react";

const FALLBACK_CATEGORIES = ["Basics", "Kata", "Kumite", "Self-Defense", "Conditioning", "Philosophy"];

export default function AdminCurriculum() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", belt_rank_required: "All Ranks", category: "Basics",
    video_url: "", embed_url: "", thumbnail_url: "", duration_minutes: "", is_published: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rankOptions, setRankOptions] = useState(["All Ranks", ...BELT_RANKS]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const loadVideos = useCallback(async () => {
    try {
      const data = await base44.entities.Video.list();
      setVideos(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadRankOptions = useCallback(async () => {
    try {
      const belts = await base44.entities.RankBelt.list();
      if (belts.length > 0) {
        const uniqueNames = [...new Set(belts.map(b => b.belt_name))]
          .sort((a, b) => {
            const ba = belts.find(belt => belt.belt_name === a);
            const bb = belts.find(belt => belt.belt_name === b);
            return (ba?.rank_order || 0) - (bb?.rank_order || 0);
          });
        // Merge any BELT_RANKS not already included
        const merged = [...uniqueNames, ...BELT_RANKS.filter(r => !uniqueNames.includes(r))];
        setRankOptions(["All Ranks", ...merged]);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await base44.entities.VideoCategory.list();
      if (cats.length > 0) {
        cats.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setCategories(cats.filter(c => c.is_active !== false).map(c => c.category_name));
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadVideos(); loadRankOptions(); loadCategories(); }, [loadVideos, loadRankOptions, loadCategories]);

  const resetForm = () => {
    setForm({ title: "", description: "", belt_rank_required: "All Ranks", category: categories[0] || "Basics", video_url: "", embed_url: "", thumbnail_url: "", duration_minutes: "", is_published: true });
    setEditing(null);
  };

  const handleEdit = (video) => {
    setEditing(video);
    setForm({
      title: video.title || "", description: video.description || "",
      belt_rank_required: video.belt_rank_required || "All Ranks", category: video.category || categories[0] || "Basics",
      video_url: video.video_url || "", embed_url: video.embed_url || "",
      thumbnail_url: video.thumbnail_url || "", duration_minutes: video.duration_minutes || "",
      is_published: video.is_published !== false,
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, [field]: file_url });
    } catch (e) {
      alert("Upload failed: " + e.message);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        belt_rank_required: form.belt_rank_required,
        category: form.category,
        video_url: form.video_url || null,
        embed_url: form.embed_url || null,
        thumbnail_url: form.thumbnail_url || null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        is_published: form.is_published,
      };
      if (editing) {
        await base44.entities.Video.update(editing.id, payload);
      } else {
        await base44.entities.Video.create(payload);
      }
      setShowForm(false);
      resetForm();
      loadVideos();
    } catch (e) {
      alert("Failed to save video: " + e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this video?")) return;
    try {
      await base44.entities.Video.delete(id);
      loadVideos();
    } catch (e) { alert("Delete failed"); }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.includes(name)) { alert("Category already exists."); return; }
    try {
      await base44.entities.VideoCategory.create({ category_name: name, display_order: categories.length + 1 });
      setNewCategory("");
      loadCategories();
    } catch (e) { alert("Failed to add category: " + e.message); }
  };

  const handleDeleteCategory = async (catName) => {
    if (!confirm(`Delete category "${catName}"? Videos using it will keep their current value but won't appear in filters until reassigned.`)) return;
    try {
      const cats = await base44.entities.VideoCategory.filter({ category_name: catName });
      for (const c of cats) await base44.entities.VideoCategory.delete(c.id);
      loadCategories();
    } catch (e) { alert("Failed to delete category: " + e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Training Content</p>
          <h1 className="text-3xl font-bold">Curriculum Management</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
        >
          <Plus size={18} /> Add Video
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : videos.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <Video size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No videos yet. Add your first training video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="border border-[#A8A9AD]/20 p-4 hover:border-[#C9A84C]/40 transition-colors">
              <div className="aspect-video bg-black mb-3 overflow-hidden">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={24} className="text-[#A8A9AD]" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">{video.category}</span>
                {video.is_published === false && <span className="text-[10px] text-[#A8A9AD]">· Draft</span>}
              </div>
              <h3 className="font-bold text-sm mb-2">{video.title}</h3>
              <div className="mb-3"><BeltBadge rank={video.belt_rank_required} size="sm" /></div>
              <div className="flex items-center gap-2 pt-3 border-t border-[#A8A9AD]/20">
                <button onClick={() => handleEdit(video)} className="flex items-center gap-1 text-xs text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(video.id)} className="flex items-center gap-1 text-xs text-[#A8A9AD] hover:text-red-400 transition-colors ml-auto">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? "Edit Video" : "Add Video"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Belt Rank Required *</label>
                  <select value={form.belt_rank_required} onChange={(e) => setForm({ ...form, belt_rank_required: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {rankOptions.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
                  </select>
                  <p className="text-xs text-[#A8A9AD] mt-1.5">"All Ranks" = visible to everyone. Higher belts automatically see lower-rank content.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs tracking-widest uppercase text-[#A8A9AD]">Category</label>
                    <button type="button" onClick={() => setShowCategoryManager(true)} className="flex items-center gap-1 text-[10px] text-[#C9A84C] hover:text-[#E0C97A] tracking-wide uppercase">
                      <Settings2 size={11} /> Manage
                    </button>
                  </div>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Video Source</label>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs text-[#A8A9AD] mb-1"><Upload size={14} /> Upload Video File</label>
                    <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "video_url")} className="text-xs text-[#A8A9AD]" />
                    {form.video_url && <p className="text-xs text-green-400 mt-1">✓ Uploaded</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs text-[#A8A9AD] mb-1"><LinkIcon size={14} /> Or Embed URL (YouTube/Vimeo)</label>
                    <input type="url" value={form.embed_url} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Thumbnail URL</label>
                  <input type="url" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Duration (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="accent-[#C9A84C]" />
                Published (visible to students)
              </label>
              <button type="submit" disabled={submitting || uploading} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting || uploading ? <Loader2 size={18} className="animate-spin" /> : <>{editing ? "Update" : "Create"} Video</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowCategoryManager(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Manage Categories</h2>
              <button onClick={() => setShowCategoryManager(false)} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-[#A8A9AD] text-center py-4">No categories yet.</p>
              ) : categories.map((cat) => (
                <div key={cat} className="flex items-center gap-3 border border-[#A8A9AD]/20 px-4 py-2.5">
                  <GripVertical size={14} className="text-[#A8A9AD]/40 shrink-0" />
                  <span className="flex-1 text-sm text-white">{cat}</span>
                  <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-[#A8A9AD] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                placeholder="New category name..."
                className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                autoFocus
              />
              <button onClick={handleAddCategory} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
                <Plus size={16} /> Add
              </button>
            </div>
            <p className="text-xs text-[#A8A9AD] mt-4">Categories are shared across all videos. Deleting a category won't delete videos but they'll need to be reassigned.</p>
          </div>
        </div>
      )}
    </div>
  );
}