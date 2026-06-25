import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { useCommunityAccess } from "@/lib/CommunityAccessContext";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import GroupSelector from "@/components/portal/community/GroupSelector";
import LockedCommunity from "@/components/portal/community/LockedCommunity";
import { Loader2, Megaphone } from "lucide-react";

export default function Community() {
  const { user } = useAuth();
  const { isGuardian, members } = useFamily();
  const { hasAccess, isChecking, childGroupIds } = useCommunityAccess();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [officialOnly, setOfficialOnly] = useState(false);
  const [events, setEvents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [students, setStudents] = useState([]);

  const loadPosts = useCallback(async () => {
    try {
      const data = await base44.entities.Post.filter({ is_deleted: false });
      const sorted = data.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        if (a.post_type === "broadcast" && b.post_type !== "broadcast") return -1;
        if (a.post_type !== "broadcast" && b.post_type === "broadcast") return 1;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      });
      setPosts(sorted);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadGroups = async () => {
    let memberships = [];
    if (isGuardian) {
      // Guardian mirroring: load groups from children's memberships
      const children = (members || []).filter(m => m.family_role === "student");
      for (const child of children) {
        const m = await base44.entities.GroupMember.filter({ user_id: child.id });
        memberships = [...memberships, ...m];
      }
      const seen = new Set();
      memberships = memberships.filter(m => {
        if (seen.has(m.group_id)) return false;
        seen.add(m.group_id);
        return true;
      });
    } else {
      memberships = await base44.entities.GroupMember.filter({ user_id: user.id });
    }
    setUserGroups(memberships);
  };

  useEffect(() => {
    if (hasAccess && !isChecking) {
      loadPosts();
      loadGroups();
      base44.entities.Event.filter({ status: "active", is_public: true }).then(setEvents).catch(() => {});
      base44.entities.Video.list().then(setVideos).catch(() => {});
      base44.entities.User.list().then(u => setStudents(u.filter(s => s.role === "student" || s.role === "user"))).catch(() => {});
    } else if (!isChecking) {
      setLoading(false);
    }
  }, [loadPosts, hasAccess, isChecking, isGuardian, members?.length]);

  const handlePostDeleted = (id) => setPosts(posts.filter(p => p.id !== id));

  // Guardian mirroring: main feed includes children's group posts
  const filteredPosts = (selectedGroup
    ? posts.filter(p => p.group_id === selectedGroup)
    : isGuardian && childGroupIds.length > 0
      ? posts.filter(p => !p.group_id || childGroupIds.includes(p.group_id))
      : posts.filter(p => !p.group_id)
  ).filter(p => {
    if (p.is_hidden && user?.role !== "admin") return false;
    if (officialOnly && !p.is_announcement && !p.is_pinned && p.post_type !== "broadcast" && p.post_type !== "rank_up") return false;
    return true;
  });

  if (isChecking) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  if (!hasAccess) {
    return <LockedCommunity />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Member Feed</p>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Share your training, encourage your peers, stay connected.</p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0 overflow-hidden">
          <GroupSelector groups={userGroups} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup} />
        </div>
        <button
          onClick={() => setOfficialOnly(!officialOnly)}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase font-bold transition-colors shrink-0 ${officialOnly ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"}`}
        >
          <Megaphone size={14} /> Official Updates Only
        </button>
      </div>

      <PostComposer currentUser={user} onPosted={loadPosts} groups={userGroups} events={events} videos={videos} students={students} />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onPostUpdated={loadPosts} onPostDeleted={handlePostDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}