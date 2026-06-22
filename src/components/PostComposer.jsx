import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Video, Loader2, Send, Megaphone } from "lucide-react";

export default function PostComposer({ currentUser, onPosted }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("none");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const isAdmin = currentUser?.role === "admin";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    setSubmitting(true);
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
        mediaUrl = file_url;
      }

      await base44.entities.Post.create({
        author_id: currentUser.id,
        author_name: currentUser.full_name,
        author_role: currentUser.role,
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaFile ? mediaType : "none",
        is_announcement: isAdmin && isAnnouncement,
        like_count: 0,
        comment_count: 0,
      });

      setContent("");
      setMediaFile(null);
      setMediaType("none");
      setIsAnnouncement(false);
      if (fileRef.current) fileRef.current.value = "";
      onPosted?.();
    } catch (e) {
      console.error(e);
      alert("Failed to post. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center font-bold text-sm text-[#C9A84C]">
          {currentUser?.full_name?.charAt(0) || "S"}
        </div>
        <p className="text-sm text-[#A8A9AD]">Share your training with the community...</p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="What did you practice today?"
        className="w-full bg-transparent border border-[#A8A9AD]/20 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors resize-none mb-4"
      />

      {mediaFile && (
        <div className="mb-4 flex items-center gap-3 text-sm text-[#A8A9AD]">
          {mediaType === "video" ? <Video size={16} className="text-[#C9A84C]" /> : <ImagePlus size={16} className="text-[#C9A84C]" />}
          {mediaFile.name}
          <button onClick={() => { setMediaFile(null); setMediaType("none"); if (fileRef.current) fileRef.current.value = ""; }} className="text-red-400 text-xs">Remove</button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" id="media-upload" />
          <label htmlFor="media-upload" className="flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50 transition-colors cursor-pointer">
            <ImagePlus size={16} /> Photo/Video
          </label>

          {isAdmin && (
            <label className="flex items-center gap-2 px-4 py-2 text-sm text-[#A8A9AD] cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="accent-[#C9A84C]"
              />
              <Megaphone size={16} className={isAnnouncement ? "text-[#C9A84C]" : ""} />
              Announcement
            </label>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && !mediaFile)}
          className="flex items-center gap-2 px-6 py-2 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Post
        </button>
      </div>
    </div>
  );
}