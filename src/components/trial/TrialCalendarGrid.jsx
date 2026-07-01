import { useState } from "react";
import { formatTime } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_WEEKS_AHEAD = 12;

function toDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function TrialCalendarGrid({ classes, selectedClass, selectedDate, onSelectClass }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = toDateString(date);
    const dayName = DAYS[date.getDay()];
    const dayClasses = classes.filter((cls) => cls.day_of_week === dayName);
    return { date, dateStr, dayName, dayClasses };
  });

  const monthLabel = weekDays[0].date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const rangeEnd = weekDays[6].date;
  const showRange = weekDays[0].date.getMonth() !== rangeEnd.getMonth();
  const rangeLabel = showRange
    ? `${weekDays[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : `${weekDays[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${rangeEnd.toLocaleDateString("en-US", { day: "numeric" })}`;

  const canGoBack = weekOffset > 0;
  const canGoForward = weekOffset < MAX_WEEKS_AHEAD;

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => canGoBack && setWeekOffset(weekOffset - 1)}
          disabled={!canGoBack}
          className="p-2 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{monthLabel}</p>
          <p className="text-xs text-[#A8A9AD]">{rangeLabel}</p>
        </div>
        <button
          onClick={() => canGoForward && setWeekOffset(weekOffset + 1)}
          disabled={!canGoForward}
          className="p-2 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isToday = toDateString(day.date) === toDateString(today);
          const label = isToday ? "Today" : DAY_ABBR[day.date.getDay()];
          return (
            <div
              key={day.dateStr}
              className={`flex flex-col ${day.dayClasses.length === 0 ? "opacity-40" : ""}`}
            >
              <div className="text-center pb-2 mb-2 border-b border-[#A8A9AD]/20">
                <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{label}</p>
                <p className="text-sm font-bold text-white">
                  {day.date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                </p>
              </div>
              <div className="space-y-2 flex-1 min-h-[60px]">
                {day.dayClasses.length === 0 ? (
                  <p className="text-[10px] text-[#A8A9AD]/50 text-center py-4">No classes</p>
                ) : (
                  day.dayClasses.map((cls) => {
                    const isSelected = selectedClass?.id === cls.id && selectedDate === day.dateStr;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => onSelectClass(cls, day.dateStr)}
                        className={`w-full text-left p-2 border transition-all ${
                          isSelected
                            ? "border-[#C9A84C] bg-[#C9A84C]/10"
                            : "border-[#A8A9AD]/20 hover:border-[#C9A84C]/50"
                        }`}
                      >
                        <p className="text-xs font-bold text-white leading-tight">{cls.class_name}</p>
                        <p className="text-[10px] text-[#C9A84C] mt-1">{formatTime(cls.start_time)}</p>
                        {cls.instructor && (
                          <p className="text-[9px] text-[#A8A9AD] mt-0.5 truncate">{cls.instructor}</p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {weekOffset === MAX_WEEKS_AHEAD && (
        <p className="text-center text-xs text-[#A8A9AD] mt-4">
          Maximum booking window reached. For dates further out, please call us at (555) 123-4567.
        </p>
      )}
    </div>
  );
}