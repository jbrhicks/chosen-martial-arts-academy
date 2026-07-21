import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, Loader2, MessageSquare } from "lucide-react";

export default function ShiftLogbook() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => { loadMessages(); }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.TeamShiftLogbook.subscribe(() => { loadMessages(); });
    return unsubscribe;
  }, []);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.TeamShiftLogbook.list("-created_date", 100);
      setMessages([...msgs].reverse());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await base44.entities.TeamShiftLogbook.create({
        author_name: user?.full_name || "Instructor",
        author_tier: user?.instructor_tier || "",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (e) { alert("Failed to send: " + e.message); }
    setSending(false);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-[#C9A84C]" />
        <h2 className="text-lg font-bold">Shift Hand-Off Logbook</h2>
      </div>
      <p className="text-xs text-[#A8A9AD]">Private team feed — leave operational notes for the next shift. Not visible to students.</p>

      <div ref={scrollRef} className="border border-[#A8A9AD]/20 bg-black h-96 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className="text-[#A8A9AD] mx-auto mb-2" />
            <p className="text-sm text-[#A8A9AD]">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.created_by_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] border p-3 ${isOwn ? "border-[#C9A84C]/30 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-[#0A0A0A]"}`}>
                  {!isOwn && (
                    <p className="text-xs font-bold text-[#C9A84C] mb-1">
                      {msg.author_name}{msg.author_tier ? ` · ${msg.author_tier}` : ""}
                    </p>
                  )}
                  <p className="text-sm text-white whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className="text-[10px] text-[#A8A9AD] mt-1 text-right">{formatTime(msg.created_date)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Leave a note for the next shift..."
          className="flex-1 bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
        />
        <button onClick={handleSend} disabled={sending || !newMessage.trim()} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}