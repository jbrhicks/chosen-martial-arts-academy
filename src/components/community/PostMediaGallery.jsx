import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function PostMediaGallery({ post }) {
  const [mediaItems, setMediaItems] = useState([]);
  const [fullscreen, setFullscreen] = useState(null);

  useEffect(() => {
    const load = async () => {
      const items = [];
      if (post.media_url && post.media_type !== "none") {
        items.push({ id: "legacy", media_url: post.media_url, media_type: post.media_type });
      }
      try {
        const attachments = await base44.entities.PostMedia.filter({ post_id: post.id });
        attachments.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        items.push(...attachments);
      } catch {}
      setMediaItems(items);
    };
    load();
  }, [post.id, post.media_url, post.media_type]);

  if (mediaItems.length === 0) return null;

  return (
    <>
      <div className={`grid ${mediaItems.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1 mb-4`}>
        {mediaItems.map(item => (
          <div key={item.id} className="relative overflow-hidden border border-[#A8A9AD]/20">
            {item.media_type === "video" ? (
              <video src={item.media_url} controls autoPlay muted loop playsInline className="w-full max-h-96 object-cover" />
            ) : (
              <img src={item.media_url} alt="" className="w-full max-h-96 object-cover cursor-pointer" onClick={() => setFullscreen(item.media_url)} />
            )}
          </div>
        ))}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setFullscreen(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X size={28} /></button>
          <img src={fullscreen} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}