import { formatTime } from "@/lib/constants";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TrialCalendarGrid({ classes, selectedClass, selectedDate, onSelectClass }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dayName = DAYS[date.getDay()];
    const dayClasses = classes.filter((cls) => cls.day_of_week === dayName);
    return { date, dateStr, dayName, dayClasses };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {upcomingDays.map((day, idx) => {
        const isToday = idx === 0;
        const isTomorrow = idx === 1;
        const label = isToday ? "Today" : isTomorrow ? "Tomorrow" : DAY_ABBR[day.date.getDay()];
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
            <div className="space-y-2 flex-1">
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
  );
}