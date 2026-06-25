import { Clock, Calendar } from "lucide-react";

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function ClassFilter({ todayClasses, selectedClass, onSelectClass, currentClassName }) {
  if (todayClasses.length === 0) return null;

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-[#C9A84C]" />
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#C9A84C]">Filter by Class</h3>
        {currentClassName && (
          <span className="text-xs text-[#A8A9AD] ml-auto flex items-center gap-1">
            <Clock size={12} className="text-[#C9A84C]" />
            Live: {currentClassName}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectClass("all")}
          className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors ${selectedClass === "all" ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"}`}
        >
          All Checked In
        </button>
        {todayClasses.map(cls => {
          const isCurrent = cls.class_name === currentClassName;
          const isSelected = selectedClass === cls.class_name;
          return (
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.class_name)}
              className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors flex items-center gap-2 ${isSelected ? "bg-[#C9A84C] text-black" : isCurrent ? "border border-[#C9A84C]/50 text-[#C9A84C] hover:bg-[#C9A84C]/10" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"}`}
            >
              {isCurrent && <Clock size={12} className={isSelected ? "text-black" : "text-[#C9A84C]"} />}
              <span>{cls.class_name}</span>
              <span className="opacity-60">{formatTime(cls.start_time)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}