import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Pin, Flag, Trash2, Send, Loader2 } from "lucide-react";
import BeltBadge from "@/components/BeltBadge";

export default function PostCard({ post, currentUser, onPostUpdated, onPostDeleted }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const isAuthor = currentUser?.id === post.author_id;

  useEffect(() => {
    if (post.like_count !== undefined) setLikeCount(post.like_count);
  }, [post.like_count]);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Like.filter({ post_id: post.id, user_id: currentUser.id })
      .then((likes) => setLiked(likes.length > 0))
      .catch(() => {});
  }, [post.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;
    if (liked) {
      try {
        const likes = await base44.entities.Like.filter({ post_id: post.id, user_id: currentUser.id });
        if (likes.length > 0) await base44.entities.Like.delete(likes[0].id);
        setLiked(false);
        const newCount = Math.max(0, likeCount - 1);
        setLikeCount(newCount);
        await base44.entities.Post.update(post.id, { like_count: newCount });
        onPostUpdated?.();
      } catch (e) { console.error(e); }
    } else {
      try {
        await base44.entities.Like.create({ post_id: post.id, user_id: currentUser.id });
        setLiked(true);
        const newCount = likeCount + 1;
        setLikeCount(newCount);
        await base44.entities.Post.update(post.id, { like_count: newCount });
        onPostUpdated?.();
      } catch (e) { console.error(e); }
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await base44.entities.Comment.filter({ post_id: post.id });
      setComments(data.filter((c) => !c.is_deleted).reverse());
    } catch (e) { console.error(e); }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await base44.entities.Comment.create({
        post_id: post.id,
        author_id: currentUser.id,
        author_name: currentUser.full_name,
        content: newComment.trim(),
      });
      setComments([created, ...comments]);
      setNewComment("");
      const newCount = (post.comment_count || 0) + 1;
      await base44.entities.Post.update(post.id, { comment_count: newCount });
      onPostUpdated?.();
    } catch (e) { console.error(e); }
    setSubmittingComment(false);
  };

  const handlePin = async () => {
    setActionLoading(true);
    try {
      await base44.entities.Post.update(post.id, { is_pinned: !post.is_pinned });
      onPostUpdated?.();
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  const handleFlag = async () => {
    setActionLoading(true);
    try {
      await base44.entities.Post.update(post.id, { is_flagged: !post.is_flagged });
      onPostUpdated?.();
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await base44.entities.Post.update(post.id, { is_deleted: true });
      onPostDeleted?.(post.id);
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  return (
    <div className={`border p-6 transition-colors ${
      post.is_pinned ? "border-[#C9A84C]/50 bg-[#C9A84C]/5" :
      post.is_announcement ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" :
      post.is_flagged ? "border-red-500/30 bg-red-500/5" :
      "border-[#A8A9AD]/20 bg-[#0A0A0A] hover:border-[#A8A9AD]/30"
    }`}>
      {/* Pinned/announcement banner */}
      {post.is_pinned && (
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3">
          <Pin size={12} /> Pinned
        </div>
      )}
      {post.is_announcement && !post.is_pinned && (
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3">
          Announcement
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm ${
          post.author_role === "admin" ? "bg-[#C9A84C] text-black" : "bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C]"
        }`}>
          {post.author_name?.charAt(0) || "?"}
        </div>
        <div>
          <p className="text-sm font-medium">{post.author_name}</p>
          {post.author_role === "admin" && <p className="text-[10px] text-[#C9A84C] tracking-widest uppercase">Instructor</p>}
        </div>
      </div>

      {/* Content */}
      {post.content && <p className="text-white leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>}

      {/* Media */}
      {post.media_url && post.media_type === "image" && (
        <img src={post.media_url} alt="" className="w-full max-h-96 object-cover border border-[#A8A9AD]/20 mb-4" />
      )}
      {post.media_url && post.media_type === "video" && (
        <video src={post.media_url} controls className="w-full max-h-96 border border-[#A8A9AD]/20 mb-4" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#A8A9AD]/20">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${liked ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white"}`}
        >
          <Heart size={18} className={liked ? "fill-[#C9A84C]" : ""} />
          {likeCount}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 text-sm text-[#A8A9AD] hover:text-white transition-colors"
        >
          <MessageCircle size={18} />
          {post.comment_count || 0}
        </button>

        {(isAdmin || isAuthor) && (
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={handlePin}
                  disabled={actionLoading}
                  className={`p-1.5 transition-colors ${post.is_pinned ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`}
                  title={post.is_pinned ? "Unpin" : "Pin to top"}
                >
                  <Pin size={16} />
                </button>
                <button
                  onClick={handleFlag}
                  disabled={actionLoading}
                  className={`p-1.5 transition-colors ${post.is_flagged ? "text-red-400" : "text-[#A8A9AD] hover:text-red-400"}`}
                  title={post.is_flagged ? "Unflag" : "Flag"}
                >
                  <Flag size={16} />
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="p-1.5 text-[#A8A9AD] hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-[#A8A9AD]/20 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-[#A8A9AD]" /></div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C] shrink-0">
                  {c.author_name?.charAt(0)}
                </div>
                <div className="flex-1 bg-white/5 p-3">
                  <p className="text-xs font-medium mb-1">{c.author_name}</p>
                  <p className="text-sm text-[#A8A9AD]">{c.content}</p>
                </div>
              </div>
            ))
          )}

          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border border-[#A8A9AD]/20 px-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="px-4 bg-[#C9A84C] text-black hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
            >
              {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}