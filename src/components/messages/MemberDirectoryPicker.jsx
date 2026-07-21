import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Send, Loader2, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

export default function MemberDirectoryPicker({ open, onClose, currentUser, onStartDM }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) loadMembers();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(null);
      setMessage("");
    }
  }, [open]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke("listMemberDirectory", {});
      const users = result?.data?.users || result?.users || [];
      setMembers(users.filter(u => u.id !== currentUser?.id));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load members");
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!selected || !message.trim()) return;
    setSending(true);
    await onStartDM(selected.id, selected.full_name, message.trim());
    setSending(false);
  };

  const filtered = search
    ? members.filter(m => (m.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : members;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-black border-[#A8A9AD]/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-[#C9A84C]" />
            New Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members by name..."
              className="bg-[#0A0A0A] border-[#A8A9AD]/20 pl-9"
            />
          </div>

          <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-[#A8A9AD] text-center py-8">No members found.</p>
            ) : (
              filtered.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-[#A8A9AD]/10 ${
                    selected?.id === m.id ? "bg-[#C9A84C]/20" : "hover:bg-[#C9A84C]/5"
                  }`}
                >
                  <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                    <span className="text-[#C9A84C] font-bold">{m.full_name?.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.full_name || "Unnamed"}</p>
                    {m.belt_rank && <p className="text-xs text-[#C9A84C]">{m.belt_rank}</p>}
                  </div>
                  {selected?.id === m.id && <div className="w-2 h-2 bg-[#C9A84C] rounded-full shrink-0" />}
                </button>
              ))
            )}
          </div>

          {selected && (
            <div>
              <p className="text-xs text-[#A8A9AD] mb-2">Message to <span className="text-[#C9A84C] font-medium">{selected.full_name}</span></p>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="bg-[#0A0A0A] border-[#A8A9AD]/20 min-h-[100px]"
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-[#A8A9AD]/20">Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={!selected || !message.trim() || sending}
              className="bg-[#C9A84C] hover:bg-[#C9A84C]/90"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}