import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { SmilePlus } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🙏", "👏"];

export default function MessageReactions({ messageId, reactions, currentUserId, onUpdate }) {
  const [showPicker, setShowPicker] = useState(false);

  const grouped = {};
  (reactions || []).forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r);
  });

  const toggleReaction = async (emoji) => {
    setShowPicker(false);
    const existing = (reactions || []).find(r => r.user_id === currentUserId && r.emoji === emoji);
    if (existing) {
      await base44.entities.MessageReaction.delete(existing.id);
    } else {
      const me = await base44.auth.me();
      await base44.entities.MessageReaction.create({
        message_id: messageId,
        user_id: currentUserId,
        user_name: me.full_name,
        emoji
      });
    }
    onUpdate();
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1 relative">
      {Object.entries(grouped).map(([emoji, users]) => {
        const isMine = users.some(u => u.user_id === currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
              isMine ? "bg-[#C9A84C]/30 border border-[#C9A84C]/50" : "bg-white/5 border border-[#A8A9AD]/20 hover:bg-white/10"
            }`}
            title={users.map(u => u.user_name).join(", ")}
          >
            <span>{emoji}</span>
            <span className="text-[10px] text-[#A8A9AD]">{users.length}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-[#A8A9AD] hover:text-[#C9A84C] p-0.5 transition-colors"
        >
          <SmilePlus size={14} />
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-6 left-0 z-50 bg-[#1a1a1a] border border-[#A8A9AD]/20 rounded-lg p-1.5 flex gap-1 shadow-xl">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => toggleReaction(e)}
                  className="text-lg hover:scale-125 transition-transform p-0.5"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}