import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Calendar, MapPin, Loader2, Lock, QrCode, CalendarPlus, Ticket } from "lucide-react";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";

const RANK_ORDER = {
  "White": 1, "White w/ Black Stripe": 2, "Orange": 3, "Orange w/ White Stripe": 4,
  "Green": 5, "Green w/ White Stripe": 6, "Brown": 7, "Brown w/ White Stripe": 8,
  "Red": 9, "Red w/ White Stripe": 10, "Blue": 11, "1st Degree Black Belt": 12
};

function getCalendarUrl(event) {
  const start = new Date(event.start_date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = event.end_date
    ? new Date(event.end_date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    : new Date(new Date(event.start_date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
    loadMyRegistrations();
  }, [user]);

  const loadEvents = async () => {
    try {
      const all = await base44.entities.Event.list();
      const now = new Date();
      const upcoming = all.filter((e) => {
        if (new Date(e.start_date) < now) return false;
        if (e.target_audience_rank_id && user.belt_rank) {
          const requiredRank = RANK_ORDER[e.target_audience_rank_name] || 0;
          const userRank = RANK_ORDER[user.belt_rank] || 0;
          if (userRank < requiredRank) return false;
        }
        if (e.min_age > 0 && user.age != null && user.age < e.min_age) return false;
        if (e.max_age > 0 && user.age != null && user.age > e.max_age) return false;
        return true;
      }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      setEvents(upcoming);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMyRegistrations = async () => {
    try {
      const regs = await base44.entities.EventRegistration.filter({ user_id: user.id });
      const active = regs.filter(r => r.status === "registered" || r.status === "checked-in" || r.status === "waitlisted");
      active.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      setMyRegistrations(active);
    } catch (e) { console.error(e); }
  };

  const upcomingRegs = myRegistrations.filter(r => new Date(r.event_date) >= new Date());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">What's Happening</p>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Tournaments, seminars, belt tests, and more.</p>
      </div>

      {upcomingRegs.length > 0 && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={18} className="text-[#C9A84C]" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">My Tickets</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingRegs.map((reg) => (
              <div key={reg.id} className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-4 flex gap-4">
                {reg.ticket_qr_hash && (
                  <div className="shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(reg.ticket_qr_hash)}`}
                      alt="QR Ticket"
                      className="w-[100px] h-[100px] border border-[#A8A9AD]/20"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{reg.event_title}</p>
                  <p className="text-xs text-[#A8A9AD] mt-1">{reg.student_name}</p>
                  <p className="text-xs text-[#A8A9AD]">{new Date(reg.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  <div className="mt-2">
                    {reg.status === "registered" && <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-green-900/30 text-green-400">Registered</span>}
                    {reg.status === "checked-in" && <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-[#C9A84C]/20 text-[#C9A84C]">Checked In</span>}
                    {reg.status === "waitlisted" && <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-orange-900/30 text-orange-400">Waitlist #{reg.waitlist_position}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : events.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <p className="text-[#A8A9AD]">No upcoming events. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const eventDate = new Date(event.start_date);
            return (
              <div key={event.id} className="border border-[#A8A9AD]/20 p-6 hover:border-[#C9A84C]/40 transition-colors">
                <div className="flex flex-col sm:flex-row gap-6">
                  {event.image_url && (
                    <div className="shrink-0 w-full sm:w-48 h-32 sm:h-48">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover rounded-lg border border-[#A8A9AD]/20" />
                    </div>
                  )}

                  <div className={`shrink-0 w-16 h-16 border-2 border-[#C9A84C] flex flex-col items-center justify-center ${!event.image_url ? 'sm:ml-0' : ''}`}>
                    <span className="text-xl font-bold text-[#C9A84C] leading-none">{eventDate.toLocaleDateString("en-US", { day: "numeric" })}</span>
                    <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mt-1">{eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-1">{event.event_type.replace("-", " ")}</span>
                      {event.min_age > 0 || event.max_age > 0 ? (
                        <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/30 px-2 py-1">
                          {event.min_age > 0 && event.max_age > 0 ? `Ages ${event.min_age}-${event.max_age}` : event.min_age > 0 ? `Ages ${event.min_age}+` : `Under ${event.max_age}`}
                        </span>
                      ) : null}
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
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        disabled={event.target_audience_rank_id && !user.belt_rank}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Register
                        {event.target_audience_rank_id && <Lock size={14} />}
                      </button>
                      <a
                        href={getCalendarUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-[#A8A9AD] font-bold text-xs tracking-widest uppercase hover:text-white hover:border-[#C9A84C]/50 transition-colors"
                      >
                        <CalendarPlus size={14} />
                        Add to Calendar
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedEvent && user && (
        <EventRegistrationModal
          event={selectedEvent}
          user={user}
          onClose={() => setSelectedEvent(null)}
          onRegistered={() => {
            setSelectedEvent(null);
            loadEvents();
            loadMyRegistrations();
          }}
        />
      )}
    </div>
  );
}