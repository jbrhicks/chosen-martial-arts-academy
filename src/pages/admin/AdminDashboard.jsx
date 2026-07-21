import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, CreditCard, Video, CalendarDays, UserPlus, TrendingUp, DollarSign, ChevronRight } from "lucide-react";
import BounceManagementWidget from "@/components/admin/broadcasts/BounceManagementWidget";
import DebriefInboxWidget from "@/components/admin/dashboard/DebriefInboxWidget";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, leads: 0, payments: 0, revenue: 0, videos: 0, events: 0, classes: 0, posts: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list().catch(() => []),
      base44.entities.Lead.filter({ status: "new" }).catch(() => []),
      base44.entities.Payment.filter({ status: "succeeded" }).catch(() => []),
      base44.entities.Video.list().catch(() => []),
      base44.entities.Event.list().catch(() => []),
      base44.entities.ClassSchedule.list().catch(() => []),
      base44.entities.Post.filter({ is_deleted: false }).catch(() => []),
      base44.entities.Lead.list().catch(() => []),
    ]).then(([users, newLeads, payments, videos, events, classes, posts, allLeads]) => {
      setStats({
        users: users.length,
        leads: newLeads.length,
        payments: payments.length,
        revenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        videos: videos.length,
        events: events.length,
        classes: classes.length,
        posts: posts.length,
      });
      setRecentLeads(allLeads.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5));
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: "Total Members", value: stats.users, icon: Users, path: "/admin/users" },
    { label: "New Leads", value: stats.leads, icon: UserPlus, path: "/admin/leads" },
    { label: "Revenue", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, path: "/admin/billing" },
    { label: "Videos", value: stats.videos, icon: Video, path: "/admin/curriculum" },
    { label: "Events", value: stats.events, icon: CalendarDays, path: "/admin/events" },
    { label: "Classes", value: stats.classes, icon: TrendingUp, path: "/admin/schedule" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Overview</p>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.path} className="group border border-[#A8A9AD]/20 p-6 hover:border-[#C9A84C]/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors">
                  <Icon size={18} className="text-[#C9A84C] group-hover:text-black transition-colors" />
                </div>
                <ChevronRight size={16} className="text-[#A8A9AD] group-hover:text-[#C9A84C] transition-colors" />
              </div>
              <div className="text-3xl font-bold mb-1">{loading ? "—" : stat.value}</div>
              <div className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Debrief Inbox */}
      <DebriefInboxWidget />

      {/* Bounce Management Widget */}
      <BounceManagementWidget />

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Leads</h2>
          <Link to="/admin/leads" className="text-xs tracking-widest uppercase text-[#C9A84C] hover:text-[#E0C97A]">View All</Link>
        </div>
        <div className="border border-[#A8A9AD]/20 divide-y divide-[#A8A9AD]/20">
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-[#A8A9AD] text-sm">No leads yet.</div>
          ) : (
            recentLeads.map((lead) => (
              <div key={lead.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{lead.full_name}</p>
                  <p className="text-xs text-[#A8A9AD]">{lead.email} · {lead.interest}</p>
                </div>
                <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${
                  lead.status === "new" ? "text-[#C9A84C] border border-[#C9A84C]/30" :
                  lead.status === "contacted" ? "text-blue-400 border border-blue-400/30" :
                  lead.status === "enrolled" ? "text-green-400 border border-green-400/30" :
                  "text-[#A8A9AD] border border-[#A8A9AD]/30"
                }`}>
                  {lead.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}