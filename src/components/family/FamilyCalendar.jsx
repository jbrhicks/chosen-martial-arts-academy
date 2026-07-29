import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, Calendar, Clock } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function FamilyCalendar() {
  const { familyGroup } = useFamily();
  const [classes, setClasses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [activeClasses, regs] = await Promise.all([
          base44.entities.ClassSchedule.filter({ is_active: true }).catch(() => []),
          base44.entities.EventRegistration.filter({ family_id: familyGroup?.id }).catch(() => []),
        ]);
        setClasses(activeClasses);
        const now = new Date();
        setRegistrations(
          regs
            .filter(r => r.status !== "cancelled" && new Date(r.event_date) >= now)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        );
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [familyGroup?.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  const classesByDay = DAYS.map(day => ({
    day,
    items: classes
      .filter(c => c.day_of_week === day)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Family Schedule</h2>
        <p className="text-sm text-[#A8A9AD]">Weekly classes and upcoming events for your family.</p>
      </div>

      {/* Upcoming Events */}
      {registrations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Upcoming Event Registrations</h3>
          <div className="space-y-2">
            {registrations.slice(0, 10).map(r => (
              <div key={r.id} className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 flex items-start gap-3">
                <Calendar size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.event_title}</p>
                  <p className="text-xs text-[#A8A9AD] mt-1">
                    {new Date(r.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-[#A8A9AD]">Registered: {r.user_name || r.student_name}</p>
                </div>
                <span className={`text-[10px] tracking-widest uppercase font-medium px-2 py-1 ${
                  r.status === "registered" ? "text-green-400" : r.status === "waitlisted" ? "text-yellow-400" : "text-[#A8A9AD]"
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Class Schedule */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Weekly Class Schedule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {classesByDay.map(({ day, items }) => (
            <div key={day} className="border border-[#A8A9AD]/20 bg-black p-3">
              <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] font-bold mb-2">{day.slice(0, 3)}</p>
              {items.length === 0 ? (
                <p className="text-xs text-[#A8A9AD]/50">No classes</p>
              ) : (
                <div className="space-y-2">
                  {items.map(c => (
                    <div key={c.id} className="text-xs">
                      <p className="font-medium text-white">{c.class_name}</p>
                      <p className="text-[#A8A9AD] flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {c.start_time}
                      </p>
                      {c.instructor && <p className="text-[#A8A9AD]/70 mt-0.5">{c.instructor}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}