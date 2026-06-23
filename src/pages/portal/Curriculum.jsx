import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { canAccessRank, BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import VideoPlayer from "@/components/VideoPlayer";
import { Play, Clock, Loader2, Search, Lock } from "lucide-react";
import { useCommunityAccess } from "@/lib/CommunityAccessContext";
import LockedCurriculum from "@/components/portal/community/LockedCurriculum";

const CATEGORIES = ["All", "Basics", "Kata", "Kumite", "Self-Defense", "Conditioning", "Philosophy"];

export default function Curriculum() {
  const { user } = useAuth();
  const { activeProfile } = useFamily();
  const { hasAccess, isChecking } = useCommunityAccess();
  const [videos, setVideos] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [activeProgramTab, setActiveProgramTab] = useState("all");

  useEffect(() => {
    base44.entities.Video.filter({ is_published: true })
      .then((data) => {
        setVideos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    base44.entities.Enrollment.filter({ user_id: activeProfile?.id || user?.id, status: "active" })
      .then(setEnrollments)
      .catch(() => {});
    base44.entities.Program.list().then(setPrograms).catch(() => {});
  }, [user, activeProfile]);

  if (isChecking) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  if (!hasAccess) return <LockedCurriculum />;

  // Multi-program: build program tabs from active enrollments
  const enrolledPrograms = enrollments
    .map(e => programs.find(p => p.id === e.program_id || p.program_name === e.program))
    .filter(Boolean);
  const isMultiProgram = enrolledPrograms.length > 1;

  // Filter videos: only show videos at or below the user's belt rank
  const accessibleVideos = videos.filter((v) => canAccessRank(activeProfile?.belt_rank, v.belt_rank_required));
  const programFiltered = isMultiProgram && activeProgramTab !== "all"
    ? accessibleVideos.filter(v => {
        const prog = enrolledPrograms.find(p => p.id === activeProgramTab);
        return !v.linked_program_id || v.linked_program_id === activeProgramTab || v.linked_program_id === prog?.program_name;
      })
    : accessibleVideos;
  const filtered = programFiltered.filter((v) => {
    const matchCat = category === "All" || v.category === category;
    const matchSearch = !search || v.title?.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by belt rank
  const grouped = BELT_RANKS.map((rank) => ({
    rank,
    items: filtered.filter((v) => v.belt_rank_required === rank),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Training Library</p>
        <h1 className="text-3xl font-bold mb-2">Curriculum Video Vault</h1>
        <p className="text-[#A8A9AD] text-sm">Videos organized by belt rank. You have access to your current rank and below.</p>
        {activeProfile?.belt_rank && (
          <div className="mt-3">
            <BeltBadge rank={activeProfile.belt_rank} size="md" />
          </div>
        )}
      </div>

      {/* Multi-Program Tabs */}
      {isMultiProgram && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#A8A9AD]/20 pb-3">
          <button
            onClick={() => setActiveProgramTab("all")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeProgramTab === "all" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}
          >
            All Programs
          </button>
          {enrolledPrograms.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProgramTab(p.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeProgramTab === p.id ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}
            >
              {p.program_name}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-transparent border border-[#A8A9AD]/30 pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 text-xs tracking-widest uppercase whitespace-nowrap transition-all ${
                category === cat ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Videos */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : grouped.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No videos match your filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <div key={group.rank}>
              <div className="flex items-center gap-3 mb-4">
                <BeltBadge rank={group.rank} size="md" />
                <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                <span className="text-xs text-[#A8A9AD]">{group.items.length} video{group.items.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideo(video)}
                    className="group text-left border border-[#A8A9AD]/20 hover:border-[#C9A84C]/40 transition-colors overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C9A84C]/10 to-black">
                          <Play size={32} className="text-[#C9A84C]/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors">
                          <Play size={20} className="text-[#C9A84C] group-hover:text-black ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      {video.duration_minutes && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-1 text-white">
                          {video.duration_minutes} min
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">{video.category}</span>
                      </div>
                      <h3 className="font-bold text-sm mb-1 group-hover:text-[#C9A84C] transition-colors">{video.title}</h3>
                      {video.description && <p className="text-xs text-[#A8A9AD] line-clamp-2">{video.description}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Locked ranks */}
      {!loading && videos.length > accessibleVideos.length && (
        <div className="border border-[#A8A9AD]/20 p-6 mt-8">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} className="text-[#A8A9AD]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD]">Locked Content</h3>
          </div>
          <p className="text-sm text-[#A8A9AD]">
            {videos.length - accessibleVideos.length} additional videos will unlock as you progress through the belt ranks. Keep training!
          </p>
        </div>
      )}

      {activeVideo && <VideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}