import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Award, Star, Heart, Shield, Trophy, Check, Loader2 } from "lucide-react";

const BADGE_ICONS = {
  star: Star,
  heart: Heart,
  shield: Shield,
  trophy: Trophy,
  check: Check,
};

export default function BadgeDisplay({ studentId }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const allBadges = await base44.entities.StudentBadge.filter({ student_id: studentId }).catch(() => []);
        allBadges.sort((a, b) => new Date(b.awarded_date) - new Date(a.awarded_date));
        setBadges(allBadges);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    if (studentId) load();
  }, [studentId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  if (badges.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
        <Award size={40} className="mx-auto text-[#A8A9AD]/40 mb-4" />
        <p className="text-sm text-[#A8A9AD]">No badges earned yet.</p>
        <p className="text-xs text-[#A8A9AD]/60 mt-2">Keep training hard and badges will appear here!</p>
      </div>
    );
  }

  const totalPoints = badges.reduce((sum, b) => sum + (b.points_value || 0), 0);

  const getCategoryColor = (category) => {
    const colors = {
      character: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      performance: "text-green-400 bg-green-400/10 border-green-400/20",
      attendance: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      leadership: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      improvement: "text-pink-400 bg-pink-400/10 border-pink-400/20",
      special: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/20",
    };
    return colors[category] || colors.character;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] flex items-center gap-2">
          <Award size={18} />
          Earned Badges
        </h2>
        <div className="text-right">
          <p className="text-xs text-[#A8A9AD]">Total Points</p>
          <p className="text-lg font-bold text-[#C9A84C]">{totalPoints}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((badge, idx) => {
          const Icon = BADGE_ICONS[badge.badge_icon_symbol] || Star;
          const categoryColor = getCategoryColor(badge.badge_category);
          return (
            <div
              key={badge.id}
              className={`border ${categoryColor.split(" ")[2]} bg-black p-4 transition-all hover:shadow-lg ${
                idx === 0 ? "ring-2 ring-[#C9A84C]/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: badge.badge_icon_color + "20" }}
                >
                  <Icon size={24} style={{ color: badge.badge_icon_color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-white">{badge.badge_name}</h3>
                    <span className={`text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${categoryColor}`}>
                      {badge.badge_category}
                    </span>
                    {idx === 0 && (
                      <span className="text-[8px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A8A9AD] line-clamp-2 mb-2">{badge.reason}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A8A9AD]">
                      {new Date(badge.awarded_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-[#C9A84C] font-medium">+{badge.points_value} pts</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}