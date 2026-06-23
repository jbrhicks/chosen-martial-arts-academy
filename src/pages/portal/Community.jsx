import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { useCommunityAccess } from "@/lib/CommunityAccessContext";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import GroupSelector from "@/components/portal/community/GroupSelector";
import LockedCommunity from "@/components/portal/community/LockedCommunity";
import { Loader2 } from "lucide-react";

export default function Community() {
  const { user } = useAuth();
  const { isGuardian, members } = useFamily();
  const { hasAccess, isChecking, childGroupIds } = useCommunityAccess();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

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
    } else if (!isChecking) {
      setLoading(false);
    }
  }, [loadPosts, hasAccess, isChecking, isGuardian, members?.length]);

  const handlePostDeleted = (id) => setPosts(posts.filter(p => p.id !== id));

  // Guardian mirroring: main feed includes children's group posts
  const filteredPosts = selectedGroup
    ? posts.filter(p => p.group_id === selectedGroup)
    : isGuardian && childGroupIds.length > 0
      ? posts.filter(p => !p.group_id || childGroupIds.includes(p.group_id))
      : posts.filter(p => !p.group_id);

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

      <GroupSelector groups={userGroups} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup} />

      <PostComposer currentUser={user} onPosted={loadPosts} groups={userGroups} />

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