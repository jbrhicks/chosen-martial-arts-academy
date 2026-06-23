import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Upload, Loader2, CheckCircle, Award } from "lucide-react";

export default function ChallengeSection({ post, currentUser }) {
  const [submissions, setSubmissions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const subs = await base44.entities.ChallengeSubmission.filter({ post_id: post.id });
      setSubmissions(subs);
      setMySubmission(subs.find(s => s.user_id === currentUser?.id));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [post.id]);

  const handleSubmit = async (file) => {
    if (!file || !currentUser) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ChallengeSubmission.create({
        post_id: post.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        video_url: file_url,
        status: "pending",
        badge_type: post.challenge_badge || "gold",
      });
      load();
    } catch (e) { alert("Failed to submit."); }
    setUploading(false);
  };

  const badgeColor = post.challenge_badge === "silver" ? "#A8A9AD" : "#C9A84C";

  return (
    <div className="mb-4 border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={16} className="text-[#C9A84C]" />
        <span className="text-xs tracking-widest uppercase text-[#C9A84C] font-bold">Challenge</span>
        <div className="ml-auto flex items-center gap-1">
          <Award size={14} style={{ color: badgeColor }} />
          <span className="text-xs" style={{ color: badgeColor }}>{post.challenge_badge || "Gold"} Badge</span>
        </div>
      </div>
      {post.challenge_description && <p className="text-sm text-white mb-3">{post.challenge_description}</p>}
      <p className="text-xs text-[#A8A9AD] mb-3">{submissions.length} submission{submissions.length !== 1 ? "s" : ""} so far</p>

      {mySubmission ? (
        <div className="flex items-center gap-2 text-sm">
          {mySubmission.status === "approved" ? (
            <><CheckCircle size={16} className="text-green-400" /><span className="text-green-400">Badge earned! Submission approved.</span></>
          ) : mySubmission.status === "rejected" ? (
            <span className="text-red-400">Submission rejected. Try again!</span>
          ) : (
            <><Loader2 size={14} className="animate-spin text-[#A8A9AD]" /><span className="text-[#A8A9AD]">Submission pending review...</span></>
          )}
        </div>
      ) : (
        <>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files[0] && handleSubmit(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Submit Video
          </button>
        </>
      )}
    </div>
  );
}