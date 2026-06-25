import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { MessageCircle, Pin, Trash2, Send, Loader2, Share2, Megaphone, Trophy, BarChart3, Flag, Calendar, Award, Sparkles, BookOpen, Clock, Video } from "lucide-react";
import PollSection from "@/components/portal/community/PollSection";
import ChallengeSection from "@/components/portal/community/ChallengeSection";
import PostMediaGallery from "@/components/community/PostMediaGallery";
import PostReactions from "@/components/community/PostReactions";
import ReportModal from "@/components/community/ReportModal";

export default function PostCard({ post, currentUser, onPostUpdated, onPostDeleted }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentTimestamp, setCommentTimestamp] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [showReport, setShowReport] = useState(false);
  const [reportingComment, setReportingComment] = useState(null);

  const isAdmin = currentUser?.role === "admin";
  const isAuthor = currentUser?.id === post.author_id;
  const isFormCheck = post.post_type === "form_check";
  const isSpotlight = post.post_type === "student_spotlight";
  const isRankUp = post.post_type === "rank_up";
  const isEventLink = post.post_type === "event_link";
  const isBroadcast = post.post_type === "broadcast";

  useEffect(() => { if (post.share_count !== undefined) setShareCount(post.share_count); }, [post.share_count]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await base44.entities.Comment.filter({ post_id: post.id });
      setComments(data.filter(c => !c.is_deleted).reverse());
    } catch (e) { console.error(e); }
    setLoadingComments(false);
  };

  const toggleComments = () => { if (!showComments) loadComments(); setShowComments(!showComments); };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await base44.entities.Comment.create({
        post_id: post.id,
        author_id: currentUser.id,
        author_name: currentUser.full_name,
        author_role: currentUser.role,
        content: newComment.trim(),
        timestamp: isFormCheck && commentTimestamp ? commentTimestamp : undefined,
      });
      setComments([created, ...comments]);
      setNewComment("");
      setCommentTimestamp("");
      const newCount = (post.comment_count || 0) + 1;
      await base44.entities.Post.update(post.id, { comment_count: newCount });
      onPostUpdated?.();
    } catch (e) { console.error(e); }
    setSubmittingComment(false);
  };

  const handleShare = async () => {
    try {
      const newCount = shareCount + 1;
      setShareCount(newCount);
      await base44.entities.Post.update(post.id, { share_count: newCount });
    } catch (e) {}
  };

  const handlePin = async () => { setActionLoading(true); try { await base44.entities.Post.update(post.id, { is_pinned: !post.is_pinned }); onPostUpdated?.(); } catch (e) {} setActionLoading(false); };
  const handleDelete = async () => { if (!confirm("Delete this post?")) return; setActionLoading(true); try { await base44.entities.Post.update(post.id, { is_deleted: true }); onPostDeleted?.(post.id); } catch (e) {} setActionLoading(false); };
  const handleDeleteComment = async (id) => { try { await base44.entities.Comment.update(id, { is_deleted: true }); setComments(comments.filter(c => c.id !== id)); } catch (e) {} };

  return (
    <div className={`border p-6 transition-colors ${
      isRankUp ? "border-[#C9A84C]/60 bg-gradient-to-b from-[#C9A84C]/10 to-transparent" :
      isBroadcast ? "border-[#A8A9AD]/60 bg-[#A8A9AD]/5" :
      post.is_pinned ? "border-[#C9A84C]/50 bg-[#C9A84C]/5" :
      post.is_flagged ? "border-red-500/30 bg-red-500/5" :
      "border-[#A8A9AD]/20 bg-[#0A0A0A] hover:border-[#A8A9AD]/30"
    }`}>
      {/* Type Banners */}
      {isBroadcast && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#A8A9AD] mb-3"><Megaphone size={12} /> Announcement</div>}
      {post.is_pinned && !isBroadcast && !isRankUp && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><Pin size={12} /> Pinned</div>}
      {post.post_type === "poll" && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><BarChart3 size={12} /> Poll</div>}
      {post.post_type === "challenge" && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><Trophy size={12} /> Challenge</div>}
      {isFormCheck && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><Video size={12} /> Check My Form</div>}
      {isSpotlight && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><Sparkles size={12} /> Student Spotlight</div>}
      {isRankUp && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><Award size={12} /> Rank Promotion</div>}
      {isEventLink && <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-3"><Calendar size={12} /> Event</div>}

      {/* Author with Instructor Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm ${post.author_role === "admin" ? "bg-[#C9A84C] text-black" : "bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C]"}`}>
          {post.author_name?.charAt(0) || "?"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{post.author_name}</p>
            {post.author_role === "admin" && <span className="px-1.5 py-0.5 bg-[#C9A84C] text-black text-[9px] font-bold tracking-widest uppercase rounded">Instructor</span>}
          </div>
          <p className="text-[10px] text-[#A8A9AD]">{post.created_date ? new Date(post.created_date).toLocaleString() : ""}</p>
        </div>
      </div>

      {/* Rank-Up Special Design */}
      {isRankUp && (
        <div className="text-center py-6 mb-4">
          <div className="w-16 h-16 mx-auto mb-3 border-2 border-[#C9A84C] flex items-center justify-center">
            <Award size={32} className="text-[#C9A84C]" />
          </div>
          <p className="text-lg font-bold text-white">Congratulations to {post.rank_up_student_name || post.author_name}!</p>
          <p className="text-sm text-[#C9A84C] mt-1">Earned their {post.rank_up_new_belt}</p>
        </div>
      )}

      {/* Spotlight Info */}
      {isSpotlight && post.spotlight_student_name && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 mb-4">
          <p className="text-sm font-bold text-white">{post.spotlight_student_name}</p>
          {post.spotlight_belt_rank && <p className="text-xs text-[#C9A84C] mt-1">{post.spotlight_belt_rank}</p>}
        </div>
      )}

      {/* Content */}
      {post.content && <p className="text-white leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>}

      {/* Poll / Challenge */}
      {post.post_type === "poll" && <PollSection post={post} currentUser={currentUser} />}
      {post.post_type === "challenge" && <ChallengeSection post={post} currentUser={currentUser} />}

      {/* Media Gallery (multiple images/videos) */}
      <PostMediaGallery post={post} />

      {/* Event RSVP */}
      {isEventLink && post.linked_event_id && (
        <Link to="/portal/events" className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E0C97A] transition-colors mb-4">
          <Calendar size={16} /> Count Me In
        </Link>
      )}

      {/* Form Check: Link to Curriculum */}
      {isFormCheck && post.linked_curriculum_video_id && (
        <Link to="/portal/curriculum" className="inline-flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/30 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/10 transition-colors mb-4">
          <BookOpen size={16} /> Reference: {post.linked_curriculum_video_title || "Curriculum Video"}
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#A8A9AD]/20">
        <PostReactions post={post} currentUser={currentUser} onPostUpdated={onPostUpdated} />
        <button onClick={toggleComments} className="flex items-center gap-2 text-sm text-[#A8A9AD] hover:text-white transition-colors">
          <MessageCircle size={18} /> {post.comment_count || 0}
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 text-sm text-[#A8A9AD] hover:text-white transition-colors">
          <Share2 size={18} /> {shareCount}
        </button>
        <button onClick={() => setShowReport(true)} className="flex items-center gap-2 text-sm text-[#A8A9AD] hover:text-red-400 transition-colors" title="Report to Admin">
          <Flag size={16} />
        </button>

        {(isAdmin || isAuthor) && (
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && <button onClick={handlePin} disabled={actionLoading} className={`p-1.5 transition-colors ${post.is_pinned ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`} title="Pin"><Pin size={16} /></button>}
            <button onClick={handleDelete} disabled={actionLoading} className="p-1.5 text-[#A8A9AD] hover:text-red-400 transition-colors" title="Delete"><Trash2 size={16} /></button>
          </div>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-[#A8A9AD]/20 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-[#A8A9AD]" /></div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C] shrink-0">{c.author_name?.charAt(0)}</div>
                <div className="flex-1 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{c.author_name}</p>
                      {c.author_role === "admin" && <span className="px-1 py-0.5 bg-[#C9A84C] text-black text-[8px] font-bold tracking-widest uppercase rounded">Instructor</span>}
                      {c.timestamp && <span className="text-xs text-[#C9A84C] flex items-center gap-1"><Clock size={10} /> {c.timestamp}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setReportingComment(c)} className="text-[#A8A9AD] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Report"><Flag size={12} /></button>
                      {(isAdmin || c.author_id === currentUser?.id) && <button onClick={() => handleDeleteComment(c.id)} className="text-[#A8A9AD] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>}
                    </div>
                  </div>
                  <p className="text-sm text-[#A8A9AD] mt-1">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <form onSubmit={handleComment} className="space-y-2">
            {isFormCheck && (
              <input type="text" value={commentTimestamp} onChange={e => setCommentTimestamp(e.target.value)} placeholder="Timestamp (e.g., 0:15)" className="w-full bg-white/5 border border-[#A8A9AD]/20 px-3 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none" />
            )}
            <div className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={isFormCheck ? "Leave feedback..." : "Write a comment..."} className="flex-1 bg-white/5 border border-[#A8A9AD]/20 px-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors" />
              <button type="submit" disabled={submittingComment || !newComment.trim()} className="px-4 bg-[#C9A84C] text-black hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modals */}
      {showReport && (
        <ReportModal targetType="post" targetId={post.id} targetContent={post.content} targetAuthorName={post.author_name} currentUser={currentUser} onClose={() => setShowReport(false)} />
      )}
      {reportingComment && (
        <ReportModal targetType="comment" targetId={reportingComment.id} targetContent={reportingComment.content} targetAuthorName={reportingComment.author_name} currentUser={currentUser} onClose={() => setReportingComment(null)} />
      )}
    </div>
  );
}