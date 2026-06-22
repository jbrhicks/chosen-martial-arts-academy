import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { EVENT_TYPES } from "@/lib/constants";
import { Calendar, MapPin, ExternalLink, Loader2 } from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Event.list()
      .then((data) => {
        const now = new Date();
        const upcoming = data
          .filter((e) => new Date(e.start_date) >= now)
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        setEvents(upcoming);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">What's Happening</p>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Tournaments, seminars, belt tests, and more.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : events.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No upcoming events. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const typeInfo = EVENT_TYPES[event.event_type] || EVENT_TYPES.seminar;
            const eventDate = new Date(event.start_date);
            return (
              <div key={event.id} className="border border-[#A8A9AD]/20 p-6 hover:border-[#C9A84C]/40 transition-colors">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Date block */}
                  <div className="shrink-0 w-16 h-16 border-2 border-[#C9A84C] flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-[#C9A84C] leading-none">
                      {eventDate.toLocaleDateString("en-US", { day: "numeric" })}
                    </span>
                    <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mt-1">
                      {eventDate.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-1">
                        {typeInfo.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                    {event.description && <p className="text-sm text-[#A8A9AD] mb-3 leading-relaxed">{event.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#A8A9AD]">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#C9A84C]" />
                        {eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        {" at "}
                        {eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#C9A84C]" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.registration_url && (
                      <a
                        href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors"
                      >
                        Register <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}