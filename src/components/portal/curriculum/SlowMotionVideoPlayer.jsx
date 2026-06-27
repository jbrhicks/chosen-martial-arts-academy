import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Gauge, Maximize2, FileText, Download } from "lucide-react";

function getEmbedUrl(url) {
  if (!url) return null;
  if (url.includes("youtube") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be/") ? url.split("youtu.be/")[1]?.split("?")[0] : url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes("vimeo")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return null;
}

export default function SlowMotionVideoPlayer({ item, onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showDoc, setShowDoc] = useState(false);

  const embedUrl = item?.embed_url || getEmbedUrl(item?.video_url);
  const isDirectVideo = !embedUrl && item?.video_url;
  const hasDocument = item?.document_url;

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const speeds = [1, 0.5, 0.25];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
  };

  const goFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (el?.requestFullscreen) el.requestFullscreen();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-[#C9A84C] transition-colors flex items-center gap-2 text-sm tracking-widest uppercase">
          Close <X size={20} />
        </button>

        <div className="aspect-video bg-black border border-[#C9A84C]/30 overflow-hidden">
          {embedUrl ? (
            <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={item.title} />
          ) : isDirectVideo ? (
            <video ref={videoRef} src={item.video_url} className="w-full h-full" playsInline onClick={togglePlay} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A8A9AD]">Video unavailable</div>
          )}
        </div>

        {/* Custom controls for direct video */}
        {isDirectVideo && (
          <div className="flex items-center gap-3 mt-3 px-1">
            <button onClick={togglePlay} className="w-10 h-10 border border-[#A8A9AD]/30 flex items-center justify-center text-white hover:border-[#C9A84C] transition-colors">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={cycleSpeed} className={`flex items-center gap-2 px-4 h-10 border text-sm font-medium transition-colors ${playbackRate !== 1 ? "border-[#C9A84C] text-[#C9A84C]" : "border-[#A8A9AD]/30 text-white hover:border-[#C9A84C]"}`}>
              <Gauge size={16} /> {playbackRate}x
            </button>
            <button onClick={goFullscreen} className="w-10 h-10 border border-[#A8A9AD]/30 flex items-center justify-center text-white hover:border-[#C9A84C] transition-colors">
              <Maximize2 size={18} />
            </button>
            {hasDocument && (
              <button onClick={() => setShowDoc(!showDoc)} className="flex items-center gap-2 px-4 h-10 border border-[#A8A9AD]/30 text-sm text-white hover:border-[#C9A84C] transition-colors">
                <FileText size={16} /> Study Guide
              </button>
            )}
          </div>
        )}

        {/* Embed notice + doc link */}
        {embedUrl && hasDocument && (
          <div className="mt-3">
            <a href={item.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-sm text-white hover:border-[#C9A84C] transition-colors">
              <Download size={16} /> Download Study Guide
            </a>
          </div>
        )}

        {/* Info */}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">{item.title}</h3>
          {item.description && <p className="text-[#A8A9AD] text-sm leading-relaxed">{item.description}</p>}
        </div>

        {/* Inline document preview */}
        {showDoc && hasDocument && (
          <div className="mt-4 border border-[#A8A9AD]/20">
            <iframe src={item.document_url} className="w-full h-[500px]" title="Study Guide" />
          </div>
        )}
      </div>
    </div>
  );
}