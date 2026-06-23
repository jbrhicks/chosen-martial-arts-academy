import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Video, Loader2, Send, Megaphone, BarChart3, Trophy, Users, X, Plus } from "lucide-react";

export default function PostComposer({ currentUser, onPosted, groups = [] }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("none");
  const [postType, setPostType] = useState("standard");
  const [groupId, setGroupId] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeBadge, setChallengeBadge] = useState("gold");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const isAdmin = currentUser?.role === "admin";
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile && postType !== "poll") return;
    if (postType === "poll" && pollOptions.filter(o => o.trim()).length < 2) { alert("Add at least 2 poll options."); return; }
    setSubmitting(true);
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
        mediaUrl = file_url;
      }

      const postData = {
        author_id: currentUser.id,
        author_name: currentUser.full_name,
        author_role: currentUser.role,
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaFile ? mediaType : "none",
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        post_type: postType,
        group_id: groupId || undefined,
      };

      if (postType === "poll") {
        postData.poll_options = pollOptions.filter(o => o.trim()).join("|");
      }
      if (postType === "challenge") {
        postData.challenge_description = challengeDesc;
        postData.challenge_badge = challengeBadge;
      }
      if (postType === "broadcast") {
        postData.is_pinned = true;
        postData.is_announcement = true;
      }

      await base44.entities.Post.create(postData);

      // Broadcast: send email to all users
      if (postType === "broadcast") {
        try {
          const users = await base44.entities.User.list();
          for (const u of users) {
            if (u.email) {
              await base44.integrations.Core.SendEmail({
                to: u.email,
                subject: "Chosen Martial Arts Academy — Broadcast",
                body: `${content.trim()}\n\n— ${currentUser.full_name}\nChosen Martial Arts Academy`,
              });
            }
          }
        } catch (e) { console.error("Broadcast email failed", e); }
      }

      setContent("");
      setMediaFile(null);
      setMediaType("none");
      setPostType("standard");
      setGroupId("");
      setPollOptions(["", ""]);
      setChallengeDesc("");
      setChallengeBadge("gold");
      setShowTypeSelector(false);
      if (fileRef.current) fileRef.current.value = "";
      onPosted?.();
    } catch (e) {
      console.error(e);
      alert("Failed to post. Please try again.");
    }
    setSubmitting(false);
  };

  const typeLabels = {
    standard: { label: "Standard Post", icon: Send },
    poll: { label: "Poll", icon: BarChart3 },
    challenge: { label: "Challenge", icon: Trophy },
    broadcast: { label: "Broadcast", icon: Megaphone },
  };

  return (
    <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-6 mb-6">
      {/* Post type selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 border border-[#A8A9AD]/20 p-1">
          {Object.entries(typeLabels).map(([key, val]) => {
            if ((key === "challenge" || key === "broadcast") && !isAdmin) return null;
            const Icon = val.icon;
            return (
              <button key={key} onClick={() => setPostType(key)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide transition-colors ${postType === key ? "bg-[#C9A84C] text-black font-bold" : "text-[#A8A9AD] hover:text-white"}`}>
                <Icon size={12} /> {val.label}
              </button>
            );
          })}
        </div>
        {groups.length > 0 && (
          <select value={groupId} onChange={e => setGroupId(e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Main Feed</option>
            {groups.map(g => <option key={g.group_id} value={g.group_id}>{g.group_name}</option>)}
          </select>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder={postType === "broadcast" ? "Broadcast message to all members..." : postType === "challenge" ? "Describe the challenge..." : "What did you practice today?"}
        className="w-full bg-transparent border border-[#A8A9AD]/20 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors resize-none mb-4"
      />

      {/* Poll options */}
      {postType === "poll" && (
        <div className="mb-4 space-y-2">
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Poll Options</p>
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={opt} onChange={e => setPollOptions(pollOptions.map((p, idx) => idx === i ? e.target.value : p))} placeholder={`Option ${i + 1}`} className="flex-1 bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              {pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-[#A8A9AD] hover:text-red-400"><X size={16} /></button>}
            </div>
          ))}
          {pollOptions.length < 6 && <button onClick={() => setPollOptions([...pollOptions, ""])} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A]"><Plus size={12} /> Add Option</button>}
        </div>
      )}

      {/* Challenge fields */}
      {postType === "challenge" && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Challenge Description</label>
            <input value={challengeDesc} onChange={e => setChallengeDesc(e.target.value)} placeholder="e.g. 100 Kicks in 2 Minutes" className="w-full bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Badge Type</label>
            <div className="flex gap-2">
              <button onClick={() => setChallengeBadge("gold")} className={`px-4 py-2 text-xs font-medium border-2 transition-colors ${challengeBadge === "gold" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>Gold</button>
              <button onClick={() => setChallengeBadge("silver")} className={`px-4 py-2 text-xs font-medium border-2 transition-colors ${challengeBadge === "silver" ? "border-[#A8A9AD] bg-[#A8A9AD]/10 text-white" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>Silver</button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast notice */}
      {postType === "broadcast" && (
        <div className="mb-4 border border-[#A8A9AD]/30 bg-[#A8A9AD]/5 p-3 flex items-center gap-2">
          <Megaphone size={14} className="text-[#A8A9AD]" />
          <p className="text-xs text-[#A8A9AD]">This will pin to the top of the Main Feed and email all members.</p>
        </div>
      )}

      {mediaFile && (
        <div className="mb-4 flex items-center gap-3 text-sm text-[#A8A9AD]">
          {mediaType === "video" ? <Video size={16} className="text-[#C9A84C]" /> : <ImagePlus size={16} className="text-[#C9A84C]" />}
          {mediaFile.name}
          <button onClick={() => { setMediaFile(null); setMediaType("none"); if (fileRef.current) fileRef.current.value = ""; }} className="text-red-400 text-xs">Remove</button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {postType !== "poll" && (
            <>
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" id="media-upload" />
              <label htmlFor="media-upload" className="flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50 transition-colors cursor-pointer">
                <ImagePlus size={16} /> Photo/Video
              </label>
            </>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && !mediaFile && postType !== "poll")}
          className="flex items-center gap-2 px-6 py-2 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {postType === "broadcast" ? "Broadcast" : postType === "challenge" ? "Post Challenge" : postType === "poll" ? "Post Poll" : "Post"}
        </button>
      </div>
    </div>
  );
}