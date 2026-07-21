import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Inbox, Check, X, Award, HelpCircle, AlertTriangle, HeartPulse, Loader2, ExternalLink } from "lucide-react";

const flagConfig = {
  ready_to_test: { icon: Award, color: "text-[#C9A84C]", border: "border-[#C9A84C]/30", bg: "bg-[#C9A84C]/10", label: "Ready to Test" },
  needs_help: { icon: HelpCircle, color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-400/10", label: "Needs Help" },
  behavior: { icon: AlertTriangle, color: "text-orange-400", border: "border-orange-400/30", bg: "bg-orange-400/10", label: "Behavior" },
  injury: { icon: HeartPulse, color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/10", label: "Injury" },
};

export default function DebriefInboxWidget() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => { loadFlags(); }, []);

  const loadFlags = async () => {
    try {
      const pending = await base44.entities.InstructorStudentFlag.filter({ status: "pending" });
      setFlags(pending.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (flag, action) => {
    setActioning(flag.id);
    try {
      const { user } = await base44.auth.me();
      await base44.entities.InstructorStudentFlag.update(flag.id, {
        status: action,
        actioned_by_id: user.id,
        actioned_by_name: user.full_name,
        actioned_date: new Date().toISOString(),
      });
      loadFlags();
    } catch (e) { alert("Failed: " + e.message); }
    setActioning(null);
  };

  if (loading) return (
    <div className="border border-[#A8A9AD]/20 p-6">
      <div className="flex items-center gap-2 mb-3"><Inbox size={18} className="text-[#C9A84C]" /><h2 className="text-lg font-bold">Debrief Inbox</h2></div>
      <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>
    </div>
  );

  return (
    <div className="border border-[#A8A9AD]/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox size={18} className="text-[#C9A84C]" />
          <h2 className="text-lg font-bold">Debrief Inbox</h2>
        </div>
        {flags.length > 0 && <span className="text-xs bg-[#C9A84C] text-black px-2 py-0.5 font-bold">{flags.length} pending</span>}
      </div>
      {flags.length === 0 ? (
        <p className="text-sm text-[#A8A9AD] text-center py-4">No pending flags from instructors.</p>
      ) : (
        <div className="space-y-3">
          {flags.slice(0, 5).map((flag) => {
            const cfg = flagConfig[flag.flag_type] || flagConfig.needs_help;
            const Icon = cfg.icon;
            return (
              <div key={flag.id} className={`border ${cfg.border} ${cfg.bg} p-4 flex items-start gap-3 flex-wrap`}>
                <Icon size={18} className={`${cfg.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-[150px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{flag.student_name}</p>
                    <span className={`text-[10px] tracking-widest uppercase ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  {flag.notes && <p className="text-xs text-[#A8A9AD] mt-1">{flag.notes}</p>}
                  <p className="text-xs text-[#A8A9AD] mt-1">by {flag.instructor_name || "Instructor"}{flag.class_name ? ` · ${flag.class_name}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/admin/profile-manager`} className="text-[#A8A9AD] hover:text-[#C9A84C] transition-colors" title="View Profile"><ExternalLink size={14} /></a>
                  <button onClick={() => handleAction(flag, "actioned")} disabled={actioning === flag.id} className="flex items-center gap-1 px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold uppercase hover:bg-[#C9A84C]/10 disabled:opacity-50">
                    <Check size={12} /> Action
                  </button>
                  <button onClick={() => handleAction(flag, "dismissed")} disabled={actioning === flag.id} className="text-[#A8A9AD] hover:text-red-400 transition-colors disabled:opacity-50">
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}