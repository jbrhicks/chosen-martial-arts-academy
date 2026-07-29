import { Award, Calendar } from "lucide-react";

export default function TrophyCase({ badges }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 p-6 text-center">
        <Award size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
        <p className="text-sm text-[#A8A9AD]">No badges earned yet. Complete a challenge to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map((badge) => (
        <div key={badge.id} className="border border-[#C9A84C]/20 bg-gradient-to-b from-[#C9A84C]/5 to-transparent p-4 text-center">
          <div className="w-16 h-16 mx-auto mb-3 relative">
            {badge.badge_graphic_url ? (
              <img src={badge.badge_graphic_url} alt={badge.badge_name} className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C] flex items-center justify-center">
                <Award size={28} className="text-[#C9A84C]" />
              </div>
            )}
          </div>
          <p className="text-xs font-bold mb-1">{badge.badge_name}</p>
          <p className="text-[10px] text-[#A8A9AD] mb-1">{badge.challenge_title}</p>
          <p className="text-[9px] text-[#A8A9AD]/70 flex items-center justify-center gap-1">
            <Calendar size={9} />
            {badge.date_earned ? new Date(badge.date_earned).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
          </p>
        </div>
      ))}
    </div>
  );
}