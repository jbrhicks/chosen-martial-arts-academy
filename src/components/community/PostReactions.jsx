import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function PostReactions({ post, currentUser, onPostUpdated }) {
  const [userReaction, setUserReaction] = useState(null);
  const [bowCount, setBowCount] = useState(post.bow_count || 0);
  const [highFiveCount, setHighFiveCount] = useState(post.high_five_count || 0);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Like.filter({ post_id: post.id, user_id: currentUser.id }).then(likes => {
      if (likes.length > 0) setUserReaction(likes[0].reaction_type || "bow");
    }).catch(() => {});
  }, [post.id, currentUser]);

  const handleReact = async (type) => {
    if (!currentUser) return;
    try {
      const existing = await base44.entities.Like.filter({ post_id: post.id, user_id: currentUser.id });
      let newBow = bowCount;
      let newHighFive = highFiveCount;

      if (existing.length > 0) {
        await base44.entities.Like.delete(existing[0].id);
        if (existing[0].reaction_type === "bow") newBow = Math.max(0, newBow - 1);
        else newHighFive = Math.max(0, newHighFive - 1);

        if (existing[0].reaction_type === type) {
          setUserReaction(null);
          setBowCount(newBow);
          setHighFiveCount(newHighFive);
          await base44.entities.Post.update(post.id, { bow_count: newBow, high_five_count: newHighFive });
          onPostUpdated?.();
          return;
        }
      }

      await base44.entities.Like.create({ post_id: post.id, user_id: currentUser.id, reaction_type: type });
      if (type === "bow") newBow++;
      else newHighFive++;
      setUserReaction(type);
      setBowCount(newBow);
      setHighFiveCount(newHighFive);
      await base44.entities.Post.update(post.id, { bow_count: newBow, high_five_count: newHighFive });
      onPostUpdated?.();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleReact("bow")}
        className={`flex items-center gap-1.5 text-sm transition-colors ${userReaction === "bow" ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`}
        title="Bow"
      >
        <span className={`text-lg ${userReaction === "bow" ? "" : "opacity-60"}`}>🙇</span>
        <span className={userReaction === "bow" ? "font-bold" : ""}>{bowCount}</span>
      </button>
      <button
        onClick={() => handleReact("high_five")}
        className={`flex items-center gap-1.5 text-sm transition-colors ${userReaction === "high_five" ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`}
        title="High-Five"
      >
        <span className={`text-lg ${userReaction === "high_five" ? "" : "opacity-60"}`}>✋</span>
        <span className={userReaction === "high_five" ? "font-bold" : ""}>{highFiveCount}</span>
      </button>
    </div>
  );
}