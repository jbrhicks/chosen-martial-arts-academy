import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Video, Loader2, Send, Megaphone, BarChart3, Trophy, X, Plus, Award, Calendar, BookOpen, Sparkles } from "lucide-react";

const INAPPROPRIATE_WORDS = ["damn", "hell", "shit", "fuck", "ass", "bitch", "bastard", "crap", "piss"];

function checkInappropriate(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return INAPPROPRIATE_WORDS.some(word => lower.includes(word));
}

export default function PostComposer({ currentUser, onPosted, groups = [], events = [], videos = [], students = [] }) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [postType, setPostType] = useState("standard");
  const [groupId, setGroupId] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeBadge, setChallengeBadge] = useState("gold");
  const [submitting, setSubmitting] = useState(false);
  const [linkedEventId, setLinkedEventId] = useState("");
  const [linkedVideoId, setLinkedVideoId] = useState("");
  const [spotlightStudentId, setSpotlightStudentId] = useState("");
  const [spotlightBeltRank, setSpotlightBeltRank] = useState("");
  const fileRef = useRef(null);

  const isAdmin = currentUser?.role === "admin";

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - mediaFiles.length);
    setMediaFiles([...mediaFiles, ...files]);
  };

  const removeFile = (idx) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== idx));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0 && postType !== "poll") return;
    if (postType === "poll" && pollOptions.filter(o => o.trim()).length < 2) { alert("Add at least 2 poll options."); return; }
    setSubmitting(true);
    try {
      // Upload all media files
      const mediaUrls = [];
      for (const file of mediaFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        mediaUrls.push({ url: file_url, type: file.type.startsWith("video") ? "video" : "image" });
      }

      // Check for inappropriate content
      const isHidden = checkInappropriate(content);

      const postData = {
        author_id: currentUser.id,
        author_name: currentUser.full_name,
        author_role: currentUser.role,
        content: content.trim(),
        media_url: mediaUrls[0]?.url || null,
        media_type: mediaUrls.length > 0 ? mediaUrls[0].type : "none",
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        bow_count: 0,
        high_five_count: 0,
        post_type: postType,
        group_id: groupId || undefined,
        is_hidden: isHidden,
      };

      if (postType === "poll") postData.poll_options = pollOptions.filter(o => o.trim()).join("|");
      if (postType === "challenge") { postData.challenge_description = challengeDesc; postData.challenge_badge = challengeBadge; }
      if (postType === "broadcast") { postData.is_pinned = true; postData.is_announcement = true; }
      if (postType === "event_link" && linkedEventId) {
        const event = events.find(ev => ev.id === linkedEventId);
        postData.linked_event_id = linkedEventId;
        postData.linked_event_title = event?.title || "";
      }
      if (postType === "form_check" && linkedVideoId) {
        const video = videos.find(v => v.id === linkedVideoId);
        postData.linked_curriculum_video_id = linkedVideoId;
        postData.linked_curriculum_video_title = video?.title || "";
      }
      if (postType === "student_spotlight" && spotlightStudentId) {
        const student = students.find(s => s.id === spotlightStudentId);
        postData.spotlight_student_id = spotlightStudentId;
        postData.spotlight_student_name = student?.full_name || "";
        postData.spotlight_belt_rank = spotlightBeltRank || student?.belt_rank || "";
      }

      const createdPost = await base44.entities.Post.create(postData);

      // Create PostMedia records for additional attachments
      for (let i = 1; i < mediaUrls.length; i++) {
        await base44.entities.PostMedia.create({
          post_id: createdPost.id,
          media_url: mediaUrls[i].url,
          media_type: mediaUrls[i].type,
          display_order: i,
        });
      }

      // Broadcast: send email to all users
      if (postType === "broadcast") {
        try {
          const users = await base44.entities.User.list();
          for (const u of users) {
            if (u.email) {
              await base44.integrations.Core.SendEmail({
                to: u.email,
                subject: "Chosen Martial Arts Academy — Announcement",
                body: `${content.trim()}\n\n— ${currentUser.full_name}\nChosen Martial Arts Academy`,
              });
            }
          }
        } catch (e) { console.error("Broadcast email failed", e); }
      }

      if (isHidden) {
        alert("Your post contains language that has been flagged for review. It will be hidden from the community feed until an admin reviews it.");
      }

      // Reset
      setContent("");
      setMediaFiles([]);
      setPostType("standard");
      setGroupId("");
      setPollOptions(["", ""]);
      setChallengeDesc("");
      setChallengeBadge("gold");
      setLinkedEventId("");
      setLinkedVideoId("");
      setSpotlightStudentId("");
      setSpotlightBeltRank("");
      if (fileRef.current) fileRef.current.value = "";
      onPosted?.();
    } catch (e) {
      console.error(e);
      alert("Failed to post. Please try again.");
    }
    setSubmitting(false);
  };

  const typeLabels = {
    standard: { label: "Post", icon: Send },
    poll: { label: "Poll", icon: BarChart3 },
    challenge: { label: "Challenge", icon: Trophy },
    broadcast: { label: "Announce", icon: Megaphone },
    form_check: { label: "Form Check", icon: Video },
    event_link: { label: "Event", icon: Calendar },
    student_spotlight: { label: "Spotlight", icon: Sparkles },
  };

  return (
    <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-6 mb-6">
      {/* Post type selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 border border-[#A8A9AD]/20 p-1 flex-wrap">
          {Object.entries(typeLabels).map(([key, val]) => {
            if ((key === "challenge" || key === "broadcast" || key === "event_link" || key === "student_spotlight") && !isAdmin) return null;
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
        onChange={e => setContent(e.target.value)}
        rows={3}
        placeholder={postType === "broadcast" ? "Announcement to all members..." : postType === "challenge" ? "Describe the challenge..." : postType === "form_check" ? "Share your form for feedback..." : postType === "student_spotlight" ? "Highlight this student's journey..." : "What did you practice today?"}
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

      {/* Event Link selector */}
      {postType === "event_link" && (
        <div className="mb-4">
          <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Link to Event</label>
          <select value={linkedEventId} onChange={e => setLinkedEventId(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Select an event...</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.start_date).toLocaleDateString()})</option>)}
          </select>
        </div>
      )}

      {/* Form Check: Curriculum Link */}
      {postType === "form_check" && (
        <div className="mb-4">
          <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Link to Curriculum Video (Optional)</label>
          <select value={linkedVideoId} onChange={e => setLinkedVideoId(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">No curriculum link...</option>
            {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        </div>
      )}

      {/* Student Spotlight selector */}
      {postType === "student_spotlight" && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Select Student</label>
            <select value={spotlightStudentId} onChange={e => setSpotlightStudentId(e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              <option value="">Select a student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.belt_rank ? `(${s.belt_rank})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Belt Rank (optional)</label>
            <input value={spotlightBeltRank} onChange={e => setSpotlightBeltRank(e.target.value)} placeholder="e.g., Green Belt" className="w-full bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
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

      {/* Media preview */}
      {mediaFiles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {mediaFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-[#A8A9AD] border border-[#A8A9AD]/20 px-3 py-2">
              {file.type.startsWith("video") ? <Video size={16} className="text-[#C9A84C]" /> : <ImagePlus size={16} className="text-[#C9A84C]" />}
              <span className="text-xs max-w-[100px] truncate">{file.name}</span>
              <button onClick={() => removeFile(idx)} className="text-red-400 text-xs"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {postType !== "poll" && mediaFiles.length < 4 && (
            <>
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" id="media-upload" multiple />
              <label htmlFor="media-upload" className="flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50 transition-colors cursor-pointer">
                <ImagePlus size={16} /> Photo/Video ({mediaFiles.length}/4)
              </label>
            </>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && mediaFiles.length === 0 && postType !== "poll")}
          className="flex items-center gap-2 px-6 py-2 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {postType === "broadcast" ? "Broadcast" : postType === "challenge" ? "Post Challenge" : postType === "poll" ? "Post Poll" : postType === "form_check" ? "Post Form" : postType === "event_link" ? "Post Event" : postType === "student_spotlight" ? "Post Spotlight" : "Post"}
        </button>
      </div>
    </div>
  );
}