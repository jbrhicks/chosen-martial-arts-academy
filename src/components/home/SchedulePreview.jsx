import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DAYS_OF_WEEK } from "@/lib/constants";
import ScrollReveal from "@/components/ScrollReveal";

export default function SchedulePreview() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ClassSchedule.list()
      .then((data) => {
        setClasses(data.filter((c) => c.is_active !== false));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const todayName = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayClasses = classes.filter((c) => c.day_of_week === todayName).slice(0, 3);

  return (
    <section className="py-24 bg-black border-y border-[#A8A9AD]/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#C9A84C]" />
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Weekly Training</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">Today's Classes</h2>
          </div>
          <Link to="/schedule" className="group inline-flex items-center gap-2 text-sm tracking-widest uppercase text-[#C9A84C] hover:text-[#E0C97A] transition-colors">
            View Full Schedule
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </ScrollReveal>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : todayClasses.length === 0 ? (
          <div className="border border-[#A8A9AD]/20 p-12 text-center">
            <p className="text-[#A8A9AD]">No classes scheduled for today. Check the full weekly schedule.</p>
          </div>
        ) : (
          <div className="space-y-px bg-[#A8A9AD]/20">
            {todayClasses.map((cls) => (
              <ScrollReveal key={cls.id} className="bg-[#0A0A0A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black transition-colors">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{cls.class_name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#A8A9AD]">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {cls.start_time}{cls.end_time ? ` – ${cls.end_time}` : ""}</span>
                    {cls.instructor && <span>• {cls.instructor}</span>}
                    {cls.age_group && <span>• {cls.age_group}</span>}
                  </div>
                </div>
                {cls.location && (
                  <span className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-[#C9A84C]">
                    <MapPin size={14} /> {cls.location}
                  </span>
                )}
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}