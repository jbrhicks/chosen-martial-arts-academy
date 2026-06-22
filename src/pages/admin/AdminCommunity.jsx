import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PostCard from "@/components/PostCard";
import { Loader2, Flag, Pin, Trash2, MessageSquare } from "lucide-react";

export default function AdminCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

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

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const filtered = posts.filter((p) => {
    if (filter === "flagged") return p.is_flagged && !p.is_deleted;
    if (filter === "deleted") return p.is_deleted;
    if (filter === "pinned") return p.is_pinned;
    return !p.is_deleted;
  });

  const handlePostDeleted = (id) => {
    setPosts(posts.map((p) => p.id === id ? { ...p, is_deleted: true } : p));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Content Moderation</p>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Moderate posts, pin announcements, and manage flagged content.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All Posts", icon: MessageSquare },
          { key: "pinned", label: "Pinned", icon: Pin },
          { key: "flagged", label: "Flagged", icon: Flag },
          { key: "deleted", label: "Deleted", icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase transition-all ${
                filter === tab.key ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No posts in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
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