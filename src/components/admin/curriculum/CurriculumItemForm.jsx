import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Upload, Link2, FileText, Video } from "lucide-react";

function getEmbedUrl(url) {
  if (!url) return "";
  if (url.includes("youtube") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be/") ? url.split("youtu.be/")[1]?.split("?")[0] : url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes("vimeo")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return "";
}

export default function CurriculumItemForm({ rankId, rankName, programId, categories, criteria, onSave, onClose }) {
  const [form, setForm] = useState({
    title: criteria?.title || "",
    category: criteria?.category || "Technique",
    category_id: criteria?.category_id || "",
    description: criteria?.description || "",
    video_url: criteria?.video_url || "",
    embed_url: criteria?.embed_url || "",
    document_url: criteria?.document_url || "",
    thumbnail_url: criteria?.thumbnail_url || "",
    is_required: criteria?.is_required !== false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleVideoUrlChange = (url) => {
    setForm({ ...form, video_url: url, embed_url: getEmbedUrl(url) });
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, video_url: res.file_url, embed_url: "" });
    } catch (e) { alert("Failed to upload video."); }
    setUploadingVideo(false);
  };

  const handleDocUpload = async (file) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, document_url: res.file_url });
    } catch (e) { alert("Failed to upload document."); }
    setUploadingDoc(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, rank_id: rankId, display_order: criteria?.display_order || 0 };
      if (criteria?.id) {
        await base44.entities.CurriculumCriteria.update(criteria.id, payload);
      } else {
        await base44.entities.CurriculumCriteria.create(payload);
      }
      onSave();
      onClose();
    } catch (e) { alert("Failed to save item."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">{criteria ? "Edit Curriculum Item" : "Add Curriculum Item"}</h3>
            <p className="text-xs text-[#A8A9AD] mt-1">{rankName}</p>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. Pyung Ahn Cho Dan" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Category</label>
              <select value={form.category_id || form.category} onChange={e => {
                const sel = e.target.value;
                const cat = categories.find(c => c.id === sel);
                if (cat) {
                  setForm({ ...form, category_id: cat.id, category: cat.category_name });
                } else {
                  setForm({ ...form, category_id: "", category: sel });
                }
              }} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                {categories.length > 0 && (
                  <optgroup label="Custom Categories">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </optgroup>
                )}
                <optgroup label="Standard Categories">
                  {["Forms/Kata", "Sparring", "Self-Defense", "Terminology", "Technique", "Fitness", "Knowledge", "Grappling", "Basics", "Conditioning", "Philosophy"].map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Required for Testing</label>
              <select value={form.is_required ? "yes" : "no"} onChange={e => setForm({ ...form, is_required: e.target.value === "yes" })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                <option value="yes">Required</option>
                <option value="no">Optional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="Detailed description of the technique or requirement..." />
          </div>

          {/* Video Section */}
          <div className="border border-[#A8A9AD]/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-[#C9A84C]" />
              <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Video Resource</span>
            </div>
            <div>
              <label className="block text-xs text-[#A8A9AD] mb-1.5 flex items-center gap-1"><Link2 size={12} /> Embed URL (YouTube / Vimeo)</label>
              <input value={form.video_url && form.embed_url ? form.video_url : ""} onChange={e => handleVideoUrlChange(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#A8A9AD]">— or —</span>
            </div>
            <div>
              <label className="block text-xs text-[#A8A9AD] mb-1.5">Upload MP4 Video</label>
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:border-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploadingVideo ? "Uploading..." : form.video_url && !form.embed_url ? "Video uploaded ✓ — Click to replace" : "Choose MP4 file"}
                <input type="file" accept="video/mp4" className="hidden" onChange={e => handleVideoUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Document Section */}
          <div className="border border-[#A8A9AD]/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#C9A84C]" />
              <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Study Guide / PDF Document</span>
            </div>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:border-[#C9A84C] hover:text-white transition-colors cursor-pointer">
              {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingDoc ? "Uploading..." : form.document_url ? "Document attached ✓ — Click to replace" : "Upload PDF manual or study guide"}
              <input type="file" accept="application/pdf" className="hidden" onChange={e => handleDocUpload(e.target.files[0])} />
            </label>
            {form.document_url && (
              <a href={form.document_url} target="_blank" rel="noreferrer" className="text-xs text-[#C9A84C] hover:underline">View current document →</a>
            )}
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Thumbnail URL (optional)</label>
            <input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="https://..." />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
}