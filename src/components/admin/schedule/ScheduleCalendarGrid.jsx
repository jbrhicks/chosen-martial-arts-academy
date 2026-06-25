import { DAYS_OF_WEEK, formatTime } from "@/lib/constants";
import { classOccursOnDate, isClassCancelledOnDate, getScheduleException, getClassColor, getActiveBlackout } from "@/lib/scheduleUtils";

const HOUR_START = 6;
const HOUR_END = 22;
const PX_PER_MIN = 1.4;

function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function ScheduleCalendarGrid({ classes, customDates, cancellations, exceptions, blackouts, weekStart, onClassClick }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const totalHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] overflow-x-auto">
      <div className="flex min-w-[800px] border-b border-[#A8A9AD]/20">
        <div className="w-14 shrink-0" />
        {days.map((date, i) => {
          const blackout = getActiveBlackout(date, blackouts);
          const isToday = today.getTime() === date.getTime();
          return (
            <div key={i} className="flex-1 min-w-[140px] text-center py-2 border-l border-[#A8A9AD]/10">
              <div className={`text-xs font-bold ${isToday ? "text-[#C9A84C]" : "text-white"}`}>{DAYS_OF_WEEK[i].slice(0, 3)}</div>
              <div className={`text-xs ${isToday ? "text-[#C9A84C]" : "text-[#A8A9AD]"}`}>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              {blackout && <div className="text-[10px] text-red-400 mt-0.5 font-bold">⚠ {blackout.public_message}</div>}
            </div>
          );
        })}
      </div>

      <div className="flex min-w-[800px]">
        <div className="w-14 shrink-0 relative" style={{ height: totalHeight }}>
          {hours.map(h => (
            <div key={h} className="absolute left-0 right-0 text-[10px] text-[#A8A9AD] pl-2 -translate-y-1.5" style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }}>
              {formatTime(`${h}:00`)}
            </div>
          ))}
        </div>

        {days.map((date, dayIdx) => {
          const blackout = getActiveBlackout(date, blackouts);
          const dayClasses = classes.filter(cls => classOccursOnDate(cls, date, customDates));
          return (
            <div key={dayIdx} className="flex-1 min-w-[140px] border-l border-[#A8A9AD]/10 relative" style={{ height: totalHeight }}>
              {hours.map(h => (
                <div key={h} className="absolute left-0 right-0 border-t border-[#A8A9AD]/5" style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }} />
              ))}

              {blackout && (
                <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none">
                  <div className="text-xs text-red-400/50 font-bold tracking-widest uppercase" style={{ writingMode: "vertical-rl" }}>{blackout.public_message}</div>
                </div>
              )}

              {!blackout && dayClasses.map(cls => {
                const exception = getScheduleException(cls, date, exceptions);
                const cancelled = isClassCancelledOnDate(cls, date, cancellations) || exception?.is_cancelled;
                const startTime = exception?.override_start_time || cls.start_time;
                const instructor = exception?.override_instructor || cls.instructor;
                const startMin = timeToMinutes(startTime);
                const endMin = cls.end_time ? timeToMinutes(cls.end_time) : startMin + 60;
                const top = (startMin - HOUR_START * 60) * PX_PER_MIN;
                const height = Math.max((endMin - startMin) * PX_PER_MIN, 28);
                const color = getClassColor(cls);

                if (top < 0 || top > totalHeight) return null;

                return (
                  <button
                    key={cls.id}
                    onClick={() => onClassClick(cls, date)}
                    className="absolute left-1 right-1 rounded p-1 text-left overflow-hidden hover:z-20 transition-transform hover:scale-[1.02]"
                    style={{
                      top,
                      height,
                      backgroundColor: color + "25",
                      borderLeft: `3px solid ${color}`,
                      opacity: cancelled ? 0.35 : 1,
                    }}
                  >
                    <div className="text-[11px] font-bold text-white truncate leading-tight">{cls.class_name}</div>
                    <div className="text-[9px] text-[#A8A9AD] leading-tight">{formatTime(startTime)}</div>
                    {instructor && <div className="text-[9px] text-[#A8A9AD] truncate leading-tight">{instructor}</div>}
                    {cls.room && <div className="text-[9px] text-[#A8A9AD] truncate leading-tight">{cls.room}</div>}
                    {cancelled && <div className="text-[9px] text-red-400 font-bold">CANCELLED</div>}
                    {exception && !cancelled && <div className="text-[9px] text-[#C9A84C] font-bold">OVERRIDE</div>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}