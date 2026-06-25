import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Flag, Check, Trash2, Loader2 } from "lucide-react";

export default function ModerationDashboard({ currentUser }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    try {
      const data = await base44.entities.ModerationFlag.list("-created_date");
      setFlags(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (flag, status) => {
    try {
      await base44.entities.ModerationFlag.update(flag.id, {
        status,
        reviewed_by_id: currentUser.id,
        reviewed_by_name: currentUser.full_name,
        reviewed_date: new Date().toISOString(),
      });
      if (status === "removed" && flag.target_type === "post") {
        await base44.entities.Post.update(flag.target_id, { is_deleted: true });
      }
      if (status === "removed" && flag.target_type === "comment") {
        await base44.entities.Comment.update(flag.target_id, { is_deleted: true });
      }
      load();
    } catch (e) { console.error(e); }
  };

  const filtered = flags.filter(f => filter === "all" || f.status === filter);
  const pendingCount = flags.filter(f => f.status === "pending").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Flag size={20} className="text-red-400" />
        <h2 className="text-lg font-bold text-white">Moderation Flags</h2>
        {pendingCount > 0 && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold">{pendingCount} pending</span>}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["pending", "removed", "dismissed", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs capitalize transition-colors ${filter === s ? "bg-[#C9A84C] text-black font-bold" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center"><p className="text-[#A8A9AD] text-sm">No moderation flags in this category.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(flag => (
            <div key={flag.id} className={`border p-4 ${flag.status === "pending" ? "border-red-500/30 bg-red-500/5" : "border-[#A8A9AD]/20"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[#A8A9AD] uppercase tracking-widest">{flag.target_type}</span>
                    <span className="text-xs text-[#A8A9AD]">by {flag.target_author_name || "Unknown"}</span>
                    {flag.status !== "pending" && <span className="text-xs text-[#A8A9AD]">· {flag.status}</span>}
                  </div>
                  {flag.target_content && <p className="text-sm text-white mb-2 line-clamp-3">{flag.target_content}</p>}
                  <p className="text-xs text-red-400 mb-1">Reason: {flag.reason}</p>
                  <p className="text-xs text-[#A8A9AD]">Reported by {flag.reported_by_name}</p>
                </div>
                {flag.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleReview(flag, "removed")} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold" title="Remove content">
                      <Trash2 size={14} /> Remove
                    </button>
                    <button onClick={() => handleReview(flag, "dismissed")} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold" title="Dismiss flag">
                      <Check size={14} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}