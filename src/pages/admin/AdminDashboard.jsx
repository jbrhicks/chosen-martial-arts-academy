import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, UserPlus, CreditCard, Flag, Inbox, ChevronRight, Loader2 } from "lucide-react";
import BounceManagementWidget from "@/components/admin/broadcasts/BounceManagementWidget";
import DebriefInboxWidget from "@/components/admin/dashboard/DebriefInboxWidget";

export default function AdminDashboard() {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions
      .invoke("getAdminPulseMetrics", {})
      .then((res) => {
        setPulse(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const actionItems = [
    {
      label: "Stale Leads",
      sublabel: "No contact in 48+ hrs",
      value: pulse?.stale_leads ?? 0,
      icon: UserPlus,
      path: "/admin/leads?filter=stale",
      accent: "amber",
    },
    {
      label: "Overdue Invoices",
      sublabel: "Past-due billing",
      value: pulse?.overdue_invoices ?? 0,
      icon: CreditCard,
      path: "/admin/billing?filter=overdue",
      accent: "red",
    },
    {
      label: "Instructor Flags",
      sublabel: "Pending review",
      value: pulse?.pending_flags ?? 0,
      icon: Flag,
      path: "/admin/evaluation?filter=pending",
      accent: "blue",
    },
    {
      label: "Membership Requests",
      sublabel: "Awaiting action",
      value: pulse?.pending_membership_requests ?? 0,
      icon: Inbox,
      path: "/admin/membership-requests?filter=pending",
      accent: "purple",
    },
  ];

  const accentMap = {
    amber: { ring: "border-[#C9A84C]/40", glow: "bg-[#C9A84C]/10", text: "text-[#C9A84C]", dot: "bg-[#C9A84C]" },
    red: { ring: "border-red-500/40", glow: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
    blue: { ring: "border-blue-500/40", glow: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
    purple: { ring: "border-purple-500/40", glow: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-500" },
  };

  const totalAction = pulse?.total_requires_action ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Command Center</p>
        <h1 className="text-3xl font-bold">Pulse</h1>
      </div>

      {/* Pulse Hero — Requires Action */}
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${totalAction > 0 ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
            <h2 className="text-sm tracking-widest uppercase text-[#A8A9AD]">Requires Action</h2>
          </div>
          {!loading && (
            <span className="text-2xl font-bold">
              {totalAction} <span className="text-xs text-[#A8A9AD] font-normal tracking-widest uppercase">items</span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actionItems.map((item) => {
              const Icon = item.icon;
              const a = accentMap[item.accent];
              const isUrgent = item.value > 0;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`group border p-5 transition-all ${isUrgent ? `${a.ring} ${a.glow}` : "border-[#A8A9AD]/20 hover:border-[#C9A84C]/30"}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 border flex items-center justify-center ${isUrgent ? a.ring : "border-[#C9A84C]/30"}`}>
                      <Icon size={18} className={isUrgent ? a.text : "text-[#C9A84C]"} />
                    </div>
                    {isUrgent && <span className={`w-2 h-2 rounded-full ${a.dot} animate-pulse`} />}
                  </div>
                  <div className="text-3xl font-bold mb-1">{item.value}</div>
                  <div className="text-[10px] tracking-widest uppercase text-white">{item.label}</div>
                  <div className="text-[9px] text-[#A8A9AD] mt-0.5">{item.sublabel}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Debrief Inbox */}
      <DebriefInboxWidget />

      {/* Bounce Management Widget */}
      <BounceManagementWidget />
    </div>
  );
}