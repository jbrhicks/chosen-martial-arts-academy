import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Mail, Phone, Bell, CheckCheck, Check, StickyNote, X, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function ChatWindow({ thread, currentUser, onMessageSent, showNotes, onToggleNotes }) {
  const [messages, setMessages] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [replyChannel, setReplyChannel] = useState("in_app");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await base44.entities.Message.filter({ thread_id: thread.id }, "created_date");
      setMessages(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMessages();
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.thread_id === thread.id) fetchMessages();
    });
    return () => unsubscribe();
  }, [thread.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!replyContent.trim()) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendMessage", {
        threadId: thread.id,
        content: replyContent,
        channel: replyChannel
      });
      // Mark outbound + update thread preview
      await base44.entities.MessageThread.update(thread.id, {
        last_message_preview: replyContent.substring(0, 120),
        last_message_date: new Date().toISOString()
      });
      setReplyContent("");
      fetchMessages();
      onMessageSent();
      toast.success("Message sent");
    } catch (e) {
      toast.error("Failed to send: " + e.message);
    }
    setSending(false);
  };

  const markRead = async () => {
    try {
      const participant = (await base44.entities.ThreadParticipant.filter({ thread_id: thread.id, user_id: currentUser.id }))[0];
      if (participant && participant.unread_count > 0) {
        await base44.entities.ThreadParticipant.update(participant.id, { unread_count: 0 });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { markRead(); }, [thread.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#A8A9AD]/20 flex items-center justify-between bg-black">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-sm">
            {(thread.dm_participant_name || thread.thread_name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">{thread.dm_participant_name || thread.thread_name || "Conversation"}</h3>
            <span className="text-[10px] text-[#A8A9AD] uppercase tracking-wider">
              {thread.status || "open"} {thread.assigned_admin_name ? `· ${thread.assigned_admin_name}` : ""}
            </span>
          </div>
        </div>
        <button
          onClick={onToggleNotes}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
            showNotes ? "bg-yellow-400 text-black" : "border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
          }`}
        >
          <StickyNote size={14} /> Internal Notes
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0A0A]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#A8A9AD] text-sm">
            No messages yet. Send the first message below.
          </div>
        ) : (
          messages.map(msg => {
            const isOutbound = msg.direction === "outbound" || msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg p-3 ${
                  isOutbound ? "bg-[#C9A84C]/20 border border-[#C9A84C]/30" : "bg-[#1a1a1a] border border-[#A8A9AD]/10"
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-medium text-[#C9A84C]">{msg.sender_name}</span>
                    <span className="text-[#A8A9AD]">
                      {msg.channel_used === "email" && <Mail size={10} />}
                      {msg.channel_used === "sms" && <Phone size={10} />}
                      {msg.channel_used === "in_app" && <Bell size={10} />}
                    </span>
                    {msg.direction && (
                      <span className="text-[9px] text-[#A8A9AD] uppercase tracking-wider">{msg.direction}</span>
                    )}
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-[#A8A9AD]">
                      {msg.created_date ? new Date(msg.created_date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                    </span>
                    {isOutbound && (
                      msg.read_receipt
                        ? <CheckCheck size={12} className="text-[#C9A84C]" />
                        : <Check size={12} className="text-[#A8A9AD]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-[#A8A9AD]/20 bg-black">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-[#A8A9AD] uppercase tracking-wider">Send via:</span>
          <div className="flex gap-1">
            {[
              { val: "in_app", label: "In-App", icon: Bell },
              { val: "sms", label: "SMS", icon: Phone },
              { val: "email", label: "Email", icon: Mail },
            ].map(c => {
              const Icon = c.icon;
              return (
                <button
                  key={c.val}
                  onClick={() => setReplyChannel(c.val)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
                    replyChannel === c.val ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"
                  }`}
                >
                  <Icon size={11} /> {c.label}
                </button>
              );
            })}
          </div>
          {replyChannel !== "in_app" && (
            <span className="text-[10px] text-[#A8A9AD] ml-1">Respects user opt-in</span>
          )}
        </div>
        <div className="flex gap-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#0A0A0A] border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white placeholder:text-[#A8A9AD] focus:border-[#C9A84C] focus:outline-none min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={!replyContent.trim() || sending}
            className="bg-[#C9A84C] text-black px-4 flex items-center justify-center hover:bg-[#E0C97A] disabled:opacity-50"
          >
            {sending ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}