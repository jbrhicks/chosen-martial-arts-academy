import { useState } from "react";
import { Lock, Play, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Video } from "lucide-react";
import SlowMotionVideoPlayer from "./SlowMotionVideoPlayer";

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

function ItemCard({ item, locked, progress }) {
  const [playing, setPlaying] = useState(false);
  const status = progress?.find(p => p.criteria_id === item.id)?.status;
  const hasVideo = item.video_url || item.embed_url;
  const hasDoc = item.document_url;

  if (locked) {
    return (
      <div className="border border-[#A8A9AD]/10 bg-black/30 p-3 flex items-center gap-3 opacity-60">
        <Lock size={16} className="text-[#A8A9AD] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#A8A9AD] truncate">{item.title}</p>
          <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD]/60">{item.category}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`border p-4 ${status === "mastered" ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-black"}`}>
        <div className="flex items-start gap-3 mb-2">
          {status === "mastered" ? (
            <CheckCircle size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
          ) : status === "practicing" ? (
            <Clock size={18} className="text-blue-400 shrink-0 mt-0.5" />
          ) : (
            <div className="w-[18px] h-[18px] border-2 border-[#A8A9AD]/30 rounded-full shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white">{item.title}</h4>
            <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5 inline-block mt-1">{item.category}</span>
            {item.is_required === false && <span className="text-[9px] text-[#A8A9AD] ml-2">Optional</span>}
          </div>
        </div>
        {item.description && <p className="text-xs text-[#A8A9AD] mb-3">{item.description}</p>}

        {/* Video thumbnail / play button */}
        {hasVideo && (
          <button onClick={() => setPlaying(true)} className="relative w-full aspect-video bg-black border border-[#A8A9AD]/20 flex items-center justify-center group overflow-hidden mb-2">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/10 to-transparent" />
            )}
            <div className="relative w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors">
              <Play size={20} className="text-[#C9A84C] group-hover:text-black fill-current ml-0.5" />
            </div>
          </button>
        )}

        {/* Document link */}
        {hasDoc && (
          <a href={item.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
            <FileText size={12} /> View Study Guide
          </a>
        )}
      </div>
      {playing && <SlowMotionVideoPlayer item={item} onClose={() => setPlaying(false)} />}
    </>
  );
}

function RankSection({ belt, items, categories, progress, locked, expanded, onToggle, isPast, isNext }) {
  const masteredCount = items.filter(i => progress?.find(p => p.criteria_id === i.id)?.status === "mastered").length;
  const progressPct = items.length > 0 ? Math.round((masteredCount / items.length) * 100) : 0;

  // Group items by category
  const grouped = categories.length > 0
    ? categories.map(cat => ({ name: cat.category_name, items: items.filter(i => i.category_id === cat.id) })).filter(g => g.items.length > 0)
    : Object.entries(items.reduce((acc, i) => { const k = i.category || "Uncategorized"; (acc[k] = acc[k] || []).push(i); return acc; }, {})).map(([name, items]) => ({ name, items }));

  return (
    <div className={`border ${locked ? "border-[#A8A9AD]/10" : isPast ? "border-[#A8A9AD]/15" : "border-[#C9A84C]/30"} bg-black`}>
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/40 flex items-center justify-center text-sm font-bold text-[#C9A84C] shrink-0">{belt.rank_order}</div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">{belt.belt_name}</h3>
            {locked && <Lock size={12} className="text-[#A8A9AD]" />}
            {isNext && <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-1.5 py-0.5">Up Next</span>}
            {isPast && <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-1.5 py-0.5">Earned</span>}
          </div>
          <p className="text-xs text-[#A8A9AD] mt-0.5">
            {locked ? `${items.length} requirements — unlock at this rank` : `${items.length} items • ${masteredCount} mastered (${progressPct}%)`}
          </p>
        </div>
        {expanded ? <ChevronUp size={18} className="text-[#A8A9AD]" /> : <ChevronDown size={18} className="text-[#A8A9AD]" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-6">
          {locked ? (
            <div className="text-center py-8">
              <Lock size={32} className="text-[#A8A9AD]/40 mx-auto mb-3" />
              <p className="text-sm text-[#A8A9AD]">This rank unlocks once you earn your current belt. Keep training!</p>
              <div className="mt-4 space-y-2 max-w-md mx-auto">
                {items.map(item => <ItemCard key={item.id} item={item} locked={true} />)}
              </div>
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-[#A8A9AD] text-center py-4">No curriculum items for this rank yet.</p>
          ) : (
            grouped.map(group => (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs tracking-widest uppercase text-[#C9A84C] font-bold">{group.name}</span>
                  <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                  <span className="text-xs text-[#A8A9AD]">{group.items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.map(item => <ItemCard key={item.id} item={item} locked={false} progress={progress} />)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TrainingVault({ belts, currentBeltId, criteriaByBelt, categoriesByBelt, progress, studentId, enrollmentDate }) {
  const [expandedRank, setExpandedRank] = useState(currentBeltId);

  if (!belts || belts.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
        <p className="text-[#A8A9AD]">Your training vault is being set up. Check back soon!</p>
      </div>
    );
  }

  const currentIndex = belts.findIndex(b => b.id === currentBeltId);
  const pastBelts = currentIndex > 0 ? belts.slice(0, currentIndex) : [];
  const currentBelt = belts[currentIndex];
  const nextBelt = currentIndex < belts.length - 1 ? belts[currentIndex + 1] : null;

  return (
    <div className="space-y-5">
      {/* Current Rank - Full Access */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Video size={16} className="text-[#C9A84C]" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-white">Current Training</h2>
        </div>
        <RankSection
          belt={currentBelt}
          items={criteriaByBelt[currentBelt.id] || []}
          categories={categoriesByBelt[currentBelt.id] || []}
          progress={progress}
          locked={false}
          expanded={expandedRank === currentBelt.id}
          onToggle={() => setExpandedRank(expandedRank === currentBelt.id ? null : currentBelt.id)}
        />
      </div>

      {/* Next Rank - Preview with locked videos */}
      {nextBelt && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={16} className="text-[#A8A9AD]" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD]">Coming Up — Next Rank Preview</h2>
          </div>
          <RankSection
            belt={nextBelt}
            items={criteriaByBelt[nextBelt.id] || []}
            categories={categoriesByBelt[nextBelt.id] || []}
            progress={progress}
            locked={true}
            isNext={true}
            expanded={expandedRank === nextBelt.id}
            onToggle={() => setExpandedRank(expandedRank === nextBelt.id ? null : nextBelt.id)}
          />
        </div>
      )}

      {/* Past Ranks - Archive */}
      {pastBelts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-[#C9A84C]" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-white">Earned Ranks — Archive</h2>
          </div>
          <div className="space-y-2">
            {pastBelts.slice().reverse().map(belt => (
              <RankSection
                key={belt.id}
                belt={belt}
                items={criteriaByBelt[belt.id] || []}
                categories={categoriesByBelt[belt.id] || []}
                progress={progress}
                locked={false}
                isPast={true}
                expanded={expandedRank === belt.id}
                onToggle={() => setExpandedRank(expandedRank === belt.id ? null : belt.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}