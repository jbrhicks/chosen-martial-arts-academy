import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import { Loader2 } from "lucide-react";

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      const data = await base44.entities.Post.filter({ is_deleted: false });
      // Sort: pinned first, then announcements, then by date
      const sorted = data.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        if (a.is_announcement && !b.is_announcement) return -1;
        if (!a.is_announcement && b.is_announcement) return 1;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      });
      setPosts(sorted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostDeleted = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Member Feed</p>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Share your training, encourage your peers, stay connected.</p>
      </div>

      <PostComposer currentUser={user} onPosted={loadPosts} />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : posts.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onPostUpdated={loadPosts}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}