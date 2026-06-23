import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Send, Loader2, Phone, Mail, MessageSquare, Edit } from "lucide-react";

export default function ActivityLog({ user, activityLogs, onRefresh, logActivity }) {
  const [note, setNote] = useState("");
  const [commType, setCommType] = useState("phone");
  const [saving, setSaving] = useState(false);

  const sortedLogs = [...activityLogs].sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date));

  const handleLog = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await logActivity("communication", `[${commType.toUpperCase()}] ${note}`);
      setNote("");
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  const iconFor = (type) => {
    if (type === "communication") return MessageSquare;
    if (type === "edit") return Edit;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Log Communication</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={commType} onChange={e => setCommType(e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="phone">Phone Call</option>
            <option value="email">Email</option>
            <option value="in_person">In-Person</option>
          </select>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the conversation or note..." className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" onKeyDown={e => { if (e.key === "Enter") handleLog(); }} />
          <button onClick={handleLog} disabled={saving || !note.trim()} className="flex items-center gap-2 px-5 py-2 bg-[#C9A84C] text-black font-bold text-sm uppercase tracking-wide hover:bg-[#E0C97A] disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Log
          </button>
        </div>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Activity Timeline</h3>
        {sortedLogs.length === 0 ? (
          <p className="text-sm text-[#A8A9AD]">No activity logged yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map(log => {
              const Icon = iconFor(log.action_type);
              return (
                <div key={log.id} className="flex gap-3 border-l-2 border-[#C9A84C]/30 pl-4 py-1">
                  <Icon size={16} className="text-[#C9A84C] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{log.description}</p>
                    <p className="text-xs text-[#A8A9AD] mt-0.5">
                      {log.admin_name || "Admin"} · {new Date(log.timestamp || log.created_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}