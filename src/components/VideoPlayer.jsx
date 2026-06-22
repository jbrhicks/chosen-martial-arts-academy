import { X } from "lucide-react";

export default function VideoPlayer({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-[#C9A84C] transition-colors flex items-center gap-2 text-sm tracking-widest uppercase"
        >
          Close <X size={20} />
        </button>
        <div className="aspect-video bg-black border border-[#C9A84C]/30">
          {video.embed_url ? (
            <iframe
              src={video.embed_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : video.video_url ? (
            <video src={video.video_url} controls className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A8A9AD]">
              Video unavailable
            </div>
          )}
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">{video.title}</h3>
          {video.description && <p className="text-[#A8A9AD] text-sm leading-relaxed">{video.description}</p>}
        </div>
      </div>
    </div>
  );
}