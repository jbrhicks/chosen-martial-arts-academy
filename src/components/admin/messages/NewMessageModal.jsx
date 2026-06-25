import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, Loader2, User } from "lucide-react";

export default function NewMessageModal({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.User.list("full_name");
      setUsers(all);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter(u => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[#111] border border-[#A8A9AD]/20 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#A8A9AD]/20">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">New Message</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-3 border-b border-[#A8A9AD]/20">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              autoFocus
              className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/20 pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#A8A9AD] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[#A8A9AD] text-sm py-8">No users found</p>
          ) : (
            filtered.map(u => (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 border-b border-[#A8A9AD]/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-sm shrink-0">
                  {(u.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.full_name || "Unnamed"}</p>
                  <p className="text-[#A8A9AD] text-xs truncate">{u.email}</p>
                </div>
                <span className="ml-auto text-[9px] uppercase tracking-wider text-[#A8A9AD] border border-[#A8A9AD]/20 px-1.5 py-0.5">
                  {u.role || "user"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}