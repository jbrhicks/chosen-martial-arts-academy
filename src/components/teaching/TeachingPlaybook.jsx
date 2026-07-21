import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Play, Loader2, Calendar, Video } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";

export default function TeachingPlaybook() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);

  const getWeekRange = (offset) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
      label: `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getWeekRange(weekOffset);
      const [allPlans, allLinks] = await Promise.all([
        base44.entities.LessonPlan.list("-target_date", 200),
        base44.entities.LessonPlanLink.list().catch(() => []),
      ]);
      const weekPlans = allPlans.filter((p) => p.target_date >= start && p.target_date <= end);
      setPlans(weekPlans.sort((a, b) => (a.target_date || "").localeCompare(b.target_date || "")));
      setLinks(allLinks);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [weekOffset]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const week = getWeekRange(weekOffset);

  const groupedByProgram = plans.reduce((acc, p) => {
    const key = p.program_name || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 border border-[#A8A9AD]/30 hover:border-[#C9A84C] transition-colors"><ChevronLeft size={18} /></button>
          <div className="text-center min-w-[140px]">
            <p className="text-sm font-bold">{weekOffset === 0 ? "This Week" : weekOffset > 0 ? "Upcoming" : "Archive"}</p>
            <p className="text-xs text-[#A8A9AD]">{week.label}</p>
          </div>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 border border-[#A8A9AD]/30 hover:border-[#C9A84C] transition-colors"><ChevronRight size={18} /></button>
        </div>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-[#C9A84C] tracking-widest uppercase hover:text-[#E0C97A]">Back to This Week</button>}
      </div>

      {plans.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <Calendar size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No lesson plans for this week.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProgram).map(([programName, programPlans]) => (
            <div key={programName}>
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">{programName}</h3>
              <div className="space-y-4">
                {programPlans.map((plan) => {
                  const planLinks = links.filter((l) => l.plan_id === plan.id);
                  return (
                    <div key={plan.id} className="border border-[#A8A9AD]/20 bg-black p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={14} className="text-[#A8A9AD]" />
                        <span className="text-xs text-[#A8A9AD]">{formatDate(plan.target_date)}</span>
                      </div>
                      <h4 className="text-base font-bold mb-3">{plan.title || "Untitled Plan"}</h4>
                      {plan.plan_content ? (
                        <div className="text-sm text-[#A8A9AD] leading-relaxed [&_h1]:text-white [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-white [&_h2]:font-bold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-white" dangerouslySetInnerHTML={{ __html: plan.plan_content }} />
                      ) : <p className="text-sm text-[#A8A9AD] italic">No content added.</p>}
                      {planLinks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#A8A9AD]/10">
                          <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Video size={12} /> Quick-Link Videos</p>
                          <div className="flex flex-wrap gap-2">
                            {planLinks.map((link) => (
                              <button
                                key={link.id}
                                onClick={() => setPlayingVideo({ title: link.criteria_title, embed_url: link.embed_url, video_url: link.video_url, description: "" })}
                                className="flex items-center gap-2 px-3 py-2 border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/15 transition-colors"
                              >
                                <Play size={14} /> {link.criteria_title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}