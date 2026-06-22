import { BELT_STYLES } from "@/lib/constants";

export default function BeltBadge({ rank, size = "md" }) {
  const style = BELT_STYLES[rank] || BELT_STYLES["White"];
  const sizes = {
    sm: { badge: "h-4 px-2 text-[9px]", icon: "w-3 h-3" },
    md: { badge: "h-6 px-3 text-[10px]", icon: "w-4 h-4" },
    lg: { badge: "h-8 px-4 text-xs", icon: "w-5 h-5" },
  };
  const s = sizes[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`${s.icon} relative shrink-0 border border-white/20`}
        style={{ backgroundColor: style.bg }}
      >
        {style.stripe && (
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1/3"
            style={{ backgroundColor: style.stripe }}
          />
        )}
      </div>
      <span className={`${s.badge} tracking-wider uppercase font-medium text-[#A8A9AD] leading-none flex items-center`}>
        {rank}
      </span>
    </div>
  );
}