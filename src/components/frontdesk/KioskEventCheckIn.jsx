import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, ArrowLeft, Search, Calendar, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function KioskEventCheckIn({ onBack, selectedEvent, setSelectedEvent }) {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checkingIn, setCheckingIn] = useState(null);
  const [checkedInName, setCheckedInName] = useState("");

  useEffect(() => {
    if (!selectedEvent) {
      loadEvents();
    } else {
      loadRegistrations(selectedEvent);
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const all = await base44.entities.Event.list();
      const upcoming = all
        .filter((e) => new Date(e.start_date) >= new Date())
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      setEvents(upcoming);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadRegistrations = async (event) => {
    setLoading(true);
    try {
      const regs = await base44.entities.EventRegistration.filter({ event_id: event.id });
      regs.sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date));
      setRegistrations(regs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCheckIn = async (reg) => {
    setCheckingIn(reg.id);
    try {
      await base44.entities.EventRegistration.update(reg.id, {
        status: "checked-in",
        checked_in_date: new Date().toISOString(),
      });
      setCheckedInName(reg.student_name);
      setTimeout(() => {
        setCheckedInName("");
        loadRegistrations(selectedEvent);
      }, 2000);
    } catch (e) {
      alert("Failed to check in: " + e.message);
    }
    setCheckingIn(null);
  };

  const filtered = registrations.filter((reg) => {
    if (reg.status !== "registered") return false;
    if (search) {
      const name = (reg.student_name || "").toLowerCase();
      const email = (reg.user_email || "").toLowerCase();
      return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    }
    return true;
  });

  const canCheckIn = filtered.filter((reg) => reg.status === "registered").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="text-[#A8A9AD] hover:text-[#C9A84C] flex items-center gap-2 mb-8">
            <ArrowLeft size={20} />
            Back to Home
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">Event Check-In</h1>
          <p className="text-[#A8A9AD] mb-8">Select your event to check in</p>

          <div className="grid md:grid-cols-2 gap-4">
            {events.map((event) => {
              const eventDate = new Date(event.start_date);
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="border border-[#A8A9AD]/20 p-6 text-left hover:border-[#C9A84C]/40 transition-colors bg-[#1a1a1a]"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#A8A9AD]">
                    <Calendar size={14} className="text-[#C9A84C]" />
                    {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </button>
              );
            })}
            {events.length === 0 && (
              <div className="col-span-full border border-[#A8A9AD]/20 p-12 text-center bg-[#1a1a1a]">
                <p className="text-[#A8A9AD]">No upcoming events.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (checkedInName) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-[#C9A84C]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">You're Checked In!</h1>
          <p className="text-xl text-[#C9A84C] mb-8">{checkedInName}</p>
          <p className="text-[#A8A9AD]">Thank you for attending {selectedEvent.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-[#A8A9AD] hover:text-[#C9A84C] flex items-center gap-2">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">{selectedEvent.title}</h1>
        </div>

        <div className="mb-6 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by your name or email..."
            className="pl-12 bg-[#1a1a1a] border border-[#A8A9AD]/30 text-white h-14 text-lg"
            autoFocus
          />
        </div>

        {canCheckIn === 0 && filtered.length === 0 ? (
          <div className="border border-[#A8A9AD]/20 p-12 text-center bg-[#1a1a1a]">
            <p className="text-[#A8A9AD] text-lg">No registrations found.</p>
          </div>
        ) : canCheckIn === 0 ? (
          <div className="border border-[#A8A9AD]/20 p-12 text-center bg-[#1a1a1a]">
            <UserCheck size={48} className="mx-auto mb-4 text-green-400" />
            <p className="text-white text-lg font-bold mb-2">Already Checked In</p>
            <p className="text-[#A8A9AD]">You are already checked in for this event.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((reg) => (
              <button
                key={reg.id}
                onClick={() => handleCheckIn(reg)}
                disabled={checkingIn === reg.id}
                className="border border-[#A8A9AD]/20 p-6 text-left hover:border-[#C9A84C]/40 transition-colors bg-[#1a1a1a] disabled:opacity-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{reg.student_name}</h3>
                  {checkingIn === reg.id ? (
                    <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
                  ) : (
                    <CheckCircle size={20} className="text-[#C9A84C]" />
                  )}
                </div>
                <p className="text-sm text-[#A8A9AD] mb-1">{reg.user_email}</p>
                {reg.student_belt_rank && (
                  <p className="text-xs text-[#C9A84C]">{reg.student_belt_rank}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}