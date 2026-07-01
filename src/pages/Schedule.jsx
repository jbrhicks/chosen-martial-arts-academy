import { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK, formatTime } from "@/lib/constants";
import ScrollReveal from "@/components/ScrollReveal";
import { Clock, MapPin, User, Loader2, Users, CalendarCheck } from "lucide-react";
import { getClassColor } from "@/lib/scheduleUtils";
import { AGE_PRESETS } from "@/lib/constants";
import LeadSection from "@/components/home/LeadSection";

export default function Schedule() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("All");

  useEffect(() => {
    base44.entities.ClassSchedule.list()
      .then((data) => {
        setClasses(data.filter((c) => c.is_active !== false));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeDay === "All" ? classes : classes.filter((c) => c.day_of_week === activeDay);
  const grouped = DAYS_OF_WEEK.map((day) => ({
    day,
    items: classes.filter((c) => c.day_of_week === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  }));

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-20 bg-black border-b border-[#A8A9AD]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#C9A84C]" />
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Weekly Schedule</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">Class Schedule</h1>
            <p className="text-lg text-[#A8A9AD] max-w-2xl">
              Find your training time. All levels welcome — from first-day beginners to advanced black belts.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Day filter */}
      <section className="sticky top-20 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#A8A9AD]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {["All", ...DAYS_OF_WEEK].map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-5 py-2 text-xs tracking-widest uppercase font-medium whitespace-nowrap transition-all ${
                  activeDay === day
                    ? "bg-[#C9A84C] text-black"
                    : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule grid */}
      <section className="py-16 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
            </div>
          ) : activeDay === "All" ? (
            <div className="space-y-12">
              {grouped.map((group) =>
                group.items.length > 0 ? (
                  <div key={group.day}>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <span className="text-[#C9A84C]">{group.day}</span>
                      <span className="h-px flex-1 bg-[#A8A9AD]/20" />
                      <span className="text-sm text-[#A8A9AD] font-normal">{group.items.length} class{group.items.length > 1 ? "es" : ""}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
            </div>
          )}
        </div>
      </section>
        <LeadSection />
    </PublicLayout>
  );
}

function ClassCard({ cls }) {
  const color = getClassColor(cls);
  const ageLabel = cls.age_preset && cls.age_preset !== "All Ages"
    ? (AGE_PRESETS.find(p => p.value === cls.age_preset)?.label || cls.age_preset)
    : cls.age_preset === "Custom" && cls.min_age
      ? `Ages ${cls.min_age}${cls.max_age ? `–${cls.max_age}` : "+"}`
      : null;

  return (
    <div className="border border-[#A8A9AD]/20 p-6 hover:border-[#C9A84C]/40 transition-colors group" style={{ borderTopColor: color, borderTopWidth: 3 }}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold group-hover:text-[#C9A84C] transition-colors">{cls.class_name}</h3>
        {cls.belt_level && cls.belt_level !== "All Belts" && (
          <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/30 px-2 py-1">
            {cls.belt_level}
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm text-[#A8A9AD]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#C9A84C]" />
          {formatTime(cls.start_time)}{cls.end_time ? ` – ${formatTime(cls.end_time)}` : ""}
        </div>
        {cls.instructor && (
          <div className="flex items-center gap-2">
            <User size={14} className="text-[#C9A84C]" />
            {cls.instructor}
          </div>
        )}
        {cls.location && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#C9A84C]" />
            {cls.location}
          </div>
        )}
        {ageLabel && (
          <div className="flex items-center gap-2">
            <Users size={14} style={{ color }} />
            <span className="text-[10px] tracking-widest uppercase font-medium" style={{ color }}>{ageLabel}</span>
          </div>
        )}
      </div>
      {cls.is_trial_eligible && (
        <a
          href="#lead-form"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = `lead-form?class=${cls.id}`;
            document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#C9A84C] text-[#C9A84C] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A84C] hover:text-black transition-colors"
        >
          <CalendarCheck size={14} /> Book a Free Trial
        </a>
      )}
    </div>
  );
}