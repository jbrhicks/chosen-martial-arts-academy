import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ChatThreadList from "@/components/admin/messages/ChatThreadList";
import ChatWindow from "@/components/admin/messages/ChatWindow";
import InternalNotesPanel from "@/components/admin/messages/InternalNotesPanel";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminInbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [pendingUserId, setPendingUserId] = useState(searchParams.get("userId"));
  const [pendingUserName, setPendingUserName] = useState(searchParams.get("userName"));
  const [pendingMessage, setPendingMessage] = useState("");
  const [sendingPending, setSendingPending] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const all = await base44.entities.MessageThread.list("-updated_date");
      const dmThreads = all.filter(t => t.type === "dm" || t.type === "support");
      setThreads(dmThreads);

      // Build unread map from participants
      const participants = await base44.entities.ThreadParticipant.list();
      const map = {};
      participants.forEach(p => {
        if (p.user_id === user.id && p.is_admin) {
          map[p.thread_id] = p.unread_count || 0;
        }
      });
      setUnreadMap(map);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Subscribe to thread updates for live refresh
  useEffect(() => {
    const unsubscribe = base44.entities.MessageThread.subscribe(() => loadThreads());
    return () => unsubscribe();
  }, [loadThreads]);

  const loadNotes = async (threadId) => {
    try {
      const data = await base44.entities.InternalThreadNote.filter({ thread_id: threadId }, "created_date");
      setNotes(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (selectedThread) loadNotes(selectedThread.id);
  }, [selectedThread]);

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setPendingUserId(null);
    setPendingUserName(null);
    setSearchParams({});
  };

  const handleSendPending = async () => {
    if (!pendingMessage.trim() || !pendingUserId) return;
    setSendingPending(true);
    try {
      const res = await base44.functions.invoke("sendDirectMessage", {
        targetUserId: pendingUserId,
        content: pendingMessage,
        channel: "in_app"
      });
      setPendingMessage("");
      setPendingUserId(null);
      setPendingUserName(null);
      setSearchParams({});
      await loadThreads();
      const all = await base44.entities.MessageThread.list("-updated_date");
      const found = all.find(t => t.id === res.data?.threadId);
      if (found) setSelectedThread(found);
      toast.success("Conversation started");
    } catch (e) {
      toast.error("Failed to start conversation: " + e.message);
    }
    setSendingPending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-1">Direct Messaging</p>
        <h1 className="text-2xl font-bold text-white">Admin Inbox</h1>
        <p className="text-sm text-[#A8A9AD] mt-1">Unified 1-on-1 chat with students and parents across in-app, SMS, and email.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-220px)] border border-[#A8A9AD]/20 bg-black">
        {/* Left: thread list */}
        <div className="lg:col-span-4 xl:col-span-3 border-r border-[#A8A9AD]/20 flex flex-col">
          <ChatThreadList
            threads={threads}
            selectedThreadId={selectedThread?.id}
            onSelect={handleSelectThread}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            unreadMap={unreadMap}
          />
        </div>

        {/* Right: chat window or pending composer */}
        <div className={`${showNotes ? "lg:col-span-5 xl:col-span-5" : "lg:col-span-8 xl:col-span-9"} flex flex-col`}>
          {pendingUserId ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-[#A8A9AD]/20">
                <h3 className="text-white font-medium text-sm">New conversation with {pendingUserName || "user"}</h3>
                <p className="text-[10px] text-[#A8A9AD]">Type your first message below.</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <textarea
                  value={pendingMessage}
                  onChange={(e) => setPendingMessage(e.target.value)}
                  placeholder="Type your first message..."
                  className="w-full max-w-md bg-[#0A0A0A] border border-[#A8A9AD]/20 px-3 py-2 text-sm text-white placeholder:text-[#A8A9AD] focus:border-[#C9A84C] focus:outline-none min-h-[100px]"
                  autoFocus
                />
              </div>
              <div className="p-3 border-t border-[#A8A9AD]/20 flex justify-end gap-2">
                <button onClick={() => { setPendingUserId(null); setPendingUserName(null); setSearchParams({}); }} className="px-4 py-2 text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
                <button
                  onClick={handleSendPending}
                  disabled={!pendingMessage.trim() || sendingPending}
                  className="flex items-center gap-2 bg-[#C9A84C] text-black px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-[#E0C97A] disabled:opacity-50"
                >
                  {sendingPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                </button>
              </div>
            </div>
          ) : selectedThread ? (
            <ChatWindow
              thread={selectedThread}
              currentUser={user}
              onMessageSent={loadThreads}
              showNotes={showNotes}
              onToggleNotes={() => setShowNotes(!showNotes)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#A8A9AD]">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-40" />
                <p>Select a conversation to view messages</p>
                <p className="text-xs mt-2">Or use "Message User" on a profile to start a new chat</p>
              </div>
            </div>
          )}
        </div>

        {/* Internal notes panel */}
        {showNotes && selectedThread && (
          <div className="lg:col-span-3 xl:col-span-3">
            <InternalNotesPanel
              threadId={selectedThread.id}
              currentUser={user}
              notes={notes}
              onRefresh={() => loadNotes(selectedThread.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}