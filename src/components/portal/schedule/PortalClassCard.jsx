import { Clock, User, MapPin, CheckCircle2, Lock } from "lucide-react";
import { formatTime } from "@/lib/constants";
import { getScheduleBadge, getSeriesCountdown } from "@/lib/scheduleUtils";

const PROGRAM_COLORS = [
  { accent: "#C9A84C", bg: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.40)" },
  { accent: "#2B5CA0", bg: "rgba(43,92,160,0.10)", border: "rgba(43,92,160,0.40)" },
  { accent: "#3B7A3B", bg: "rgba(59,122,59,0.10)", border: "rgba(59,122,59,0.40)" },
  { accent: "#C53030", bg: "rgba(197,48,48,0.10)", border: "rgba(197,48,48,0.40)" },
  { accent: "#E8843A", bg: "rgba(232,132,58,0.10)", border: "rgba(232,132,58,0.40)" },
  { accent: "#7A4A2B", bg: "rgba(122,74,43,0.10)", border: "rgba(122,74,43,0.40)" },
];

export function getProgramColor(programId, programs) {
  const idx = programs.findIndex(p => p.id === programId);
  if (idx === -1) return PROGRAM_COLORS[0];
  return PROGRAM_COLORS[idx % PROGRAM_COLORS.length];
}

export default function PortalClassCard({ cls, program, programs, eligible, isToday, date, customDates }) {
  const color = getProgramColor(program?.id || cls.linked_program_id, programs);
  const badge = getScheduleBadge(cls);
  const countdown = date ? getSeriesCountdown(cls, date, customDates || []) : null;

  return (
    <div
      className="border p-4 transition-colors group"
      style={{
        borderColor: isToday ? color.border : "rgba(168,169,173,0.20)",
        background: isToday ? color.bg : "transparent",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold group-hover:text-[#C9A84C] transition-colors truncate">{cls.class_name}</h3>
          {badge && (
            <span className="text-[10px] tracking-widest uppercase font-bold block mt-0.5" style={{ color: badge.color }}>
              {badge.label}
            </span>
          )}
          {program && (
            <span className="text-[10px] tracking-widest uppercase font-medium" style={{ color: color.accent }}>
              {program.program_name}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {eligible ? (
            <span className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-green-400">
              <CheckCircle2 size={11} /> Eligible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-[#A8A9AD]">
              <Lock size={11} /> {cls.belt_level}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-[#A8A9AD]">
        <div className="flex items-center gap-2">
          <Clock size={12} style={{ color: color.accent }} />
          {formatTime(cls.start_time)}{cls.end_time ? ` – ${formatTime(cls.end_time)}` : ""}
        </div>
        {cls.instructor && (
          <div className="flex items-center gap-2">
            <User size={12} style={{ color: color.accent }} />
            {cls.instructor}
          </div>
        )}
        {cls.location && (
          <div className="flex items-center gap-2">
            <MapPin size={12} style={{ color: color.accent }} />
            {cls.location}
          </div>
        )}
      </div>
      {countdown && (
        <div className="mt-2 text-xs font-bold" style={{ color: "#C53030" }}>
          {countdown.label}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#A8A9AD]/10">
        {cls.age_group && <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{cls.age_group}</span>}
        <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">•</span>
        <span className="text-[10px] tracking-widest uppercase" style={{ color: color.accent }}>{cls.belt_level}</span>
      </div>
    </div>
  );
}