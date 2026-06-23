import { useState } from "react";
import { CheckCircle, Circle, Clock, Play, X } from "lucide-react";

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "text-[#A8A9AD]", icon: Circle },
  practicing: { label: "Practicing", color: "text-blue-400", icon: Clock },
  mastered: { label: "Mastered", color: "text-[#C9A84C]", icon: CheckCircle },
};

function VideoEmbed({ url, thumbnail }) {
  const [playing, setPlaying] = useState(false);
  if (!url) return null;

  if (playing) {
    if (url.includes("youtube") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be/") ? url.split("youtu.be/")[1]?.split("?")[0] : url.split("v=")[1]?.split("&")[0];
      return <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} className="w-full aspect-video" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />;
    }
    if (url.includes("vimeo")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return <iframe src={`https://player.vimeo.com/video/${videoId}?autoplay=1`} className="w-full aspect-video" allow="autoplay; fullscreen" allowFullScreen />;
    }
    return <video src={url} controls autoPlay className="w-full aspect-video" />;
  }

  return (
    <button onClick={() => setPlaying(true)} className="relative w-full aspect-video bg-black border border-[#A8A9AD]/20 flex items-center justify-center group overflow-hidden">
      {thumbnail ? (
        <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/10 to-transparent" />
      )}
      <div className="relative w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors">
        <Play size={22} className="text-[#C9A84C] group-hover:text-black fill-current transition-colors" />
      </div>
    </button>
  );
}

export default function StudentHandbook({ criteria, progress, beltName }) {
  const getStatus = (id) => progress.find(p => p.criteria_id === id)?.status || "not_started";
  const masteredCount = criteria.filter(c => getStatus(c.id) === "mastered").length;
  const progressPct = criteria.length > 0 ? Math.round((masteredCount / criteria.length) * 100) : 0;

  if (criteria.length === 0) {
    return <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center"><p className="text-[#A8A9AD]">No curriculum has been published for your current belt yet. Check back soon!</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">{beltName}</h2>
          <span className="text-sm font-bold text-[#C9A84C]">{progressPct}% Complete</span>
        </div>
        <div className="h-2 bg-white/10 overflow-hidden">
          <div className="h-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-[#A8A9AD] mt-2">{masteredCount} of {criteria.length} criteria mastered</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteria.map(c => {
          const status = getStatus(c.id);
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          return (
            <div key={c.id} className={`border p-4 ${status === "mastered" ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-black"}`}>
              <div className="flex items-start gap-3 mb-3">
                <StatusIcon size={18} className={`${config.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold">{c.title}</h3>
                  <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5 inline-block mt-1">{c.category}</span>
                </div>
              </div>
              {c.description && <p className="text-xs text-[#A8A9AD] mb-3">{c.description}</p>}
              {c.video_url && <VideoEmbed url={c.video_url} thumbnail={c.thumbnail_url} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}