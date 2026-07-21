import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ChevronLeft, ChevronRight, Play, Loader2, Calendar, Video, Plus, Pencil, CheckCircle, ChevronDown } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import LessonPlanBuilder from "@/components/admin/lessons/LessonPlanBuilder";

const safeParse = (str, fallback) => { try { return JSON.parse(str); } catch { return fallback; } };

export default function TeachingPlaybook() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState([]);
  const [links, setLinks] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [expandedRankNotes, setExpandedRankNotes] = useState({});

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
      const [allPlans, allLinks, progs, evts] = await Promise.all([
        base44.entities.LessonPlan.list("-target_date", 200),
        base44.entities.LessonPlanLink.list().catch(() => []),
        base44.entities.Program.list().catch(() => []),
        base44.entities.Event.list().catch(() => []),
      ]);
      const weekPlans = allPlans.filter((p) => {
        const date = p.target_date || p.week_start_date;
        if (!date) return false;
        return date >= start && date <= end;
      });
      setPlans(weekPlans.sort((a, b) => (a.target_date || "").localeCompare(b.target_date || "")));
      setLinks(allLinks);
      setPrograms(progs);
      setEvents(evts);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [weekOffset]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const week = getWeekRange(weekOffset);

  const visiblePlans = plans.filter((p) =>
    !p.status || p.status === "published" || p.author_admin_id === user?.id || user?.role === "admin"
  );

  const groupedByProgram = visiblePlans.reduce((acc, p) => {
    const key = p.program_name || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const getPlanDateLabel = (plan) => {
    if (plan.plan_type === "weekly" && plan.week_start_date) return `Week of ${new Date(plan.week_start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    if (plan.plan_type === "event" && plan.event_title) return plan.event_title;
    if (plan.target_date) return formatDate(plan.target_date);
    return "No date";
  };

  const parseSections = (plan) => {
    if (plan.sections) return safeParse(plan.sections, []);
    if (plan.plan_content) return [{ section_name: "General", content: plan.plan_content, isHtml: true }];
    return [];
  };

  const parseRankNotes = (plan) => {
    if (plan.rank_group_notes) return safeParse(plan.rank_group_notes, {});
    return {};
  };

  if (showBuilder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{editingPlan ? "Edit Lesson Plan" : "New Lesson Plan"}</h2>
          <button onClick={() => { setShowBuilder(false); setEditingPlan(null); load(); }} className="text-sm text-[#A8A9AD] hover:text-white">← Back to Playbook</button>
        </div>
        <LessonPlanBuilder
          programs={programs}
          events={events}
          editingPlan={editingPlan}
          onSaved={() => { setShowBuilder(false); setEditingPlan(null); load(); }}
          onCancel={() => { setShowBuilder(false); setEditingPlan(null); }}
        />
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-[#C9A84C] tracking-widest uppercase hover:text-[#E0C97A]">Back to This Week</button>}
          <button onClick={() => { setEditingPlan(null); setShowBuilder(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
            <Plus size={16} /> New Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : visiblePlans.length === 0 ? (
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
                  const planSections = parseSections(plan);
                  const rankNotes = parseRankNotes(plan);
                  const hasRankNotes = Object.values(rankNotes).some((v) => v && v.trim());
                  const isOwnDraft = plan.author_admin_id === user?.id && plan.status === "draft";
                  const planId = plan.id;
                  return (
                    <div key={plan.id} className="border border-[#A8A9AD]/20 bg-black p-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Calendar size={14} className="text-[#A8A9AD]" />
                        <span className="text-xs text-[#A8A9AD]">{getPlanDateLabel(plan)}</span>
                        {plan.status === "draft" && <span className="text-[10px] tracking-widest uppercase text-gray-400 border border-gray-400/30 px-2 py-0.5">Draft</span>}
                        {plan.review_requested && <span className="text-[10px] tracking-widest uppercase text-orange-400 border border-orange-400/30 px-2 py-0.5">Review Requested</span>}
                        {plan.status === "published" && <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">Published</span>}
                        {isOwnDraft && (
                          <button onClick={() => { setEditingPlan(plan); setShowBuilder(true); }} className="ml-auto flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A]">
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                      </div>
                      <h4 className="text-base font-bold mb-3">{plan.title || "Untitled Plan"}</h4>

                      {planSections.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {planSections.map((section, i) => (
                            <div key={i} className="border-l-2 border-[#C9A84C]/30 pl-4">
                              <h5 className="text-sm font-bold text-[#C9A84C] mb-1">{section.section_name}</h5>
                              {section.isHtml ? (
                                <div className="text-sm text-[#A8A9AD] leading-relaxed [&_h1]:text-white [&_h1]:font-bold [&_h2]:text-white [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: section.content }} />
                              ) : (
                                <p className="text-sm text-[#A8A9AD] leading-relaxed whitespace-pre-wrap">{section.content}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {plan.universal_notes && (
                        <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-3 mb-3">
                          <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-1">Universal Notes</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{plan.universal_notes}</p>
                        </div>
                      )}

                      {hasRankNotes && (
                        <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] mb-3">
                          <button onClick={() => setExpandedRankNotes({ ...expandedRankNotes, [planId]: !expandedRankNotes[planId] })} className="w-full flex items-center justify-between px-3 py-2 text-left">
                            <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Rank Group Notes</span>
                            <ChevronDown size={14} className={`text-[#A8A9AD] transition-transform ${expandedRankNotes[planId] ? "rotate-180" : ""}`} />
                          </button>
                          {expandedRankNotes[planId] && (
                            <div className="px-3 pb-3 space-y-2">
                              {Object.entries(rankNotes).filter(([_, v]) => v && v.trim()).map(([group, note]) => (
                                <div key={group}>
                                  <p className="text-xs font-bold capitalize text-[#C9A84C]">{group}</p>
                                  <p className="text-sm text-[#A8A9AD] whitespace-pre-wrap">{note}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {planLinks.length > 0 && (
                        <div className="pt-3 border-t border-[#A8A9AD]/10">
                          <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Video size={12} /> Quick-Link Videos</p>
                          <div className="flex flex-wrap gap-2">
                            {planLinks.map((link) => (
                              <button key={link.id} onClick={() => setPlayingVideo({ title: link.criteria_title, embed_url: link.embed_url, video_url: link.video_url, description: "" })} className="flex items-center gap-2 px-3 py-2 border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/15 transition-colors">
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