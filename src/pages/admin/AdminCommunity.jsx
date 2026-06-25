import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import GroupManager from "@/components/admin/community/GroupManager";
import ModerationDashboard from "@/components/admin/community/ModerationDashboard";
import { Loader2, Flag, Pin, Trash2, MessageSquare, Users, Shield, PenSquare } from "lucide-react";

export default function AdminCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("moderation");
  const [events, setEvents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  const loadPosts = useCallback(async () => {
    try {
      const data = await base44.entities.Post.list();
      setPosts(data.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      }));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
    base44.entities.Event.filter({ status: "active", is_public: true }).then(setEvents).catch(() => {});
    base44.entities.Video.list().then(setVideos).catch(() => {});
    base44.entities.User.list().then(u => setStudents(u.filter(s => s.role === "student" || s.role === "user"))).catch(() => {});
    base44.entities.Group.list().then(g => setGroups(g.map(gr => ({ group_id: gr.id, group_name: gr.group_name })))).catch(() => {});
  }, [loadPosts]);

  const filtered = posts.filter(p => {
    if (filter === "flagged") return p.is_flagged && !p.is_deleted;
    if (filter === "deleted") return p.is_deleted;
    if (filter === "pinned") return p.is_pinned;
    if (filter === "challenges") return p.post_type === "challenge";
    return !p.is_deleted;
  });

  const handlePostDeleted = (id) => setPosts(posts.map(p => p.id === id ? { ...p, is_deleted: true } : p));

  const approveSubmission = async (subId) => {
    try { await base44.entities.ChallengeSubmission.update(subId, { status: "approved" }); alert("Submission approved! Badge awarded."); loadPosts(); } catch (e) { alert("Failed to approve."); }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Content & Community</p>
        <h1 className="text-3xl font-bold">Community Management</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Moderate posts, manage groups, and review challenge submissions.</p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 w-full sm:w-fit">
        <button onClick={() => setTab("moderation")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide transition-colors ${tab === "moderation" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
          <Shield size={16} /> Moderation
        </button>
        <button onClick={() => setTab("groups")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide transition-colors ${tab === "groups" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
          <Users size={16} /> Groups
        </button>
        <button onClick={() => setTab("create")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide transition-colors ${tab === "create" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
          <PenSquare size={16} /> Create Post
        </button>
      </div>

      {tab === "groups" && <GroupManager currentUser={user} />}

      {tab === "create" && (
        <PostComposer currentUser={user} onPosted={loadPosts} groups={groups} events={events} videos={videos} students={students} />
      )}

      {tab === "moderation" && (
        <>
          <ModerationDashboard currentUser={user} />

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All Posts", icon: MessageSquare },
              { key: "pinned", label: "Pinned", icon: Pin },
              { key: "flagged", label: "Flagged", icon: Flag },
              { key: "challenges", label: "Challenges", icon: Users },
              { key: "deleted", label: "Deleted", icon: Trash2 },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setFilter(t.key)} className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase transition-all ${filter === t.key ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"}`}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
          ) : filtered.length === 0 ? (
            <div className="border border-[#A8A9AD]/20 p-12 text-center"><p className="text-[#A8A9AD]">No posts in this category.</p></div>
          ) : (
            <div className="space-y-4">
              {filtered.map(post => <PostCard key={post.id} post={post} currentUser={user} onPostUpdated={loadPosts} onPostDeleted={handlePostDeleted} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}