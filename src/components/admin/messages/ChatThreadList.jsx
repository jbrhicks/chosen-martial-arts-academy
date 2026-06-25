import { Search, MessageSquare, PenSquare } from "lucide-react";

export default function ChatThreadList({ threads, selectedThreadId, onSelect, searchQuery, onSearchChange, unreadMap, onNewMessage }) {
  const filtered = threads.filter(t => {
    const name = t.dm_participant_name || t.thread_name || "Untitled";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    const ad = new Date(a.last_message_date || a.updated_date || a.created_date || 0).getTime();
    const bd = new Date(b.last_message_date || b.updated_date || b.created_date || 0).getTime();
    return bd - ad;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#A8A9AD]/20 space-y-2">
        {onNewMessage && (
          <button
            onClick={onNewMessage}
            className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] text-black px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-[#E0C97A] transition-colors"
          >
            <PenSquare size={14} /> New Message
          </button>
        )}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/20 pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#A8A9AD] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-[#A8A9AD] text-sm">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
            No conversations yet
          </div>
        ) : (
          sorted.map(thread => {
            const unread = unreadMap[thread.id] || 0;
            const isActive = selectedThreadId === thread.id;
            return (
              <button
                key={thread.id}
                onClick={() => onSelect(thread)}
                className={`w-full text-left p-3 border-b border-[#A8A9AD]/10 transition-colors flex items-start gap-3 ${
                  isActive ? "bg-[#C9A84C]/15 border-l-2 border-l-[#C9A84C]" : "hover:bg-white/5 border-l-2 border-l-transparent"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0 text-[#C9A84C] font-bold text-sm">
                  {(thread.dm_participant_name || thread.thread_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white text-sm truncate">
                      {thread.dm_participant_name || thread.thread_name || "Untitled"}
                    </span>
                    {thread.last_message_date && (
                      <span className="text-[10px] text-[#A8A9AD] shrink-0">
                        {new Date(thread.last_message_date).toLocaleDateString([], { month: "numeric", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-[#A8A9AD] truncate">
                      {thread.last_message_preview || "No messages yet"}
                    </span>
                    {unread > 0 && (
                      <span className="bg-[#C9A84C] text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                  {thread.status && thread.status !== "open" && (
                    <span className={`inline-block mt-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${
                      thread.status === "resolved" ? "bg-green-500/20 text-green-400" : 
                      thread.status === "archived" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {thread.status}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}