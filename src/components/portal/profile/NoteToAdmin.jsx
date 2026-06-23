import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, Loader2, CheckCircle } from "lucide-react";

export default function NoteToAdmin() {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!note.trim()) return;
    setSending(true);
    try {
      await base44.entities.AdminActivityLog.create({
        user_id: user.id,
        admin_id: user.id,
        admin_name: user.full_name,
        action_type: "communication",
        description: `[STUDENT NOTE] ${note.trim()}`,
        timestamp: new Date().toISOString(),
      });
      setNote("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (e) { alert("Failed to send: " + e.message); }
    setSending(false);
  };

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6">
      <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-2">Send a Note to the Academy</h2>
      <p className="text-xs text-[#A8A9AD] mb-4">Have a question, concern, or message for the academy staff? Send it here and our team will get back to you.</p>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Type your message to the academy administrators..." className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors resize-none" />
      <div className="flex items-center gap-3 mt-3">
        <button onClick={handleSend} disabled={sending || !note.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Note
        </button>
        {sent && <span className="text-sm text-green-400 flex items-center gap-1"><CheckCircle size={16} /> Your note has been sent to the academy.</span>}
      </div>
    </div>
  );
}