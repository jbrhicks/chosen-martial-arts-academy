import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Video, Users, Calendar, CreditCard, ChevronRight, TrendingUp } from "lucide-react";
import BeltBadge from "@/components/BeltBadge";
import { BELT_RANKS, getRankIndex } from "@/lib/constants";

export default function PortalHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ videos: 0, posts: 0, events: 0, payments: 0 });
  const [nextRank, setNextRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Video.filter({ is_published: true }).catch(() => []),
      base44.entities.Post.filter({ is_deleted: false }).catch(() => []),
      base44.entities.Event.list().catch(() => []),
      base44.entities.Payment.filter({ user_id: user?.id, status: "succeeded" }).catch(() => []),
    ]).then(([videos, posts, events, payments]) => {
      setStats({
        videos: videos.length,
        posts: posts.length,
        events: events.length,
        payments: payments.length,
      });
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (user?.belt_rank) {
      const idx = getRankIndex(user.belt_rank);
      if (idx < BELT_RANKS.length - 1) setNextRank(BELT_RANKS[idx + 1]);
    }
  }, [user]);

  const quickLinks = [
    { label: "Curriculum", path: "/portal/curriculum", icon: Video, desc: "Watch training videos" },
    { label: "Community", path: "/portal/community", icon: Users, desc: "Share and connect" },
    { label: "Events", path: "/portal/events", icon: Calendar, desc: "Upcoming events" },
    { label: "Billing", path: "/portal/billing", icon: CreditCard, desc: "Payment history" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Welcome Back</p>
        <h1 className="text-3xl font-bold mb-2">{user?.full_name || "Student"}</h1>
        {user?.belt_rank && <BeltBadge rank={user.belt_rank} size="lg" />}
      </div>

      {/* Belt progress */}
      {user?.belt_rank && nextRank && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-[#C9A84C]" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Next Belt</h2>
          </div>
          <p className="text-lg">
            You're currently at <span className="font-bold text-white">{user.belt_rank}</span>. Your next rank is <span className="text-[#C9A84C] font-bold">{nextRank}</span>.
          </p>
          <div className="mt-4 h-2 bg-white/10">
            <div
              className="h-full bg-[#C9A84C] transition-all duration-500"
              style={{ width: `${((getRankIndex(user.belt_rank) + 1) / BELT_RANKS.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-[#A8A9AD] mt-2">Rank {getRankIndex(user.belt_rank) + 1} of {BELT_RANKS.length}</p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className="group border border-[#A8A9AD]/20 p-6 hover:border-[#C9A84C]/40 transition-colors"
            >
              <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center mb-4 group-hover:bg-[#C9A84C] transition-colors">
                <Icon size={18} className="text-[#C9A84C] group-hover:text-black transition-colors" />
              </div>
              <h3 className="font-bold text-sm mb-1">{link.label}</h3>
              <p className="text-xs text-[#A8A9AD]">{link.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#A8A9AD]/20 border border-[#A8A9AD]/20">
        {[
          { label: "Available Videos", value: stats.videos },
          { label: "Community Posts", value: stats.posts },
          { label: "Upcoming Events", value: stats.events },
          { label: "Payments Made", value: stats.payments },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0A0A0A] p-6 text-center">
            <div className="text-3xl font-bold text-[#C9A84C] mb-1">{loading ? "—" : stat.value}</div>
            <div className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}