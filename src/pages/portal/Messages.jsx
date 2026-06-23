import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Send, MessageCircle, Plus, X, Search, ChevronLeft, Eye, Users } from "lucide-react";

const isMinor = (dob) => {
  if (!dob) return false;
  const age = (new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000);
  return age < 18;
};

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [threadName, setThreadName] = useState("");
  const [participants, setParticipants] = useState({});
  const [oversightMode, setOversightMode] = useState(false);
  const messagesEndRef = useRef(null);

  const loadThreads = async () => {
    if (!user) return;
    try {
      const myParticipations = await base44.entities.ThreadParticipant.filter({ user_id: user.id });
      let allThreads = [];
      for (const p of myParticipations) {
        const t = await base44.entities.MessageThread.get(p.thread_id);
        const threadParticipants = await base44.entities.ThreadParticipant.filter({ thread_id: p.thread_id });
        allThreads.push({ ...t, participants: threadParticipants });
      }

      // Parental oversight: load threads for minors in family
      if (user.family_role === "primary_guardian" && user.family_id) {
        const allUsers = await base44.entities.User.list();
        const familyMinors = allUsers.filter(u => u.family_id === user.family_id && isMinor(u.dob));
        for (const minor of familyMinors) {
          const minorParticipations = await base44.entities.ThreadParticipant.filter({ user_id: minor.id });
          for (const p of minorParticipations) {
            if (!allThreads.find(t => t.id === p.thread_id)) {
              const t = await base44.entities.MessageThread.get(p.thread_id);
              const threadParticipants = await base44.entities.ThreadParticipant.filter({ thread_id: p.thread_id });
              allThreads.push({ ...t, participants: threadParticipants, oversight: true, oversightUser: minor.full_name });
            }
          }
        }
      }

      // Admin oversight: load all threads
      if (user.role === "admin") {
        const allThreadRecords = await base44.entities.MessageThread.list();
        for (const t of allThreadRecords) {
          if (!allThreads.find(existing => existing.id === t.id)) {
            const threadParticipants = await base44.entities.ThreadParticipant.filter({ thread_id: t.id });
            allThreads.push({ ...t, participants: threadParticipants, oversight: true });
          }
        }
      }

      allThreads.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      setThreads(allThreads);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMessages = async (thread) => {
    if (!thread) return;
    setMsgLoading(true);
    setSelectedThread(thread);
    setOversightMode(thread.oversight || false);
    try {
      const msgs = await base44.entities.Message.filter({ thread_id: thread.id });
      msgs.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
      setMessages(msgs);
    } catch (e) { console.error(e); }
    setMsgLoading(false);
  };

  useEffect(() => { loadThreads(); }, [user]);
  useEffect(() => { if (selectedThread) loadMessages(selectedThread); }, [selectedThread?.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || oversightMode) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        thread_id: selectedThread.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: newMessage.trim(),
      });
      setNewMessage("");
      loadMessages(selectedThread);
    } catch (e) { alert("Failed to send."); }
    setSending(false);
  };

  const loadAllUsers = async () => {
    try {
      const users = await base44.entities.User.list();
      setAllUsers(users.filter(u => u.id !== user.id && u.role !== "admin"));
    } catch (e) { console.error(e); }
  };

  const handleCreateThread = async () => {
    if (selectedUsers.length === 0) return;
    setSending(true);
    try {
      const isGroup = selectedUsers.length > 1;
      const name = isGroup ? threadName || `Group (${selectedUsers.length + 1})` : "";
      const thread = await base44.entities.MessageThread.create({
        thread_name: name,
        type: isGroup ? "group" : "dm",
        created_by_id: user.id,
      });
      const allParticipants = [user, ...allUsers.filter(u => selectedUsers.includes(u.id))];
      for (const p of allParticipants) {
        await base44.entities.ThreadParticipant.create({ thread_id: thread.id, user_id: p.id, user_name: p.full_name });
      }
      setShowNewThread(false);
      setSelectedUsers([]);
      setThreadName("");
      setSearch("");
      loadThreads();
    } catch (e) { alert("Failed to create thread."); }
    setSending(false);
  };

  const getThreadDisplayName = (t) => {
    if (t.thread_name) return t.thread_name;
    if (t.oversight && t.oversightUser) return `${t.oversightUser}'s DMs (Oversight)`;
    if (t.oversight) return "Admin Oversight";
    const others = (t.participants || []).filter(p => p.user_id !== user.id);
    return others.map(p => p.user_name).join(", ") || "Direct Message";
  };

  const filteredUsers = allUsers.filter(u => (u.full_name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Direct Messaging</p>
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black grid grid-cols-1 lg:grid-cols-3 h-[70vh]">
        {/* Thread list */}
        <div className={`border-r border-[#A8A9AD]/10 flex flex-col ${selectedThread ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-[#A8A9AD]/10 flex items-center justify-between">
            <span className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD]">Threads</span>
            <button onClick={() => { loadAllUsers(); setShowNewThread(true); }} className="p-1.5 bg-[#C9A84C] text-black hover:bg-[#E0C97A] transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div> : (
              threads.length === 0 ? <p className="text-center py-8 text-[#A8A9AD] text-sm">No conversations yet.</p> : (
                threads.map(t => (
                  <button key={t.id} onClick={() => loadMessages(t)} className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-[#A8A9AD]/5 transition-colors ${selectedThread?.id === t.id ? "bg-[#C9A84C]/10" : "hover:bg-white/5"}`}>
                    <div className="w-9 h-9 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                      {t.type === "group" ? <Users size={16} className="text-[#C9A84C]" /> : <span className="text-[#C9A84C] font-bold text-xs">{getThreadDisplayName(t).charAt(0)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{getThreadDisplayName(t)}</p>
                      {t.oversight && <p className="text-[10px] text-[#A8A9AD] tracking-widest uppercase flex items-center gap-1"><Eye size={10} /> Oversight</p>}
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* Chat view */}
        <div className={`lg:col-span-2 flex flex-col ${selectedThread ? "flex" : "hidden lg:flex"}`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={32} className="text-[#A8A9AD] mx-auto mb-3" />
                <p className="text-[#A8A9AD]">Select a conversation to start messaging.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[#A8A9AD]/10 flex items-center gap-3">
                <button onClick={() => setSelectedThread(null)} className="lg:hidden text-[#A8A9AD] hover:text-white"><ChevronLeft size={20} /></button>
                <div className="flex-1">
                  <p className="text-sm font-bold">{getThreadDisplayName(selectedThread)}</p>
                  {oversightMode && <p className="text-[10px] text-[#A8A9AD] tracking-widest uppercase flex items-center gap-1"><Eye size={10} /> Read-only oversight mode</p>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div> : (
                  messages.length === 0 ? <p className="text-center text-[#A8A9AD] text-sm py-8">No messages yet.</p> : (
                    messages.map(m => {
                      const isMine = m.sender_id === user.id;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 ${isMine ? "bg-[#C9A84C] text-black" : "bg-white/5 text-white"}`}>
                            {!isMine && <p className="text-[10px] font-bold mb-0.5 opacity-70">{m.sender_name}</p>}
                            <p className="text-sm">{m.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
              {!oversightMode && (
                <form onSubmit={handleSend} className="p-4 border-t border-[#A8A9AD]/10 flex gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/5 border border-[#A8A9AD]/20 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="px-4 bg-[#C9A84C] text-black hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* New thread modal */}
      {showNewThread && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowNewThread(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">New Conversation</h3>
              <button onClick={() => setShowNewThread(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-2 border border-[#A8A9AD]/20 px-3 py-2 mb-4">
              <Search size={14} className="text-[#A8A9AD]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teammates..." className="bg-transparent text-sm text-white focus:outline-none flex-1" />
            </div>
            {selectedUsers.length > 1 && (
              <input value={threadName} onChange={e => setThreadName(e.target.value)} placeholder="Group name (optional)" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none mb-4" />
            )}
            <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
              {filteredUsers.map(u => (
                <button key={u.id} onClick={() => setSelectedUsers(selectedUsers.includes(u.id) ? selectedUsers.filter(id => id !== u.id) : [...selectedUsers, u.id])} className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors text-left ${selectedUsers.includes(u.id) ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/10 hover:border-[#A8A9AD]/30"}`}>
                  <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C]">{u.full_name?.charAt(0)}</div>
                  <span className="text-sm flex-1">{u.full_name}</span>
                  {selectedUsers.includes(u.id) && <span className="text-[#C9A84C] text-xs">✓</span>}
                </button>
              ))}
            </div>
            <button onClick={handleCreateThread} disabled={selectedUsers.length === 0 || sending} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin mx-auto" /> : `Start ${selectedUsers.length > 1 ? "Group" : "Conversation"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}