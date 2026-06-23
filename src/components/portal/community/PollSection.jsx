import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Check } from "lucide-react";

export default function PollSection({ post, currentUser }) {
  const [votes, setVotes] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);

  const options = post.poll_options ? post.poll_options.split("|").filter(Boolean) : [];

  const load = async () => {
    try {
      const allVotes = await base44.entities.PollVote.filter({ post_id: post.id });
      setVotes(allVotes);
      const mine = allVotes.find(v => v.user_id === currentUser?.id);
      setUserVote(mine ? mine.option_index : null);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [post.id]);

  const handleVote = async (index) => {
    if (userVote !== null || !currentUser) return;
    setVoting(true);
    try {
      await base44.entities.PollVote.create({ post_id: post.id, option_index: index, user_id: currentUser.id });
      load();
    } catch (e) { alert("Failed to vote."); }
    setVoting(false);
  };

  const totalVotes = votes.length;
  const getVoteCount = (index) => votes.filter(v => v.option_index === index).length;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#C9A84C] mb-2">
        <BarChart3 size={14} /> Poll {totalVotes > 0 && `• ${totalVotes} votes`}
      </div>
      {options.map((opt, i) => {
        const count = getVoteCount(i);
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isMyVote = userVote === i;
        return (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={userVote !== null || voting}
            className={`w-full text-left border p-3 transition-colors ${
              isMyVote ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"
            } ${userVote !== null ? "cursor-default" : "cursor-pointer"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm flex items-center gap-2">
                {isMyVote && <Check size={14} className="text-[#C9A84C]" />}
                {opt}
              </span>
              {userVote !== null && <span className="text-xs text-[#A8A9AD]">{pct}%</span>}
            </div>
            {userVote !== null && (
              <div className="h-1.5 bg-white/10 overflow-hidden">
                <div className="h-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}