import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Mail, Phone, Bell, StickyNote, Clock, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import MessageBubble from "@/components/messages/MessageBubble";
import MessageMediaUploader from "@/components/messages/MessageMediaUploader";

export default function ChatWindow({ thread, currentUser, onMessageSent, showNotes, onToggleNotes, onArchive, onUnarchive, onDelete }) {
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [replyChannel, setReplyChannel] = useState("in_app");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const fetchMessages = async () => {
    const data = await base44.entities.Message.filter({ thread_id: thread.id }, "created_date");
    setMessages(data);
    const messageIds = data.map(m => m.id);
    if (messageIds.length > 0) {
      const allReactions = await base44.entities.MessageReaction.list();
      setReactions(allReactions.filter(r => messageIds.includes(r.message_id)));
    }
  };

  useEffect(() => {
    fetchMessages();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.thread_id === thread.id) fetchMessages();
    });
    return () => unsub();
  }, [thread.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!replyContent.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendMessage", {
        threadId: thread.id,
        content: replyContent || (attachments.length > 0 ? "📎 Attachment" : ""),
        channel: replyChannel,
        mediaUrls: attachments.length > 0 ? attachments : undefined
      });
      setReplyContent("");
      setAttachments([]);
      fetchMessages();
      onMessageSent();
    } catch (e) {
      toast.error("Failed to send: " + e.message);
    }
    setSending(false);
  };

  const markRead = async () => {
    const participant = (await base44.entities.ThreadParticipant.filter({ thread_id: thread.id, user_id: currentUser.id }))[0];
    if (participant && participant.unread_count > 0) {
      await base44.entities.ThreadParticipant.update(participant.id, { unread_count: 0 });
    }
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
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleNotes}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
              showNotes ? "bg-yellow-400 text-black" : "border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            <StickyNote size={14} /> Internal Notes
          </button>
          {thread.status === "archived" ? (
            <button
              onClick={() => onUnarchive(thread)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide border border-green-400/40 text-green-400 hover:bg-green-400/10 transition-colors"
              title="Restore from archive"
            >
              <ArchiveRestore size={14} /> Restore
            </button>
          ) : (
            <button
              onClick={() => onArchive(thread)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide border border-[#A8A9AD]/40 text-[#A8A9AD] hover:text-white hover:border-white/60 transition-colors"
              title="Archive this thread"
            >
              <Archive size={14} /> Archive
            </button>
          )}
          <button
            onClick={() => onDelete(thread)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide border border-red-400/40 text-red-400 hover:bg-red-400/10 transition-colors"
            title="Delete this thread permanently"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0A0A]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#A8A9AD] text-sm">
            No messages yet. Send the first message below.
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOutbound={msg.direction === "outbound" || msg.sender_id === currentUser.id}
              currentUserId={currentUser.id}
              reactions={reactions.filter(r => r.message_id === msg.id)}
              onReactionsUpdate={fetchMessages}
            />
          ))
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
        </div>
        <div className="flex items-end gap-2">
          <MessageMediaUploader attachments={attachments} onAttachmentsChange={setAttachments} />
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#0A0A0A] border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white placeholder:text-[#A8A9AD] focus:border-[#C9A84C] focus:outline-none min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={(!replyContent.trim() && attachments.length === 0) || sending}
            className="bg-[#C9A84C] text-black px-4 py-2 flex items-center justify-center hover:bg-[#E0C97A] disabled:opacity-50"
          >
            {sending ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}