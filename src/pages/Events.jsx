import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, MapPin, Users, DollarSign, Lock, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";
import GuestRegistrationModal from "@/components/events/GuestRegistrationModal";
import { useAuth } from "@/lib/AuthContext";

export default function Events() {
  const { isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationMode, setRegistrationMode] = useState(null); // 'member' or 'guest'
  const [filter, setFilter] = useState("all");
  const [regCounts, setRegCounts] = useState({});

  const load = async () => {
    try {
      const all = await base44.entities.Event.filter({ is_public: true, status: "active" });
      all.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      setEvents(all);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (events.length > 0) loadRegCounts();
  }, [events]);

  const loadRegCounts = async () => {
    try {
      const regs = await base44.entities.EventRegistration.list();
      const counts = {};
      regs.forEach(r => {
        if (r.status === "registered" || r.status === "checked-in") {
          counts[r.event_id] = (counts[r.event_id] || 0) + 1;
        }
      });
      setRegCounts(counts);
    } catch (e) { console.error(e); }
  };

  const filtered = events.filter((e) => {
    if (filter === "all") return true;
    return e.event_type === filter;
  });

  return (
    <PublicLayout>
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-[#A8A9AD] max-w-2xl mx-auto">
            Join us for tournaments, camps, seminars, and special training events. Open to the public!
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all" ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter("camp")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "camp" ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white"
            }`}
          >
            Camps
          </button>
          <button
            onClick={() => setFilter("tournament")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "tournament" ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white"
            }`}
          >
            Tournaments
          </button>
          <button
            onClick={() => setFilter("single-day")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "single-day" ? "text-[#C9A84C]" : "text-[#A8A9AD] hover:text-white"
            }`}
          >
            Seminars
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto text-[#A8A9AD]/40 mb-4" />
            <p className="text-[#A8A9AD]">No upcoming events at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <div key={event.id} className="border border-[#A8A9AD]/20 bg-[#0A0A0A] overflow-hidden hover:border-[#C9A84C]/30 transition-colors">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 text-xs uppercase tracking-wider rounded bg-[#C9A84C]/10 text-[#C9A84C]">
                      {event.event_type.replace("-", " ")}
                    </span>
                    {event.target_audience_rank_id && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <Lock size={12} />
                        Rank Required
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-sm text-[#A8A9AD] mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm text-[#A8A9AD] mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(event.start_date).toLocaleDateString("en-US", { 
                        weekday: "short", 
                        month: "short", 
                        day: "numeric",
                        year: "numeric"
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        {event.location}
                      </div>
                    )}
                    {event.max_capacity > 0 && (
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        {(() => {
                          const remaining = event.max_capacity - (regCounts[event.id] || 0);
                          if (remaining <= 0) return <span className="text-red-400 font-bold">SOLD OUT — Join Waitlist</span>;
                          if (remaining <= 5) return <span className="text-orange-400 font-bold">⚠ Only {remaining} spots left!</span>;
                          return `Max ${event.max_capacity} participants`;
                        })()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} />
                      {event.price > 0 ? `$${event.price}` : "Free"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isAuthenticated ? (
                      <Button
                        onClick={() => {
                          setSelectedEvent(event);
                          setRegistrationMode("member");
                        }}
                        className="w-full bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A]"
                      >
                        Register (Member)
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedEvent(event);
                          setRegistrationMode("guest");
                        }}
                        className="w-full bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A]"
                      >
                        Register as Guest
                      </Button>
                    )}
                    {!isAuthenticated && (
                      <a
                        href="/login"
                        className="block text-center text-xs text-[#A8A9AD] hover:text-white transition-colors"
                      >
                        Already a member? Log in
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedEvent && registrationMode === "member" && user && (
          <EventRegistrationModal
            event={selectedEvent}
            user={user}
            onClose={() => {
              setSelectedEvent(null);
              setRegistrationMode(null);
            }}
            onRegistered={() => {
              setSelectedEvent(null);
              setRegistrationMode(null);
              load();
            }}
          />
        )}

        {selectedEvent && registrationMode === "guest" && (
          <GuestRegistrationModal
            event={selectedEvent}
            onClose={() => {
              setSelectedEvent(null);
              setRegistrationMode(null);
            }}
            onRegistered={() => {
              setSelectedEvent(null);
              setRegistrationMode(null);
              load();
            }}
          />
        )}
      </div>
    </div>
    </PublicLayout>
  );
}